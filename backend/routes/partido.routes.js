const express = require('express');
const router = express.Router();
const partidoController = require('../controllers/partido.controller');
const jugadorController = require('../controllers/jugador.controller');

router.post('/', partidoController.createPartido);
router.get('/', partidoController.getPartidos);

// ── Rutas específicas ANTES de /:id ──────────────────────────────────────

// Jugador stats (debe ir antes de /:id)
router.get('/jugador/:id/estadisticas', partidoController.getEstadisticasJugador);

// Analytics
router.post('/:id/analytics/save', partidoController.saveAnalytics);
router.get('/:id/analytics', partidoController.getAnalytics);

// Sets
router.get('/:id/sets', partidoController.getSets);
router.post('/:id/sets', partidoController.addSet);

// Estadísticas
router.post('/:id/estadisticas', partidoController.addEstadisticas);
router.get('/:id/estadisticas', partidoController.getEstadisticas);
router.get('/:id/estadisticas-sets', partidoController.getEstadisticasPorSets);
router.post('/:partido_id/sets/:set_id/estadisticas', partidoController.addEstadisticasPorSet);

// Jugadores
router.get('/equipo/:id/jugadores', jugadorController.getJugadoresByEquipo);
router.get('/:partido_id/jugadores', partidoController.getJugadoresByPartido);

// ── Rutas genéricas AL FINAL ──────────────────────────────────────────────
router.get('/:id', partidoController.getPartidoById);
router.put('/:id', partidoController.updatePartido);
router.delete('/:id', partidoController.deletePartido);
router.put('/:id/estado', partidoController.updateEstado);

module.exports = router;