const axios = require('axios');
const express = require('express');
const router = express.Router();

const ANALYTICS_URL = process.env.ANALYTICS_URL || 'http://localhost:8001';

router.post('/:id/analytics', async (req, res) => {
  try {
    const { players } = req.body;
    const pythonReq = {
      match_id: req.params.id,
      players: players.map(p => ({
        player_id: p.player_id,
        name: p.name || 'Unknown',
        blocks: p.blocks || 0,
        attacks: p.attacks || 0,
        receptions: p.receptions || 0,
        errors: p.errors || 0
      }))
    };

    const response = await axios.post(`${ANALYTICS_URL}/analyze/players`, pythonReq, {
      timeout: 10000
    });

    res.json(response.data);
  } catch (err) {
    console.error('Python Analytics error:', err.message);
    res.status(500).json({ error: 'Error al generar análisis sklearn', details: err.message });
  }
});

module.exports = router;