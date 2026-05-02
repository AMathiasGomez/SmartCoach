const express = require('express');
const router = express.Router();
const { analyzeMatchPlayers } = require('../services/analyticsService');

router.post('/:id/analytics', async (req, res) => {
  try {
    const { players } = req.body;

    if (!players || players.length === 0) {
      return res.status(400).json({ error: 'Se requiere al menos un jugador' });
    }

    // Transformar datos al formato esperado por el servicio local
    const playersData = players.map(p => ({
      player_id: p.player_id,
      name: p.name || 'Unknown',
      blocks: p.blocks || 0,
      attacks: p.attacks || 0,
      receptions: p.receptions || 0,
      errors: p.errors || 0
    }));

    // Usar el servicio local de análisis (implementación en JS con clustering)
    const result = analyzeMatchPlayers(req.params.id, playersData);

    res.json({
      match_id: req.params.id,
      total_players: playersData.length,
      analysis: result.analysis || result
    });
  } catch (err) {
    console.error('Analytics error:', err.message);
    res.status(500).json({ error: 'Error al generar análisis', details: err.message });
  }
});

module.exports = router;