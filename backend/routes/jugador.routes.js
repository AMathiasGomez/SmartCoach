const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jugadorController = require('../controllers/jugador.controller');
const equipoController = require('../controllers/equipo.controller');

if (!fs.existsSync('uploads/jugadores')) {
  fs.mkdirSync('uploads/jugadores', { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/jugadores/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `jugador_${Date.now()}${ext}`);
  }
});

const upload = multer({ storage });

router.get('/', jugadorController.getJugadores);
router.post('/', upload.single('foto'), jugadorController.createJugador);
router.delete('/:id', jugadorController.deleteJugador);
router.put('/:id', jugadorController.updateJugador);
router.post('/:id/foto', upload.single('foto'), jugadorController.updateJugadorFoto);
router.get('/:id', jugadorController.getJugadorById);

router.get('/', equipoController.getEquipos);

router.get('/equipo/:equipo_id', jugadorController.getJugadoresByEquipo);

module.exports = router; 