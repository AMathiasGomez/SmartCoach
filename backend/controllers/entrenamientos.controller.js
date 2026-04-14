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