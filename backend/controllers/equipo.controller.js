const Equipo = require('../models/equipo');
const db = require('../config/db');

exports.getEquipos = async (req, res) => {
  try {
    const equipos = await Equipo.getAll();
    res.json(equipos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los equipos' });
  }
};

exports.createEquipo = async (req, res) => {
  try {
    let { nombre, categoria, ano_fundacion, descripcion } = req.body;

    nombre = nombre?.trim();
    categoria = categoria?.trim();

    if (!nombre || !categoria) {
      return res.status(400).json({
        message: 'Nombre y categoría son obligatorios'
      });
    }

    const [result] = await db.query(`
      INSERT INTO equipos (nombre, categoria, ano_fundacion, descripcion)
      VALUES (?, ?, ?, ?)
    `, [nombre, categoria, ano_fundacion, descripcion]);

    return res.status(201).json({
      message: 'Equipo creado',
      id: result.insertId
    });

  } catch (error) {

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        message: 'Ya existe un equipo con ese nombre en esta categoría'
      });
    }

    console.error('ERROR CREATE EQUIPO:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.updateEquipo = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Equipo.update(id, req.body);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }

    res.json({ message: 'Equipo actualizado correctamente' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar equipo' });
  }
};

exports.deleteEquipo = async (req, res) => {
  const { id } = req.params;
  await Equipo.delete(id);
  res.json({ message: 'Equipo eliminado' });
};

exports.getEquipoById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await Equipo.getById(id);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener equipo' });
  }
};