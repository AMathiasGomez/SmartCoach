const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jugadorController = require('../controllers/jugador.controller');
const equipoController = require('../controllers/equipo.controller');
const { analyzePlayer } = require('../services/jugadorAnalyticsService');
const db = require('../config/db')

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
router.get('/equipo/:equipo_id', jugadorController.getJugadoresByEquipo);

router.get('/:id/analytics', async (req, res) => {
  const jugadorId = parseInt(req.params.id, 10);
  if (isNaN(jugadorId)) {
    return res.status(400).json({ error: 'ID de jugador inválido' });
  }

  try {
    const [jugadorRows] = await db.query(
      'SELECT id, nombre, posicion FROM jugadores WHERE id = ?',
      [jugadorId]
    );
    if (!jugadorRows || jugadorRows.length === 0) {
      return res.status(404).json({ error: 'Jugador no encontrado' });
    }
    const jugador = jugadorRows[0];

    const [statsRows] = await db.query(
      `SELECT 
         ej.ataques,
         ej.bloqueos,
         ej.recepciones,
         ej.errores,
         ej.partido_id,
         ej.created_at
       FROM estadisticas_jugador ej
       WHERE ej.jugador_id = ?
       ORDER BY ej.created_at ASC`,
      [jugadorId]
    );

    if (!statsRows || statsRows.length === 0) {
      return res.json({
        jugador_id: jugadorId,
        nombre: jugador.nombre,
        posicion: jugador.posicion,
        analysis: null,
        mensaje: 'Sin estadísticas registradas aún'
      });
    }

    const partidos = statsRows.map(r => ({
      ataques: Number(r.ataques) || 0,
      bloqueos: Number(r.bloqueos) || 0,
      recepciones: Number(r.recepciones) || 0,
      errores: Number(r.errores) || 0
    }));

    const analysis = await analyzePlayer(jugadorId, jugador.posicion || '', partidos);

    res.json({
      jugador_id: jugadorId,
      nombre: jugador.nombre,
      posicion: jugador.posicion,
      analysis
    });

  } catch (err) {
    console.error('Error en analytics jugador:', err.message);
    res.status(500).json({ error: 'Error al generar análisis', details: err.message });
  }
});

module.exports = router; 