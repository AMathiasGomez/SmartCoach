const express = require('express');
const router = express.Router();
const controller = require('../controllers/equipo.controller');

const multer = require('multer');
const { equipoStorage } = require('../config/cloudinary');
const upload = multer({ storage: equipoStorage });

router.get('/', controller.getEquipos);
router.post('/', upload.single('foto'), controller.createEquipo); 
router.put('/:id', upload.single('foto'), controller.updateEquipo);
router.delete('/:id', controller.deleteEquipo);
router.get('/:id', controller.getEquipoById);

module.exports = router;
