const bcrypt = require('bcrypt');
const db = require('../config/db.js');
const jwt = require('jsonwebtoken');

const rolesPermitidos = ['administrador', 'directivo', 'entrenador', 'usuario'];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const register = async (req, res) => {
  const { rol, nombre, email, password } = req.body;
  const nombreNormalizado = String(nombre || '').trim();
  const emailNormalizado = String(email || '').trim().toLowerCase();

  try {
    if (!rol || !nombreNormalizado || !emailNormalizado || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (!rolesPermitidos.includes(rol)) {
      return res.status(400).json({ error: 'Rol no valido' });
    }

    if (!emailRegex.test(emailNormalizado)) {
      return res.status(400).json({ error: 'Correo no valido' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: 'La contrasena debe tener al menos 6 caracteres' });
    }

    const [existingUsers] = await db.query(
      'SELECT id FROM usuarios WHERE email = ? LIMIT 1',
      [emailNormalizado]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'El correo ya esta registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO usuarios (rol, nombre, email, password) VALUES (?, ?, ?, ?)',
      [rol, nombreNormalizado, emailNormalizado, hashedPassword]
    );

    return res.json({ message: 'Usuario registrado correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en el servidor' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const emailNormalizado = String(email || '').trim().toLowerCase();

  try {
    if (!emailNormalizado || !password) {
      return res.status(400).json({ error: 'Correo y contrasena son obligatorios' });
    }

    if (!emailRegex.test(emailNormalizado)) {
      return res.status(400).json({ error: 'Correo no valido' });
    }

    const [rows] = await db.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [emailNormalizado]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      'secretkey',
      { expiresIn: '1h' }
    );

    return res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
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
