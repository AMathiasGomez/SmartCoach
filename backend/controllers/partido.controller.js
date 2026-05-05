const db = require('../config/db');

exports.createPartido = async (req, res) => {
  try {
    let { nombre, equipo_id, rival, fecha, ubicacion, tipo, convocados } = req.body;

    tipo = tipo?.trim().toLowerCase();

    let cantidad_sets;

    if (tipo === 'amistoso') {
      cantidad_sets = 3;
    } else if (tipo === 'competencia') {
      cantidad_sets = 5;
    } else {
      return res.status(400).json({ message: 'Tipo inválido' });
    }

    const [result] = await db.query(
      `INSERT INTO partidos 
      (nombre, equipo_id, rival, fecha, ubicacion, tipo, cantidad_sets)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre, equipo_id, rival, fecha, ubicacion, tipo, cantidad_sets]
    );

    const partidoId = result.insertId;

    if (convocados && convocados.length > 0) {
      const values = convocados.map(jugadorId => [partidoId, jugadorId]);

      await db.query(
        `INSERT INTO partido_jugador (partido_id, jugador_id) VALUES ?`,
        [values]
      );
    }

    res.json({ message: 'Partido creado correctamente' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear partido' });
  }
};

exports.getPartidos = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.*,
        e.nombre AS equipo_nombre
      FROM partidos p
      JOIN equipos e ON p.equipo_id = e.id
      ORDER BY p.fecha DESC
    `);

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener partidos' });
  }
};

exports.getPartidoById = async (req, res) => {
  const { id } = req.params;

  const [rows] = await db.query(`
    SELECT 
      p.*,
      e.nombre AS equipo_nombre
    FROM partidos p
    JOIN equipos e ON p.equipo_id = e.id
    WHERE p.id = ?
  `, [id]);

  if (rows.length === 0) {
    return res.status(404).json({ message: 'Partido no encontrado' });
  }

  res.json(rows[0]);
};

exports.updatePartido = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, rival, fecha, ubicacion, tipo } = req.body;

    await db.query(`
      UPDATE partidos
      SET nombre=?, rival=?, fecha=?, ubicacion=?, tipo=?
      WHERE id=?
    `, [nombre, rival, fecha, ubicacion, tipo, id]);

    res.json({ message: 'Partido actualizado' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar partido' });
  }
};

