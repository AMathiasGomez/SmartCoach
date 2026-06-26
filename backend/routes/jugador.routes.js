const express = require('express');
const router = express.Router();
const jugadorController = require('../controllers/jugador.controller');
const equipoController = require('../controllers/equipo.controller');
const { analyzePlayer } = require('../services/jugadorAnalyticsService');
const db = require('../config/db')

const multer = require('multer');
const { jugadorStorage } = require('../config/cloudinary');

const upload = multer({ storage: jugadorStorage });

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
    // ── 1. Obtener datos del jugador ─────────────────────────────────────
    const [jugadorRows] = await db.query(
      'SELECT id, nombre, posicion FROM jugadores WHERE id = ?',
      [jugadorId]
    );
    // Si usas PostgreSQL con pg: const { rows: jugadorRows } = await db.query(...)
    if (!jugadorRows || jugadorRows.length === 0) {
      return res.status(404).json({ error: 'Jugador no encontrado' });
    }
    const jugador = jugadorRows[0];
 
    // ── 2. Obtener estadísticas históricas por partido ───────────────────
    const [statsRows] = await db.query(
      `SELECT 
         sp.partido_id,
         p.fecha,
         COALESCE(SUM(ejs.ataques_positivos), 0) AS ataques_positivos,
         COALESCE(SUM(ejs.errores_ataque), 0) AS errores_ataque,
         COALESCE(SUM(ejs.aces), 0) AS aces,
         COALESCE(SUM(ejs.errores_saque), 0) AS errores_saque,
         COALESCE(SUM(ejs.bloqueos_positivos), 0) AS bloqueos_positivos,
         COALESCE(SUM(ejs.errores_bloqueo), 0) AS errores_bloqueo,
         COALESCE(SUM(ejs.recepciones_positivas), 0) AS recepciones_positivas,
         COALESCE(SUM(ejs.recepciones_negativas), 0) AS recepciones_negativas,
         COALESCE(SUM(ejs.defensas_positivas), 0) AS defensas_positivas,
         COALESCE(SUM(ejs.defensas_negativas), 0) AS defensas_negativas,
         COALESCE(SUM(ejs.asistencias), 0) AS asistencias,
         COALESCE(SUM(ejs.errores_armado), 0) AS errores_armado,
         COALESCE(SUM(ejs.ataques_positivos), 0) AS ataques,
         COALESCE(SUM(ejs.recepciones_positivas), 0) AS recepciones,
         COALESCE(SUM(ejs.bloqueos_positivos), 0) AS bloqueos,
         COALESCE(SUM(
           ejs.errores_ataque +
           ejs.errores_saque +
           ejs.errores_bloqueo +
           ejs.recepciones_negativas +
           ejs.defensas_negativas +
           ejs.errores_armado
         ), 0) AS errores
       FROM estadisticas_jugador_set ejs
       JOIN sets_partido sp ON ejs.set_id = sp.id
       JOIN partidos p ON sp.partido_id = p.id
       WHERE ejs.jugador_id = ?
       GROUP BY sp.partido_id, p.fecha
       ORDER BY p.fecha ASC`,
      [jugadorId]
    );
 
    if (!statsRows || statsRows.length === 0) {
      return res.json({
        jugador_id:  jugadorId,
        nombre:      jugador.nombre,
        posicion:    jugador.posicion,
        analysis:    null,
        mensaje:     'Sin estadísticas registradas aún'
      });
    }
 
    // ── 3. Llamar al script Python (scikit-learn) ────────────────────────
    const partidos = statsRows.map(r => ({
      ataques_positivos: Number(r.ataques_positivos) || 0,
      errores_ataque: Number(r.errores_ataque) || 0,
      aces: Number(r.aces) || 0,
      errores_saque: Number(r.errores_saque) || 0,
      bloqueos_positivos: Number(r.bloqueos_positivos) || 0,
      errores_bloqueo: Number(r.errores_bloqueo) || 0,
      recepciones_positivas: Number(r.recepciones_positivas) || 0,
      recepciones_negativas: Number(r.recepciones_negativas) || 0,
      defensas_positivas: Number(r.defensas_positivas) || 0,
      defensas_negativas: Number(r.defensas_negativas) || 0,
      asistencias: Number(r.asistencias) || 0,
      errores_armado: Number(r.errores_armado) || 0,
      ataques: Number(r.ataques) || 0,
      bloqueos: Number(r.bloqueos) || 0,
      recepciones: Number(r.recepciones) || 0,
      errores: Number(r.errores) || 0
    }));
 
    const analysis = await analyzePlayer(jugadorId, jugador.posicion || '', partidos);
 
    // ── 4. Responder ─────────────────────────────────────────────────────
    res.json({
      jugador_id: jugadorId,
      nombre:     jugador.nombre,
      posicion:   jugador.posicion,
      analysis
    });
 
  } catch (err) {
    console.error('Error en analytics jugador:', err.message);
    res.status(500).json({ error: 'Error al generar análisis', details: err.message });
  }
});
 
module.exports = router; 
