const db = require('../config/db');
const Usuario = require('../models/jugador');

exports.getUsuarios = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre, email, rol, fecha_registro FROM usuarios'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

exports.updateRol = async (req, res) => {
  const { id } = req.params;
  const { rol } = req.body;

  try {
    await db.query(
      'UPDATE usuarios SET rol = ? WHERE id = ?',
      [rol, id]
    );

    res.json({ message: 'Rol actualizado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
};