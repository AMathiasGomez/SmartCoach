const Equipo = require('../models/equipo');

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
  const equipo = req.body;
  await Equipo.create(equipo);
  res.json({ message: 'Equipo creado' });
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