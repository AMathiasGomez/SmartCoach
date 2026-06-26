const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');

const PYTHON_SCRIPT = path.join(__dirname, '..', 'analytics', 'models', 'playerAnalytics.py');
const PYTHON_BINARIES = [process.env.PYTHON_BIN, 'python3', 'python', 'py'].filter(Boolean);
const ANALYTICS_SERVICE_URL = (process.env.ANALYTICS_SERVICE_URL || '').replace(/\/$/, '');

async function runRemotePlayerAnalysis(payload) {
  if (!ANALYTICS_SERVICE_URL) {
    throw new Error('ANALYTICS_SERVICE_URL no configurado');
  }

  const response = await axios.post(
    `${ANALYTICS_SERVICE_URL}/analyze/player`,
    payload,
    { timeout: 30000 }
  );

  return response.data;
}

function runLocalPlayerAnalysis(payload) {
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
          lastError = new Error(stderr || `Python exited ${code}`);
          return tryNext();
        }

        try {
          resolve(JSON.parse(stdout.trim()));
        } catch (error) {
          reject(new Error(`Invalid JSON from Python: ${stdout}`));
        }
      });

      py.stdin.write(JSON.stringify(payload));
      py.stdin.end();
    };

    tryNext();
  });
}

async function analyzePlayer(jugadorId, posicion, partidos) {
  const payload = { jugador_id: jugadorId, posicion, partidos };

  if (ANALYTICS_SERVICE_URL) {
    return runRemotePlayerAnalysis(payload);
  }

  return runLocalPlayerAnalysis(payload);
}

module.exports = { analyzePlayer };
