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
  await Equipo.update(id, req.body);
  res.json({ message: 'Equipo actualizado' });
};

exports.deleteEquipo = async (req, res) => {
  const { id } = req.params;
  await Equipo.delete(id);
  res.json({ message: 'Equipo eliminado' });
};