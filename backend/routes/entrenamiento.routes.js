const express = require('express');
const router = express.Router();
const entrenamientoController = require('../controllers/entrenamientos.controller')

router.post('/', entrenamientoController.createEntrenamiento);
router.get('/', entrenamientoController.getEntrenamientos)
router.delete('/:id', entrenamientoController.deleteEntrenamiento)

module.exports = router;