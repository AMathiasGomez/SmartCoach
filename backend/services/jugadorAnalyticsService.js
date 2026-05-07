const { spawn } = require('child_process');
const path = require('path');
 
const PYTHON_SCRIPT = path.join(__dirname, '..', 'analytics', 'models', 'playerAnalytics.py');
 
function analyzePlayer(jugadorId, posicion, partidos) {
  return new Promise((resolve, reject) => {
    const input = JSON.stringify({ jugador_id: jugadorId, posicion, partidos });
 
    const py = spawn('py', [PYTHON_SCRIPT]);
 
    let stdout = '';
    let stderr = '';
 
    py.stdout.on('data', (chunk) => { stdout += chunk; });
    py.stderr.on('data', (chunk) => { stderr += chunk; });
 
    py.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python exited ${code}: ${stderr}`));
      }
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch (e) {
        reject(new Error(`Invalid JSON from Python: ${stdout}`));
      }
    });
 
    py.stdin.write(input);
    py.stdin.end();
  });
}
 
module.exports = { analyzePlayer };