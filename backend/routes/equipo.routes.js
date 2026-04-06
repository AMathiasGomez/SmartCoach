const express = require('express');
const router = express.Router();
const controller = require('../controllers/equipo.controller');

router.get('/', controller.getEquipos);
router.post('/', controller.createEquipo);
router.put('/:id', controller.updateEquipo);
router.delete('/:id', controller.deleteEquipo);
router.get('/:id', controller.getEquipoById);


module.exports = router;