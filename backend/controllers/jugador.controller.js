const db = require('../config/db');
const Jugador = require('../models/jugador');

exports.getJugadores = async (req, res) => {
  try {
    const sql = `
      SELECT 
        jugador.id,
        jugador.nombre,
        jugador.posicion,
        jugador.numero,
        jugador.foto_url,
        e.nombre AS equipo_nombre
      FROM jugadores jugador
      LEFT JOIN equipos e ON jugador.equipo_id = e.id
      ORDER BY jugador.created_at DESC
    `;
    const [rows] = await db.query(sql);
    res.status(200).json(rows);
  } catch (error) {
    console.error('ERROR SQL (getJugadores):', error);
    res.status(500).json({ message: 'Error al obtener jugadores' });
  }
};

exports.createJugador = async (req, res) => {
  try {
    let { nombre, fecha_nacimiento, posicion, numero, equipo_id } = req.body;

    nombre = nombre?.trim();
    posicion = posicion?.trim();
    equipo_id = Number(equipo_id);
    numero = Number(numero);

    if (!nombre || !fecha_nacimiento || !posicion || !numero || !equipo_id) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    if (isNaN(numero) || numero <= 0) {
      return res.status(400).json({ message: 'El número (dorsal) debe ser válido' });
    }

    if (isNaN(equipo_id)) {
      return res.status(400).json({ message: 'El equipo es inválido' });
    }

    if (isNaN(Date.parse(fecha_nacimiento))) {
      return res.status(400).json({ message: 'Fecha de nacimiento inválida' });
    }

    const posicionesValidas = ['Libero', 'Punta', 'Central', 'Opuesto', 'Armador'];
    if (!posicionesValidas.includes(posicion)) {
      return res.status(400).json({ message: 'Posición inválida' });
    }

    const [equipo] = await db.query('SELECT id FROM equipos WHERE id = ?', [equipo_id]);
    if (equipo.length === 0) {
      return res.status(400).json({ message: 'El equipo no existe' });
    }

    const foto_url = req.file ? `/uploads/jugadores/${req.file.filename}` : null;

    const [result] = await db.query(`
      INSERT INTO jugadores 
      (nombre, fecha_nacimiento, posicion, numero, equipo_id, foto_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [nombre, fecha_nacimiento, posicion, numero, equipo_id, foto_url]);

    return res.status(201).json({
      message: 'Jugador creado correctamente',
      id: result.insertId,
      foto_url
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        message: 'Ya existe un jugador con ese dorsal en este equipo'
      });
    }
    console.error('ERROR CREATE JUGADOR:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.deleteJugador = async (req, res) => {
  const { id } = req.params;
  await Jugador.delete(id);
  res.json({ message: 'Jugador eliminado' });
};

exports.updateJugador = async (req, res) => {
  try {
    const { id } = req.params;
    let { nombre, fecha_nacimiento, posicion, numero, equipo_id } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    nombre = nombre?.trim();
    posicion = posicion?.trim();
    numero = Number(numero);
    equipo_id = Number(equipo_id);

    if (!nombre || !fecha_nacimiento || !posicion || !numero || !equipo_id) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const [jugador] = await db.query('SELECT id FROM jugadores WHERE id = ?', [id]);
    if (jugador.length === 0) {
      return res.status(404).json({ message: 'Jugador no encontrado' });
    }

    await db.query(
      `UPDATE jugadores SET nombre = ?, fecha_nacimiento = ?, posicion = ?, numero = ?, equipo_id = ? WHERE id = ?`,
      [nombre, fecha_nacimiento, posicion, numero, equipo_id, id]
    );

    res.json({ message: 'Jugador actualizado correctamente' });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        message: 'Ya existe un jugador con ese dorsal en este equipo'
      });
    }
    console.error('ERROR CREATE JUGADOR:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.getJugadorById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM jugadores WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Jugador no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error' });
  }
};

exports.updateJugadorFoto = async (req, res) => {
  try {
    const { id } = req.params;
    let { nombre, fecha_nacimiento, posicion, numero, equipo_id } = req.body;

    nombre = nombre?.trim();
    posicion = posicion?.trim();
    numero = Number(numero);
    equipo_id = Number(equipo_id);
        const fechaFormateada = new Date(fecha_nacimiento).toISOString().split('T')[0];

    const foto_url = req.file ? `/uploads/jugadores/${req.file.filename}` : undefined;

    const campos = ['nombre = ?', 'fecha_nacimiento = ?', 'posicion = ?', 'numero = ?', 'equipo_id = ?'];
    const valores = [nombre, fechaFormateada, posicion, numero, equipo_id];

    if (foto_url) {
      campos.push('foto_url = ?');
      valores.push(foto_url);
    }

    valores.push(id);

    await db.query(`UPDATE jugadores SET ${campos.join(', ')} WHERE id = ?`, valores);

    res.json({ message: 'Jugador actualizado correctamente' });

  } catch (error) {
    console.error('ERROR updateJugadorFoto:', error);
    res.status(500).json({ message: 'Error al actualizar jugador' });
  }
};

exports.getJugadoresByEquipo = async (req, res) => {
  try {
    const { equipo_id } = req.params;
    const [jugadores] = await db.query(
      'SELECT id, nombre, numero, posicion FROM jugadores WHERE equipo_id = ?',
      [equipo_id]
    );
    res.json(jugadores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener jugadores' });
  }
};