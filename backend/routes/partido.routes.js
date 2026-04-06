const express = require('express');
const router = express.Router();
const partidoController = require('../controllers/partido.controller');
const jugadorController = require('../controllers/jugador.controller');

router.post('/', partidoController.createPartido);
router.get('/', partidoController.getPartidos);
router.get('/:id', partidoController.getPartidoById);
router.put('/:id', partidoController.updatePartido);
router.delete('/:id', partidoController.deletePartido);
router.put('/:id/estado', partidoController.updateEstado);

//JUGADORES
router.get('/equipo/:id/jugadores', jugadorController.getJugadoresByEquipo);    

//SETS
router.get('/:id/sets', partidoController.getSets);
router.post('/:id/sets', partidoController.addSet);

//ESTADISTICAS
router.post('/:id/estadisticas', partidoController.addEstadisticas);
router.get('/:id/estadisticas', partidoController.getEstadisticas);

module.exports = router;