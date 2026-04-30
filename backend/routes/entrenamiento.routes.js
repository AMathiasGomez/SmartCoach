const express = require('express');
const router = express.Router();
const entrenamientoController = require('../controllers/entrenamientos.controller')

router.post('/', entrenamientoController.createEntrenamiento);
router.get('/', entrenamientoController.getEntrenamientos)
router.delete('/:id', entrenamientoController.deleteEntrenamiento)
router.get('/:id', entrenamientoController.getEntrenamientoById)
router.post('/:id/asistencia', entrenamientoController.saveAsistencia)

module.exports = router;