const express = require('express');
const router = express.Router();
const db = require('../config/db')

const { register, login } = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);

module.exports = router;