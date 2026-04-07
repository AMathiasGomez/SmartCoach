const db = require('../config/db');

exports.createPartido = async (req, res) => {
  try {
    const { nombre, equipo_id, rival, fecha, ubicacion, tipo } = req.body;

    const query = `
      INSERT INTO partidos 
      (nombre, equipo_id, rival, fecha, ubicacion, tipo, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [
      nombre,
      equipo_id,
      rival,
      fecha,
      ubicacion,
      tipo,
      'pendiente'
    ]);

    res.status(201).json({
      message: 'Partido creado',
      id: result.insertId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear partido' });
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

    const [result] = await db.query(
      'DELETE FROM partidos WHERE id = ?',
      [id]
    );

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
  const { id } = req.params;
  const { puntos_equipo, puntos_rival } = req.body;

  // 🔥 calcular número automáticamente
  const [result] = await db.query(`
    SELECT COUNT(*) as total FROM sets_partido WHERE partido_id = ?
  `, [id]);

  const numero_set = result[0].total + 1;

  await db.query(`
    INSERT INTO sets_partido (partido_id, numero_set, puntos_equipo, puntos_rival)
    VALUES (?, ?, ?, ?)
  `, [id, numero_set, puntos_equipo, puntos_rival]);

  res.json({ message: 'Set agregado' });
};

exports.addEstadisticas = async (req, res) => {
  try {
    const { id } = req.params; // partido_id
    const { jugador_id, ataques, recepciones, errores, bloqueos } = req.body;

    const [rows] = await db.query(`
      SELECT * FROM estadisticas_jugador
      WHERE jugador_id = ? AND partido_id = ?
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