exports.deletePartido = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Primero eliminar la tabla que depende de sets_partido
    await db.query(`
      DELETE ejs FROM estadisticas_jugador_set ejs
      INNER JOIN sets_partido sp ON ejs.set_id = sp.id
      WHERE sp.partido_id = ?
    `, [id]);

    // 2. Luego las demás dependencias de partidos
    await db.query('DELETE FROM estadisticas_jugador WHERE partido_id = ?', [id]);
    await db.query('DELETE FROM estadisticas_partido WHERE partido_id = ?', [id]);
    await db.query('DELETE FROM partido_jugador WHERE partido_id = ?', [id]);
    await db.query('DELETE FROM sets_partido WHERE partido_id = ?', [id]);

    // 3. Finalmente el partido
    const [result] = await db.query('DELETE FROM partidos WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Partido no encontrado' });
    }

    res.json({ message: 'Partido eliminado' });

  } catch (error) {
    console.error('ERROR DELETE:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateEstado = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  await db.query(`
    UPDATE partidos SET estado = ?
    WHERE id = ?
  `, [estado, id]);

  res.json({ message: 'Estado actualizado' });
};

exports.getSets = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(`
      SELECT * FROM sets_partido
      WHERE partido_id = ?
      ORDER BY numero_set ASC
    `, [id]);

    res.json(rows);

  } catch (error) {
    console.error('ERROR GET SETS:', error);
    res.status(500).json({ message: 'Error al obtener sets' });
  }
};

exports.addSet = async (req, res) => {
  let totales = []

  try {
    const { id } = req.params; // partido_id
    let { puntos_equipo, puntos_rival } = req.body;

    puntos_equipo = Number(puntos_equipo);
    puntos_rival = Number(puntos_rival);

    // 1. Validar datos básicos
    if (isNaN(puntos_equipo) || isNaN(puntos_rival)) {
      return res.status(400).json({
        message: 'Puntos inválidos'
      });
    }

    if (puntos_equipo === puntos_rival) {
      return res.status(400).json({
        message: 'No puede haber empate en un set'
      });
    }

    // 2. Validar partido
    const [partidoRows] = await db.query(
      'SELECT cantidad_sets, estado FROM partidos WHERE id = ?',
      [id]
    );

    if (partidoRows.length === 0) {
      return res.status(404).json({ message: 'Partido no encontrado' });
    }

    const partido = partidoRows[0];

    // 🚨 3. No permitir si ya terminó
    if (partido.estado === 'finalizado') {
      return res.status(400).json({
        message: 'El partido ya finalizó'
      });
    }

    // 4. Contar sets actuales
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM sets_partido WHERE partido_id = ?',
      [id]
    );

    const numero_set = countResult[0].total + 1;

    // 🚨 5. Validar límite de sets
    if (numero_set > partido.cantidad_sets) {
      return res.status(400).json({
        message: 'Se superó la cantidad máxima de sets'
      });
    }

    // 🔥 6. VALIDACIÓN REAL DE VOLEIBOL

    const esUltimoSet = numero_set === partido.cantidad_sets;

    let puntosMinimos = esUltimoSet ? 15 : 25;
    let max = Math.max(puntos_equipo, puntos_rival);
    let min = Math.min(puntos_equipo, puntos_rival);

    // Debe alcanzar el mínimo
    if (max < puntosMinimos) {
      return res.status(400).json({
        message: `El set debe llegar mínimo a ${puntosMinimos} puntos`
      });
    }

    // Debe haber diferencia de 2
    if ((max - min) < 2) {
      return res.status(400).json({
        message: 'Debe haber una diferencia mínima de 2 puntos'
      });
    }

    // 7. Insertar set
    const [insertResult] = await db.query(`
      INSERT INTO sets_partido 
      (partido_id, numero_set, puntos_equipo, puntos_rival)
      VALUES (?, ?, ?, ?)
    `, [id, numero_set, puntos_equipo, puntos_rival]);

    const setId = insertResult.insertId;

    // 🔥 8. Obtener sets actualizados
    const [sets] = await db.query(`
      SELECT puntos_equipo, puntos_rival
      FROM sets_partido
      WHERE partido_id = ?
    `, [id]);

    let ganadosEquipo = 0;
    let ganadosRival = 0;

    sets.forEach(s => {
      if (s.puntos_equipo > s.puntos_rival) ganadosEquipo++;
      else ganadosRival++;
    });

    const setsParaGanar = Math.ceil(partido.cantidad_sets / 2);

    // 🔥 9. Determinar ganador
    let ganador = null;

    if (ganadosEquipo === setsParaGanar) {
      ganador = 'equipo';
    } else if (ganadosRival === setsParaGanar) {
      ganador = 'rival';
    }

    // 🔥 10. Cerrar partido si hay ganador
    if (ganador) {
      await db.query(`
    UPDATE partidos 
    SET estado = 'finalizado', ganador = ?
    WHERE id = ?
  `, [ganador, id]);

      // ← NUEVO: calcular totales y guardar en estadisticas_jugador
      const [totales] = await db.query(`
    SELECT 
      ejs.jugador_id,
      SUM(ejs.ataques)     AS ataques,
      SUM(ejs.recepciones) AS recepciones,
      SUM(ejs.errores)     AS errores,
      SUM(ejs.bloqueos)    AS bloqueos
    FROM estadisticas_jugador_set ejs
    JOIN sets_partido sp ON ejs.set_id = sp.id
    WHERE sp.partido_id = ?
    GROUP BY ejs.jugador_id
  `, [id]);

      for (const stat of totales) {
        await db.query(`
      INSERT INTO estadisticas_jugador 
        (jugador_id, partido_id, ataques, recepciones, errores, bloqueos)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        ataques     = VALUES(ataques),
        recepciones = VALUES(recepciones),
        errores     = VALUES(errores),
        bloqueos    = VALUES(bloqueos)
    `, [stat.jugador_id, id, stat.ataques, stat.recepciones, stat.errores, stat.bloqueos]);
      }
    }

    res.json({
      message: 'Set agregado correctamente',
      numero_set,
      set_id: setId,
      marcador: `${ganadosEquipo} - ${ganadosRival}`,
      ganador_partido: ganador || null,
      totales_jugadores: ganador ? totales : null
    });

  } catch (error) {
    console.error('ERROR ADD SET:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.addEstadisticas = async (req, res) => {
  try {
    const { id } = req.params; // partido_id
    const { jugador_id, ataques, recepciones, errores, bloqueos } = req.body;

    const [rows] = await db.query(`
      SELECT 
        jugador_id,
        SUM(ataques) as ataques,
        SUM(recepciones) as recepciones,
        SUM(errores) as errores,
        SUM(bloqueos) as bloqueos
      FROM estadisticas_jugador_set
      JOIN sets_partido ON sets_partido.id = estadisticas_jugador_set.set_id
      WHERE sets_partido.partido_id = ?
      GROUP BY jugador_id;
    `, [jugador_id, id]);

    if (rows.length > 0) {
      await db.query(`
        UPDATE estadisticas_jugador SET
          ataques = ataques + ?,
          recepciones = recepciones + ?,
          errores = errores + ?,
          bloqueos = bloqueos + ?
        WHERE jugador_id = ? AND partido_id = ?
      `, [ataques, recepciones, errores, bloqueos, jugador_id, id]);

    } else {
      await db.query(`
        INSERT INTO estadisticas_jugador 
        (jugador_id, partido_id, ataques, recepciones, errores, bloqueos)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [jugador_id, id, ataques, recepciones, errores, bloqueos]);
    }

    res.json({ message: 'Estadísticas actualizadas' });

  } catch (error) {
    console.error('ERROR ESTADISTICAS:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.addEstadisticasPorSet = async (req, res) => {
  try {
    const { set_id } = req.params;
    const { jugador_id, ataques, recepciones, errores, bloqueos } = req.body;

    // 1. Validar que el set existe
    const [setRows] = await db.query(
      'SELECT id FROM sets_partido WHERE id = ?',
      [set_id]
    );

    if (setRows.length === 0) {
      return res.status(404).json({ message: 'Set no encontrado' });
    }

    // 2. Verificar si ya existen stats
    const [rows] = await db.query(`
      SELECT * FROM estadisticas_jugador_set
      WHERE jugador_id = ? AND set_id = ?
    `, [jugador_id, set_id]);

    if (rows.length > 0) {
      // 🔥 actualizar acumulando
      await db.query(`
        UPDATE estadisticas_jugador_set SET
          ataques = ataques + ?,
          recepciones = recepciones + ?,
          errores = errores + ?,
          bloqueos = bloqueos + ?
        WHERE jugador_id = ? AND set_id = ?
      `, [ataques, recepciones, errores, bloqueos, jugador_id, set_id]);

    } else {
      // 🔥 insertar
      await db.query(`
        INSERT INTO estadisticas_jugador_set
        (jugador_id, set_id, ataques, recepciones, errores, bloqueos)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [jugador_id, set_id, ataques, recepciones, errores, bloqueos]);
    }

    res.json({ message: 'Estadísticas por set actualizadas' });

  } catch (error) {
    console.error('ERROR ESTADISTICAS SET:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getEstadisticas = async (req, res) => {
  const { id } = req.params;

  const [rows] = await db.query(`
    SELECT 
      e.*,
      j.nombre AS jugador_nombre
    FROM estadisticas_jugador e
    JOIN jugadores j ON e.jugador_id = j.id
    WHERE e.partido_id = ?
  `, [id]);

  res.json(rows);
};

// Get aggregated statistics for a specific player across all matches
exports.getEstadisticasJugador = async (req, res) => {
  try {
    const { id } = req.params; // jugador_id

    // Get all matches the player has stats for
    const [rows] = await db.query(`
      SELECT 
        e.partido_id,
        p.nombre AS partido_nombre,
        p.fecha,
        p.rival,
        e.ataques,
        e.recepciones,
        e.errores,
        e.bloqueos
      FROM estadisticas_jugador e
      JOIN partidos p ON e.partido_id = p.id
      WHERE e.jugador_id = ?
      ORDER BY p.fecha DESC
    `, [id]);

    // Calculate aggregated totals
    let total_ataques = 0;
    let total_recepciones = 0;
    let total_errores = 0;
    let total_bloqueos = 0;
    let partidos_jugados = rows.length;

    rows.forEach(row => {
      total_ataques += Number(row.ataques) || 0;
      total_recepciones += Number(row.recepciones) || 0;
      total_errores += Number(row.errores) || 0;
      total_bloqueos += Number(row.bloqueos) || 0;
    });

    res.json({
      jugador_id: id,
      partidos_jugados,
      partidos: rows,
      totales: {
        ataques: total_ataques,
        recepciones: total_recepciones,
        errores: total_errores,
        bloqueos: total_bloqueos
      }
    });

  } catch (error) {
    console.error('ERROR GET ESTADISTICAS JUGADOR:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas del jugador' });
  }
};

exports.getEstadisticasPorSets = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Get all sets for this match
    const [sets] = await db.query(`
      SELECT id, numero_set, puntos_equipo, puntos_rival
      FROM sets_partido
      WHERE partido_id = ?
      ORDER BY numero_set ASC
    `, [id]);

    if (sets.length === 0) {
      return res.json([]);
    }

    // 2. Get all players in the match for this partido_id
    const [jugadores] = await db.query(`
      SELECT j.id, j.nombre, j.numero
      FROM partido_jugador pj
      JOIN jugadores j ON pj.jugador_id = j.id
      WHERE pj.partido_id = ?
    `, [id]);

    // 3. For each set, get stats per player (include zero for players without stats)
    const setsData = await Promise.all(sets.map(async (set) => {
      // Get stats that exist
      const [statsRows] = await db.query(`
        SELECT 
          e.jugador_id,
          j.nombre,
          j.numero,
          COALESCE(e.ataques, 0) as ataques,
          COALESCE(e.recepciones, 0) as recepciones,
          COALESCE(e.errores, 0) as errores,
          COALESCE(e.bloqueos, 0) as bloqueos
        FROM estadisticas_jugador_set e
        JOIN jugadores j ON e.jugador_id = j.id
        WHERE e.set_id = ?
      `, [set.id]);

      // If no stats found, use all 0s - but we need to make sure we include all players
      // Instead of returning rows with no data, we'll build the full list of all players with 0s
      const playerStats = {};

      // Index existing stats by jugador_id
      statsRows.forEach(row => {
        playerStats[row.jugador_id] = row;
      });

      // Build full list with zeros for missing
      const fullStats = jugadores.map(jugador => {
        if (playerStats[jugador.id]) {
          return playerStats[jugador.id];
        } else {
          return {
            jugador_id: jugador.id,
            nombre: jugador.nombre,
            numero: jugador.numero,
            ataques: 0,
            recepciones: 0,
            errores: 0,
            bloqueos: 0
          };
        }
      });

      return {
        set_id: set.id,
        numero_set: set.numero_set,
        puntos_equipo: set.puntos_equipo,
        puntos_rival: set.puntos_rival,
        stats: fullStats
      };
    }));

    res.json(setsData);

  } catch (error) {
    console.error('ERROR GET ESTADISTICAS POR SETS:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas por sets' });
  }
};

exports.getJugadoresByPartido = async (req, res) => {
  try {
    const { partido_id } = req.params;

    const [jugadores] = await db.query(`
      SELECT j.id, j.nombre, j.numero, j.posicion
      FROM partido_jugador pj
      JOIN jugadores j ON pj.jugador_id = j.id
      WHERE pj.partido_id = ?
    `, [partido_id]);

    res.json(jugadores);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener jugadores del partido' });
  }
};

exports.saveAnalytics = async (req, res) => {
  try {
    const { analysis } = req.body;
    await db.query(
      'UPDATE partidos SET analytics_result = ? WHERE id = ?',
      [JSON.stringify(analysis), req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Error guardando analytics:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT analytics_result FROM partidos WHERE id = ?',
      [req.params.id]
    );
    const result = rows[0]?.analytics_result;

    res.json(result || null);
  } catch (err) {
    console.error('Error obteniendo analytics:', err.message);
    res.status(500).json({ error: err.message });
  }
};