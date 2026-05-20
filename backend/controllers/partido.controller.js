const db = require('../config/db');

const DETAILED_STAT_COLUMNS = [
  'ataques_positivos',
  'errores_ataque',
  'aces',
  'errores_saque',
  'bloqueos_positivos',
  'errores_bloqueo',
  'recepciones_positivas',
  'recepciones_negativas',
  'defensas_positivas',
  'defensas_negativas',
  'asistencias',
  'errores_armado',
];

function number(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function detailedStatsFromBody(body = {}) {
  return {
    ataques_positivos: number(body.ataques_positivos ?? body.ataques),
    errores_ataque: number(body.errores_ataque),
    aces: number(body.aces),
    errores_saque: number(body.errores_saque),
    bloqueos_positivos: number(body.bloqueos_positivos ?? body.bloqueos),
    errores_bloqueo: number(body.errores_bloqueo),
    recepciones_positivas: number(body.recepciones_positivas ?? body.recepciones),
    recepciones_negativas: number(body.recepciones_negativas),
    defensas_positivas: number(body.defensas_positivas),
    defensas_negativas: number(body.defensas_negativas),
    asistencias: number(body.asistencias),
    errores_armado: number(body.errores_armado),
  };
}

function legacyStatsFromDetailed(stats = {}) {
  return {
    ataques: number(stats.ataques_positivos),
    recepciones: number(stats.recepciones_positivas),
    bloqueos: number(stats.bloqueos_positivos),
    errores:
      number(stats.errores_ataque) +
      number(stats.errores_saque) +
      number(stats.errores_bloqueo) +
      number(stats.recepciones_negativas) +
      number(stats.defensas_negativas) +
      number(stats.errores_armado),
  };
}

function detailedSumSelect(alias = 'ejs') {
  return DETAILED_STAT_COLUMNS
    .map(column => `COALESCE(SUM(${alias}.${column}), 0) AS ${column}`)
    .join(',\n      ');
}

function detailedCoalesceSelect(alias = 'e') {
  return DETAILED_STAT_COLUMNS
    .map(column => `COALESCE(${alias}.${column}, 0) AS ${column}`)
    .join(',\n          ');
}

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
  let totalesJugadores = []

  try {
    const { id } = req.params;
    let { puntos_equipo, puntos_rival } = req.body;

    puntos_equipo = Number(puntos_equipo);
    puntos_rival = Number(puntos_rival);

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

    const [partidoRows] = await db.query(
      'SELECT cantidad_sets, estado FROM partidos WHERE id = ?',
      [id]
    );

    if (partidoRows.length === 0) {
      return res.status(404).json({ message: 'Partido no encontrado' });
    }

    const partido = partidoRows[0];

    if (partido.estado === 'finalizado') {
      return res.status(400).json({
        message: 'El partido ya finalizó'
      });
    }

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM sets_partido WHERE partido_id = ?',
      [id]
    );

    const numero_set = countResult[0].total + 1;

    if (numero_set > partido.cantidad_sets) {
      return res.status(400).json({
        message: 'Se superó la cantidad máxima de sets'
      });
    }


    const esUltimoSet = numero_set === partido.cantidad_sets;

    let puntosMinimos = esUltimoSet ? 15 : 25;
    let max = Math.max(puntos_equipo, puntos_rival);
    let min = Math.min(puntos_equipo, puntos_rival);

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
    let totalesJugadores = [];

    if (ganador) {
      await db.query(`
    UPDATE partidos 
    SET estado = 'finalizado', ganador = ?
    WHERE id = ?
  `, [ganador, id]);

      const [rows] = await db.query(`
    SELECT 
      ejs.jugador_id,
      ${detailedSumSelect('ejs')},
      COALESCE(SUM(ejs.ataques_positivos), 0) AS ataques,
      COALESCE(SUM(ejs.recepciones_positivas), 0) AS recepciones,
      COALESCE(SUM(ejs.bloqueos_positivos), 0) AS bloqueos,
      COALESCE(SUM(
        ejs.errores_ataque +
        ejs.errores_saque +
        ejs.errores_bloqueo +
        ejs.recepciones_negativas +
        ejs.defensas_negativas +
        ejs.errores_armado
      ), 0) AS errores
    FROM estadisticas_jugador_set ejs
    JOIN sets_partido sp ON ejs.set_id = sp.id
    WHERE sp.partido_id = ?
    GROUP BY ejs.jugador_id
  `, [id]);

      // Asignar a la variable externa
      totalesJugadores = rows;

      for (const stat of totalesJugadores) {
        await db.query(`
    INSERT INTO estadisticas_jugador 
      (jugador_id, partido_id, ${DETAILED_STAT_COLUMNS.join(', ')})
    VALUES (?, ?, ${DETAILED_STAT_COLUMNS.map(() => '?').join(', ')})
    ON DUPLICATE KEY UPDATE
      ${DETAILED_STAT_COLUMNS.map(col => `${col} = VALUES(${col})`).join(',\n      ')}
  `, [
          stat.jugador_id,
          id,
          ...DETAILED_STAT_COLUMNS.map(col => stat[col] || 0)
        ]);
      }
    }

    res.json({
      message: 'Set agregado correctamente',
      numero_set,
      set_id: setId,
      marcador: `${ganadosEquipo} - ${ganadosRival}`,
      ganador_partido: ganador || null,
      totales_jugadores: totalesJugadores  // ← ahora sí tiene datos
    });

  } catch (error) {
    console.error('ERROR ADD SET:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.addEstadisticas = async (req, res) => {
  try {
    const { id } = req.params; // partido_id
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    for (const item of payload) {
      const { jugador_id } = item;
      const legacy = legacyStatsFromDetailed(detailedStatsFromBody(item));

      await db.query(`
        INSERT INTO estadisticas_jugador 
        (jugador_id, partido_id, ataques, recepciones, errores, bloqueos)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          ataques = VALUES(ataques),
          recepciones = VALUES(recepciones),
          errores = VALUES(errores),
          bloqueos = VALUES(bloqueos)
      `, [jugador_id, id, legacy.ataques, legacy.recepciones, legacy.errores, legacy.bloqueos]);
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
    const { jugador_id } = req.body;
    const stats = detailedStatsFromBody(req.body);

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
      SELECT id FROM estadisticas_jugador_set
      WHERE jugador_id = ? AND set_id = ?
    `, [jugador_id, set_id]);

    if (rows.length > 0) {
      // 🔥 actualizar acumulando
      await db.query(`
        UPDATE estadisticas_jugador_set SET
          ${DETAILED_STAT_COLUMNS.map(column => `${column} = ${column} + ?`).join(',\n          ')}
        WHERE jugador_id = ? AND set_id = ?
      `, [
        ...DETAILED_STAT_COLUMNS.map(column => stats[column]),
        jugador_id,
        set_id
      ]);

    } else {
      // 🔥 insertar
      await db.query(`
        INSERT INTO estadisticas_jugador_set
        (jugador_id, set_id, ${DETAILED_STAT_COLUMNS.join(', ')})
        VALUES (?, ?, ${DETAILED_STAT_COLUMNS.map(() => '?').join(', ')})
      `, [
        jugador_id,
        set_id,
        ...DETAILED_STAT_COLUMNS.map(column => stats[column])
      ]);
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
      ejs.jugador_id,
      j.nombre AS jugador_nombre,
      ${detailedSumSelect('ejs')},
      COALESCE(SUM(ejs.ataques_positivos), 0) AS ataques,
      COALESCE(SUM(ejs.recepciones_positivas), 0) AS recepciones,
      COALESCE(SUM(ejs.bloqueos_positivos), 0) AS bloqueos,
      COALESCE(SUM(
        ejs.errores_ataque +
        ejs.errores_saque +
        ejs.errores_bloqueo +
        ejs.recepciones_negativas +
        ejs.defensas_negativas +
        ejs.errores_armado
      ), 0) AS errores
    FROM estadisticas_jugador_set ejs
    JOIN sets_partido sp ON ejs.set_id = sp.id
    JOIN jugadores j ON ejs.jugador_id = j.id
    WHERE sp.partido_id = ?
    GROUP BY ejs.jugador_id, j.nombre
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
        sp.partido_id,
        p.nombre AS partido_nombre,
        p.fecha,
        p.rival,
        ${detailedSumSelect('ejs')},
        COALESCE(SUM(ejs.ataques_positivos), 0) AS ataques,
        COALESCE(SUM(ejs.recepciones_positivas), 0) AS recepciones,
        COALESCE(SUM(ejs.bloqueos_positivos), 0) AS bloqueos,
        COALESCE(SUM(
          ejs.errores_ataque +
          ejs.errores_saque +
          ejs.errores_bloqueo +
          ejs.recepciones_negativas +
          ejs.defensas_negativas +
          ejs.errores_armado
        ), 0) AS errores
      FROM estadisticas_jugador_set ejs
      JOIN sets_partido sp ON ejs.set_id = sp.id
      JOIN partidos p ON sp.partido_id = p.id
      WHERE ejs.jugador_id = ?
      GROUP BY sp.partido_id, p.nombre, p.fecha, p.rival
      ORDER BY p.fecha DESC
    `, [id]);

    // Calculate aggregated totals
    let total_ataques = 0;
    let total_recepciones = 0;
    let total_errores = 0;
    let total_bloqueos = 0;
    const totales_detallados = detailedStatsFromBody();
    let partidos_jugados = rows.length;

    rows.forEach(row => {
      total_ataques += Number(row.ataques) || 0;
      total_recepciones += Number(row.recepciones) || 0;
      total_errores += Number(row.errores) || 0;
      total_bloqueos += Number(row.bloqueos) || 0;
      DETAILED_STAT_COLUMNS.forEach(column => {
        totales_detallados[column] += Number(row[column]) || 0;
      });
    });

    res.json({
      jugador_id: id,
      partidos_jugados,
      partidos: rows,
      totales: {
        ataques: total_ataques,
        recepciones: total_recepciones,
        errores: total_errores,
        bloqueos: total_bloqueos,
        ...totales_detallados
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
          ${detailedCoalesceSelect('e')},
          COALESCE(e.ataques_positivos, 0) AS ataques,
          COALESCE(e.recepciones_positivas, 0) AS recepciones,
          COALESCE(e.bloqueos_positivos, 0) AS bloqueos,
          COALESCE(
            e.errores_ataque +
            e.errores_saque +
            e.errores_bloqueo +
            e.recepciones_negativas +
            e.defensas_negativas +
            e.errores_armado,
            0
          ) AS errores
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
            ...detailedStatsFromBody(),
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
      SELECT j.id, j.nombre, j.numero, j.posicion, j.foto_url, j.foto_url AS foto
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
    const body = req.body; 
    const toSave = body.analysis || body; 
    await db.query(
      'UPDATE partidos SET analytics_result = ? WHERE id = ?',
      [JSON.stringify(toSave), req.params.id]
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
    console.log('ROW:', rows[0]);                          // ← agrega esto
    console.log('RAW:', rows[0]?.analytics_result);

    const raw = rows[0]?.analytics_result;
    if (!raw) return res.json(null);

    // Parsear si viene como string
    const result = typeof raw === 'string' ? JSON.parse(raw) : raw;
    res.json(result);
  } catch (err) {
    console.error('Error obteniendo analytics:', err.message);
    res.status(500).json({ error: err.message });
  }
};
