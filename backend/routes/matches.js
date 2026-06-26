const express = require('express');
const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');
const { analyzeMatchPlayers } = require('../services/analyticsService');

const router = express.Router();
const PYTHON_SCRIPT = path.join(__dirname, '..', 'analytics', 'models', 'positionPerformance.py');
const PYTHON_BINARIES = [process.env.PYTHON_BIN, 'python3', 'python', 'py'].filter(Boolean);
const ANALYTICS_SERVICE_URL = (process.env.ANALYTICS_SERVICE_URL || '').replace(/\/$/, '');

async function runRemotePositionPerformanceAnalysis(payload) {
  if (!ANALYTICS_SERVICE_URL) {
    throw new Error('ANALYTICS_SERVICE_URL no configurado');
  }

  const response = await axios.post(
    `${ANALYTICS_SERVICE_URL}/analyze/players`,
    payload,
    { timeout: 30000 }
  );

  return response.data;
}

function runPositionPerformanceAnalysis(payload) {
  return new Promise((resolve, reject) => {
    let lastError = null;
    let index = 0;

    const tryNext = () => {
      if (index >= PYTHON_BINARIES.length) {
        return reject(lastError || new Error('No se encontro un runtime de Python disponible'));
      }

      const binary = PYTHON_BINARIES[index++];
      const py = spawn(binary, [PYTHON_SCRIPT]);

      let stdout = '';
      let stderr = '';

      py.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
      py.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
      py.on('error', (error) => {
        lastError = error;
        tryNext();
      });

      py.on('close', (code) => {
        if (code !== 0) {
          lastError = new Error(stderr || `Python exited with code ${code}`);
          return tryNext();
        }

        try {
          resolve(JSON.parse(stdout));
        } catch (error) {
          reject(new Error(`No se pudo leer la respuesta del analizador: ${stdout}`));
        }
      });

      py.stdin.write(JSON.stringify(payload));
      py.stdin.end();
    };

    tryNext();
  });
}

router.post('/:id/analytics', async (req, res) => {
  console.log('>>> Peticion recibida en analytics, match:', req.params.id);
  try {
    const { players } = req.body;

    if (!players || players.length === 0) {
      return res.status(400).json({ error: 'Se requiere al menos un jugador' });
    }

    const playersData = players.map(p => ({
      player_id: p.player_id,
      name: p.name || 'Unknown',
      position: p.position || p.posicion || 'Punta',
      blocks: p.blocks || 0,
      attacks: p.attacks || 0,
      receptions: p.receptions || 0,
      errors: p.errors || 0,
      ataques_positivos: p.ataques_positivos,
      errores_ataque: p.errores_ataque,
      aces: p.aces,
      errores_saque: p.errores_saque,
      bloqueos_positivos: p.bloqueos_positivos,
      errores_bloqueo: p.errores_bloqueo,
      recepciones_positivas: p.recepciones_positivas,
      recepciones_negativas: p.recepciones_negativas,
      defensas_positivas: p.defensas_positivas,
      defensas_negativas: p.defensas_negativas,
      asistencias: p.asistencias,
      errores_armado: p.errores_armado
    }));

    let result;
    try {
      const payload = {
        match_id: req.params.id,
        players: playersData
      };

      result = ANALYTICS_SERVICE_URL
        ? await runRemotePositionPerformanceAnalysis(payload)
        : await runPositionPerformanceAnalysis(payload);
    } catch (pythonError) {
      console.warn('Python analytics no disponible, usando fallback JS:', pythonError.message);
      result = analyzeMatchPlayers(req.params.id, playersData);
    }

    if (result.error) {
      return res.status(500).json({ error: 'Error al generar analisis', details: result.error });
    }

    res.json(result);
  } catch (err) {
    console.error('Analytics error:', err.message);
    res.status(500).json({ error: 'Error al generar analisis', details: err.message });
  }
});

module.exports = router;
