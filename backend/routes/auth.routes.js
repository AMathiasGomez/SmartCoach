const express = require('express');
const router = express.Router();
const db = require('../config/db')

const { register, login } = require('../controllers/auth.controller');

router.post('/register', async (req, res) => {
    const { rol, email, password} = req.body;

    try {
        if(!email || !password || !rol) {
            return res.status(400).json({ message: 'Faltan datos'});
        }

        const existing = await db.query(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );

        if(existing.length > 0) {
            return res.status(400).json({ message: 'Usuario ya existe'});
        }

        await db.query(
            'INSERT into usuarios (rol, email, password) VALUES (?, ?, ?',
            [rol, email, password]
        );

        res.json( {message: 'Usuario registrado correctamente'});

    } catch (error) {
        res.status(500).json({ message: 'Error del servidor'});
    }
});

module.exports = router;