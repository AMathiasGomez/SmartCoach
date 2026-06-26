const db = require('../config/db');
const Usuario = require('../models/usuario');

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

exports.deleteUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await Usuario.delete(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};
