const bcrypt = require('bcrypt');
const db = require('../config/db.js');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  const { rol, nombre, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO usuarios (rol, nombre, email, password)
      VALUES (?, ?, ?, ?)
    `;

    await db.query(sql, [rol, nombre, email, hashedPassword]);

    res.json({ message: 'Usuario registrado correctamente' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

const login = async (req, res) => {
  const jwt = require('jsonwebtoken');

  const { email, password } = req.body;  

  try {

    console.log('BODY: ', req.body);
    const [rows] = await db.query(
      'SELECT * FROM usuarios WHERE email = ? ',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const user = rows[0];

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol},
      'secretkey',
      { expiresIn: '1h' }
    )

    return res.json({
      message: 'Login exitoso',
      token: token,
      user: {
        id: user.id,
        rol: user.rol,
        email: user.email
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error servidor' });
  }
};

module.exports = { register, login };