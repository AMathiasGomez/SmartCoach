// routes/performanceClassification.js
// SmartCoach – Endpoint: Clasificación Combinada de Rendimiento
// POST /api/analysis/classify-performance

const express = require("express");
const router  = express.Router();
const { spawn } = require("child_process");
const path    = require("path");

/**
 * Llama al script Python y devuelve el resultado como Promise.
 * @param {object} payload  - { match_analysis, team_analysis }
 * @returns {Promise<object>}
 */
function runClassifier(payload) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "../scripts/performance_classifier.py");

    const py = spawn("python3", [scriptPath]);

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    py.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

    py.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`Python exited with code ${code}: ${stderr}`));
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (e) {
        reject(new Error(`Error parsing Python output: ${stdout}`));
      }
    });

    py.stdin.write(JSON.stringify(payload));
    py.stdin.end();
  });
}

/**
 * POST /api/analysis/classify-performance
 *
 * Body esperado:
 * {
 *   "match_analysis": {         ← resultado del análisis post-partido
 *     "match_id": "56",
 *     "analysis": [
 *       {
 *         "player_id": "45",
 *         "name": "Nishida",
 *         "score": 10.8,
 *         "stats": { "ataques": 12, "bloqueos": 2, "recepciones": 8, "errores": 1 }
 *       }
 *     ]
 *   },
 *   "team_analysis": {          ← resultado del análisis de equipo
 *     "overall_score": 4.14,
 *     "ranking_jugadores": [
 *       { "jugador_id": 45, "nombre": "Nishida", "posicion": "Opuesto", "score": 4.91, "partidos": 2 }
 *     ]
 *   }
 * }
 *
 * Respuesta:
 * {
 *   "success": true,
 *   "data": {
 *     "classification": [...],   ← jugadores ordenados por combined_score
 *     "total_players": 7,
 *     "team_overall": 4.14,
 *     "summary": {
 *       "alto": 1, "medio": 4, "bajo": 2,
 *       "top_player": { "player_id": "45", "name": "Nishida", "nivel": "Alto", "combined_score": 7.84 }
 *     }
 *   }
 * }
 */
router.post("/classify-performance", async (req, res) => {
  try {
    const { match_analysis, team_analysis } = req.body;

    // ── Validación básica ────────────────────────────────────────────────────
    if (!match_analysis || !team_analysis) {
      return res.status(400).json({
        success: false,
        error: "Se requieren 'match_analysis' y 'team_analysis' en el body."
      });
    }

    if (!Array.isArray(match_analysis.analysis) || match_analysis.analysis.length === 0) {
      return res.status(400).json({
        success: false,
        error: "match_analysis.analysis debe ser un array con al menos un jugador."
      });
    }

    if (!Array.isArray(team_analysis.ranking_jugadores)) {
      return res.status(400).json({
        success: false,
        error: "team_analysis.ranking_jugadores debe ser un array."
      });
    }

    // ── Ejecutar clasificador Python ─────────────────────────────────────────
    const result = await runClassifier({ match_analysis, team_analysis });

    if (result.error) {
      return res.status(500).json({ success: false, error: result.error });
    }

    return res.status(200).json({ success: true, data: result });

  } catch (err) {
    console.error("[classify-performance] Error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;