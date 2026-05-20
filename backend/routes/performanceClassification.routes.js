// routes/performanceClassification.js
// SmartCoach – Endpoint: Clasificación Combinada de Rendimiento
// POST /api/analysis/classify-performance

const express = require("express");
const router  = express.Router();
const { spawn } = require("child_process");
const path    = require("path");
const db      = require("../config/db");

const GENERAL_CLASSIFIER = path.join(__dirname, "../analytics/models/performanceClassifier.py");

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

function runGeneralClassifier(payload) {
  return new Promise((resolve, reject) => {
    const py = spawn("python", [GENERAL_CLASSIFIER]);

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

router.get("/classify-general", async (req, res) => {
  try {
    const teamId = Number(req.query.team_id);

    if (!teamId) {
      return res.status(400).json({ success: false, error: "Se requiere team_id." });
    }

    const [teamRows] = await db.query(
      "SELECT id, nombre FROM equipos WHERE id = ?",
      [teamId]
    );

    if (!teamRows.length) {
      return res.status(404).json({ success: false, error: "Equipo no encontrado." });
    }

    const team = teamRows[0];
    const [players] = await db.query(
      "SELECT id, nombre, posicion FROM jugadores WHERE equipo_id = ?",
      [teamId]
    );

    if (!players.length) {
      return res.json({
        success: true,
        data: {
          team_id: String(team.id),
          team_name: team.nombre,
          classification: [],
          total_players: 0,
          summary: { alto: 0, medio: 0, bajo: 0, top_player: null }
        }
      });
    }

    const playersWithStats = await Promise.all(players.map(async (player) => {
      const [rows] = await db.query(
        `SELECT
           sp.partido_id,
           COALESCE(SUM(ejs.ataques_positivos), 0) AS ataques,
           COALESCE(SUM(ejs.bloqueos_positivos), 0) AS bloqueos,
           COALESCE(SUM(ejs.recepciones_positivas), 0) AS recepciones,
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
         WHERE ejs.jugador_id = ?
         GROUP BY sp.partido_id`,
        [player.id]
      );

      const partidos = rows.length || 0;
      const totals = rows.reduce((acc, row) => {
        acc.ataques += Number(row.ataques) || 0;
        acc.bloqueos += Number(row.bloqueos) || 0;
        acc.recepciones += Number(row.recepciones) || 0;
        acc.errores += Number(row.errores) || 0;
        return acc;
      }, { ataques: 0, bloqueos: 0, recepciones: 0, errores: 0 });

      return {
        player_id: String(player.id),
        name: player.nombre,
        posicion: player.posicion || "Sin posicion",
        partidos,
        raw_score: totals.ataques + totals.bloqueos + totals.recepciones - totals.errores,
        promedios: {
          ataques: partidos ? totals.ataques / partidos : 0,
          bloqueos: partidos ? totals.bloqueos / partidos : 0,
          recepciones: partidos ? totals.recepciones / partidos : 0,
          errores: partidos ? totals.errores / partidos : 0
        }
      };
    }));

    const playersWithMatches = playersWithStats.filter(player => player.partidos > 0);

    if (!playersWithMatches.length) {
      return res.status(400).json({
        success: false,
        error: "El equipo aun no tiene estadisticas registradas para clasificar jugadores."
      });
    }

    const minScore = Math.min(...playersWithMatches.map(player => player.raw_score));
    const maxScore = Math.max(...playersWithMatches.map(player => player.raw_score));
    const range = maxScore - minScore || 1;

    const payload = {
      team_id: String(team.id),
      team_name: team.nombre,
      players: playersWithMatches.map(player => ({
        player_id: player.player_id,
        name: player.name,
        posicion: player.posicion,
        score_historico: Number((((player.raw_score - minScore) / range) * 10).toFixed(2)),
        partidos: player.partidos,
        promedios: player.promedios
      }))
    };

    const result = await runGeneralClassifier(payload);

    if (result.error) {
      return res.status(500).json({ success: false, error: result.error });
    }

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("[classify-general] Error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

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
