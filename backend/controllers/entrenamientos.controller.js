const db = require('../config/db');

exports.createEntrenamiento = async (req, res) => {
  try {
    let { equipo_id, fecha, hora, tipo, duracion, descripcion } = req.body;

    if (!equipo_id || !fecha || !hora || !tipo || !duracion) {
      return res.status(400).json({
        message: 'Faltan campos obligatorios'
      });
    }

    tipo = tipo.trim().toLowerCase();

    const [result] = await db.query(
      `INSERT INTO entrenamientos 
      (equipo_id, fecha, hora, tipo, duracion, descripcion) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [equipo_id, fecha, hora, tipo, duracion, descripcion || null]
    );

    res.status(201).json({
      message: 'Entrenamiento creado correctamente',
      id: result.insertId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al crear entrenamiento'
    });
  }
};

exports.getEntrenamientos = async (req, res) => {
  try {

    const sql = `
      SELECT 
        entrenamiento.id,
        entrenamiento.fecha,
        entrenamiento.hora,
        entrenamiento.duracion,
        entrenamiento.tipo,
        entrenamiento.estado,
        e.nombre AS equipo_nombre
      FROM entrenamientos entrenamiento
      LEFT JOIN equipos e ON entrenamiento.equipo_id = e.id
      ORDER BY entrenamiento.created_at DESC
    `;

    const [rows] = await db.query(sql);

    res.status(200).json(rows);

  } catch (error) {
    console.error('ERROR SQL (getEntrenamientos):', error);
    res.status(500).json({
      message: 'Error al obtener entrenamientos'
    });
  }
};

exports.deleteEntrenamiento = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'DELETE FROM entrenamientos WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Entrenamiento no encontrado' });
    }

    res.json({ message: 'Entrenamiento eliminado' });

  } catch (error) {
    console.error('ERROR DELETE:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getEntrenamientoById = async (req, res) => {
  try {
    const { id } = req.params;
    const [entrenamientos] = await db.query(`
      SELECT 
        e.*, eq.nombre as equipo_nombre
      FROM entrenamientos e
      LEFT JOIN equipos eq ON e.equipo_id = eq.id
      WHERE e.id = ?
    `, [id]);

    if (entrenamientos.length === 0) {
      return res.status(404).json({ message: 'Entrenamiento no encontrado' });
    }

    const entrenamiento = entrenamientos[0];

    // Get jugadores del equipo
    const [jugadores] = await db.query(`
      SELECT id, nombre, numero, posicion 
      FROM jugadores 
      WHERE equipo_id = ?
    `, [entrenamiento.equipo_id]);

    // Get asistencia existente
    const [asistencias] = await db.query(`
      SELECT jugador_id, estado 
      FROM asistencias 
      WHERE entrenamiento_id = ?
    `, [id]);

    const asistenciaMap = {};
    asistencias.forEach(a => {
      asistenciaMap[a.jugador_id] = a.estado === 'presente';
    });

    jugadores.forEach(j => {
      j.presente = asistenciaMap[j.id] !== undefined ? asistenciaMap[j.id] : false;
    });

    res.json({
      ...entrenamiento,
      jugadores
    });

  } catch (error) {
    console.error('ERROR getEntrenamientoById:', error);
    res.status(500).json({ message: 'Error al obtener entrenamiento' });
  }
};

exports.saveAsistencia = async (req, res) => {
  try {
    const { id } = req.params;
    const { asistencias } = req.body; // [{jugador_id, presente: bool}]

    // Delete existing
    await db.query('DELETE FROM asistencias WHERE entrenamiento_id = ?', [id]);

    // Insert new
    const values = asistencias.map(a => [id, a.jugador_id, a.presente ? 'presente' : 'ausente']);
    if (values.length > 0) {
      await db.query(`
        INSERT INTO asistencias (entrenamiento_id, jugador_id, estado) VALUES ?
      `, [values]);
    }

    res.json({ message: 'Asistencia guardada correctamente' });

  } catch (error) {
    console.error('ERROR saveAsistencia:', error);
    res.status(500).json({ message: 'Error al guardar asistencia' });
  }
};
