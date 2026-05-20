const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  const { entrenamiento_id } = req.query;

  let query = `
    SELECT c.*, u.nombre AS nombreUsuario
    FROM comentarios c
    LEFT JOIN usuarios u ON c.usuarios_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (entrenamiento_id) {
    query += ' AND c.entrenamiento_id = ?';
    params.push(entrenamiento_id);
  }

  query += ' ORDER BY c.created_at DESC';

  try {
    const [results] = await db.query(query, params);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { contenido, fecha, usuarios_id, entrenamiento_id } = req.body;

  if (!contenido || !usuarios_id) {
    return res.status(400).json({ error: 'contenido y usuarios_id son obligatorios' });
  }

  const query = `
    INSERT INTO comentarios (contenido, fecha, usuarios_id, entrenamiento_id)
    VALUES (?, ?, ?, ?)
  `;

  try {
    const [result] = await db.query(query, [contenido, fecha, usuarios_id, entrenamiento_id || null]);

    const [rows] = await db.query(
      'SELECT c.*, u.nombre AS nombreUsuario FROM comentarios c LEFT JOIN usuarios u ON c.usuarios_id = u.id WHERE c.id = ?',
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM comentarios WHERE id = ?', [req.params.id]);
    res.json({ message: 'Comentario eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;