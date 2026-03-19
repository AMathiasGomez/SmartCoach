const bcrypt = require('bcrypt');
const db = require('../config/db.js');
const jwt = require('jsonwebtoken');

const register = async (request, response) => {

  const { rol, nombre, email, password } = request.body;

  if (!rol || !nombre || !email || !password){
    return response.status(400).json({ error: 'Campos obligatorios' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO usuarios (rol, nombre, email, password)
      VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [rol, nombre, email, hashedPassword], (error, result) => {

      if (error){
        console.error(error);
        return response.status(500).json({ error: 'Error al registrar' });
      }

      response.json({ message: 'Usuario registrado correctamente' });
    });

  } catch (error){
    response.status(500).json({ error: 'Error en el servidor' });
  }
};

const login = (req, res) => {

  const { rol, correo, password } = req.body;

  if (!rol || !correo || !password){
    return res.status(400).json({ error: 'Campos obligatorios' });
  }

  const sql = 'SELECT * FROM usuarios WHERE email = ? AND rol = ?';

  db.query(sql, [correo, rol], async (error, result) => {

    if (error){
      console.error(error);
      return res.status(500).json({ error: 'Error servidor' });
    }

    if (result.length === 0){
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    if (!valid){
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }


  });
};

module.exports = { register, login };