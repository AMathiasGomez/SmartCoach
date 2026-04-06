const express = require('express');
const router = express.Router();
const jugadorController = require('../controllers/jugador.controller');
const equipoController = require('../controllers/equipo.controller');

router.get('/', jugadorController.getJugadores);
router.post('/', jugadorController.createJugador);
router.delete('/:id', jugadorController.deleteJugador);
router.put('/:id', jugadorController.updateJugador);
router.get('/:id', jugadorController.getJugadorById);

router.get('/', equipoController.getEquipos);

router.get('/equipo/:id', jugadorController.getJugadoresByEquipo);

module.exports = router; 