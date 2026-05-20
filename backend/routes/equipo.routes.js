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

const fileFilter = (req, file, cb) => {
  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error('Solo se permiten imagenes JPG, PNG o WEBP.'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/', controller.getEquipos);
router.post('/', upload.single('foto'), controller.createEquipo); 
router.put('/:id', upload.single('foto'), controller.updateEquipo);
router.delete('/:id', controller.deleteEquipo);
router.get('/:id', controller.getEquipoById);

module.exports = router;
