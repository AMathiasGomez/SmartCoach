const Equipo = require('../models/equipo');
const db = require('../config/db');

exports.createEquipo = async (req, res) => {
  try {
    let { nombre, categoria, ano_fundacion, descripcion } = req.body;

    // 1. Limpieza y Validación básica
    nombre = nombre?.trim();
    categoria = categoria?.trim();

    if (!nombre || !categoria) {
      return res.status(400).json({
        message: 'El nombre y la categoría son campos obligatorios.'
      });
    }

    // 2. Manejo de la URL de la foto
    const foto_url = req.file ? `/uploads/equipos/${req.file.filename}` : null;

    // 3. Inserción en la base de datos
    // Nota: Usamos db.query directamente como en tu ejemplo original
    const [result] = await db.query(`
      INSERT INTO equipos (nombre, categoria, ano_fundacion, descripcion, foto_url)
      VALUES (?, ?, ?, ?, ?)
    `, [nombre, categoria, ano_fundacion, descripcion, foto_url]);

    // 4. Respuesta exitosa
    return res.status(201).json({
      message: 'Equipo creado con éxito',
      id: result.insertId,
      foto_url
    });

  } catch (error) {
    // 5. Captura específica de duplicados (Nombre + Categoría)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        message: 'Ya existe un equipo con ese nombre en esta categoría.'
      });
    }

    // 6. Otros errores
    console.error('ERROR AL CREAR EQUIPO:', error);
    return res.status(500).json({
      message: 'Ocurrió un error interno al procesar la solicitud.'
    });
  }
};

// --- Los demás métodos se mantienen similares pero con manejo de errores limpio ---

exports.getEquipos = async (req, res) => {
  try {
    const equipos = await Equipo.getAll();
    res.json(equipos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los equipos' });
  }
};

exports.updateEquipo = async (req, res) => {
  const { id } = req.params;
  try {
    console.log('BODY EN BACKEND:', req.body);
    const result = await Equipo.update(id, req.body);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }
    res.json({ message: 'Equipo actualizado correctamente' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Ya existe otro equipo con ese nombre en esta categoría' });
    }
    console.error('ERROR REAL:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteEquipo = async (req, res) => {
  const { id } = req.params;
  try {
    await Equipo.delete(id);
    res.json({ message: 'Equipo eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar equipo' });
  }
};

exports.getEquipoById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await Equipo.getById(id);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }
    res.json(rows[0]); // Retornamos el objeto, no el array
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener equipo' });
  }
};