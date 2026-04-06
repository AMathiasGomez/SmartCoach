const db = require('../config/db');
const Jugador = require('../models/jugador');

exports.createJugador = (req, res) => {
  console.log('REQ BODY:', req.body);

  let { nombre, fecha_nacimiento, posicion, numero, equipo_id } = req.body;

  nombre = nombre?.trim();
  posicion = posicion?.trim();
  equipo_id = Number(equipo_id);
  numero = Number(numero);

  if (!nombre || !fecha_nacimiento || !posicion || !numero || !equipo_id) {
    return res.status(400).json({
      message: 'Todos los campos son obligatorios'
    });
  }

  if (isNaN(numero) || numero <= 0) {
    return res.status(400).json({
      message: 'El número (dorsal) debe ser válido'
    });
  }

  if (isNaN(equipo_id)) {
    return res.status(400).json({
      message: 'El equipo es inválido'
    });
  }

  if (isNaN(Date.parse(fecha_nacimiento))) {
    return res.status(400).json({
      message: 'Fecha de nacimiento inválida'
    });
  }

  const posicionesValidas = ['Libero', 'Punta', 'Central', 'Opuesto', 'Armador'];

  if (!posicionesValidas.includes(posicion)) {
    return res.status(400).json({
      message: 'Posición inválida'
    });
  }

  const sqlEquipo = 'SELECT id FROM equipos WHERE id = ?';

  db.query(sqlEquipo, [equipo_id], (err, resultEquipo) => {
    if (err) {
      console.error('ERROR SQL (equipo):', err);
      return res.status(500).json({ message: 'Error en el servidor' });
    }

    if (resultEquipo.length === 0) {
      return res.status(400).json({
        message: 'El equipo no existe'
      });
    }

    const sqlDorsal = 'SELECT id FROM jugadores WHERE numero = ? AND equipo_id = ?';

    db.query(sqlDorsal, [numero, equipo_id], (err, resultDorsal) => {
      if (err) {
        console.error('ERROR SQL (dorsal):', err);
        return res.status(500).json({ message: 'Error en el servidor' });
      }

      if (resultDorsal.length > 0) {
        return res.status(400).json({
          message: 'Ya existe un jugador con ese dorsal en este equipo'
        });
      }

      const sqlInsert = `
        INSERT INTO jugadores 
        (nombre, fecha_nacimiento, posicion, numero, equipo_id)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(
        sqlInsert,
        [nombre, fecha_nacimiento, posicion, numero, equipo_id],
        (err, result) => {
          if (err) {
            console.error('ERROR SQL (insert):', err);
            return res.status(500).json({
              message: 'Error al crear jugador'
            });
          }

          res.status(201).json({
            message: 'Jugador creado correctamente',
            id: result.insertId
          });
        }
      );
    });
  });
};

exports.getJugadores = async (req, res) => {
  try {

    const sql = `
      SELECT 
        jugador.id,
        jugador.nombre,
        jugador.posicion,
        jugador.numero,
        e.nombre AS equipo_nombre
      FROM jugadores jugador
      LEFT JOIN equipos e ON jugador.equipo_id = e.id
      ORDER BY jugador.created_at DESC
    `;

    const [rows] = await db.query(sql);

    res.status(200).json(rows);

  } catch (error) {
    console.error('ERROR SQL (getJugadores):', error);
    res.status(500).json({
      message: 'Error al obtener jugadores'
    });
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

    // 🔴 Validar ID
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

    const [jugador] = await db.query(
      'SELECT id FROM jugadores WHERE id = ?',
      [id]
    );

    if (jugador.length === 0) {
      return res.status(404).json({ message: 'Jugador no encontrado' });
    }

    // 🔥 Update
    await db.query(
      `UPDATE jugadores 
       SET nombre = ?, fecha_nacimiento = ?, posicion = ?, numero = ?, equipo_id = ?
       WHERE id = ?`,
      [nombre, fecha_nacimiento, posicion, numero, equipo_id, id]
    );

    res.json({
      message: 'Jugador actualizado correctamente'
    });

  } catch (error) {
    console.error('ERROR updateJugador:', error);
    res.status(500).json({
      message: 'Error al actualizar jugador'
    });
  }
};

exports.getJugadorById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      'SELECT * FROM jugadores WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Jugador no encontrado' });
    }

    res.json(rows[0]);

  } catch (error) {
    res.status(500).json({ message: 'Error' });
  }
};

exports.getJugadoresByEquipo = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(`
      SELECT * FROM jugadores
      WHERE equipo_id = ?
    `, [id]);

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener jugadores' });
  }
};