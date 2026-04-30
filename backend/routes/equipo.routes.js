const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const controller = require('../controllers/equipo.controller');

if (!fs.existsSync('uploads/equipos')) {
  fs.mkdirSync('uploads/equipos', { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/equipos/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `equipo_${Date.now()}${ext}`);
  }
});

const upload = multer({ storage });

router.get('/', controller.getEquipos);
router.post('/', upload.single('foto'), controller.createEquipo); 
router.put('/:id', controller.updateEquipo);
router.delete('/:id', controller.deleteEquipo);
router.get('/:id', controller.getEquipoById);

module.exports = router;