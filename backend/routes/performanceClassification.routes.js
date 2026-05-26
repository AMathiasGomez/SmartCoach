// routes/performanceClassification.js
// SmartCoach – Endpoint: Clasificación Combinada de Rendimiento
// POST /api/analysis/classify-performance

const express = require("express");
const router  = express.Router();
const { spawn } = require("child_process");
const path    = require("path");
const db      = require("../config/db");

const GENERAL_CLASSIFIER = path.join(__dirname, "../analytics/models/performanceClassifier.py");

const POSITION_ALIASES = {
  punta: "Punta",
  "outside hitter": "Punta",
  opuesto: "Opuesto",
  "opposite hitter": "Opuesto",
  central: "Central",
  "middle blocker": "Central",
  armador: "Armador",
  setter: "Armador",
  libero: "Libero",
};

const RADAR_WEIGHTS = {
  Punta: {
    ataque: 0.30,
    recepcion: 0.25,
    defensa: 0.20,
    saque: 0.10,
    bloqueo: 0.05,
    consistencia: 0.10,
  },
  Opuesto: {
    ataque: 0.45,
    bloqueo: 0.20,
    saque: 0.15,
    consistencia: 0.20,
  },
  Central: {
    bloqueo: 0.40,
    ataque: 0.35,
    consistencia: 0.15,
    saque: 0.10,
  },
  Armador: {
    armado: 0.50,
    consistencia: 0.20,
    defensa: 0.15,
    saque: 0.10,
    bloqueo: 0.05,
  },
  Libero: {
    recepcion: 0.45,
    defensa: 0.40,
    consistencia: 0.15,
  },
};

function number(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePosition(position) {
  const key = String(position || "Punta").trim().toLowerCase();
  return POSITION_ALIASES[key] || position || "Punta";
}

function safeDiv(numerator, denominator) {
  return denominator ? numerator / denominator : 0;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function scoreFromEfficiency(value) {
  return Math.round(clamp((value + 1) * 50) * 100) / 100;
}

function calculatePlayerScore100(position, stats) {
  const totalErrors =
    stats.errores_ataque +
    stats.errores_saque +
    stats.errores_bloqueo +
    stats.recepciones_negativas +
    stats.defensas_negativas +
    stats.errores_armado;

  const totalPositive =
    stats.ataques_positivos +
    stats.aces +
    stats.bloqueos_positivos +
    stats.recepciones_positivas +
    stats.defensas_positivas +
    stats.asistencias;

  const totalActions = totalPositive + totalErrors;

  const metrics = {
    eficiencia_ataque: safeDiv(stats.ataques_positivos - stats.errores_ataque, stats.ataques_positivos + stats.errores_ataque),
    eficiencia_saque: safeDiv(stats.aces - stats.errores_saque, stats.aces + stats.errores_saque),
    eficiencia_bloqueo: safeDiv(stats.bloqueos_positivos - stats.errores_bloqueo, stats.bloqueos_positivos + stats.errores_bloqueo),
    eficiencia_recepcion: safeDiv(stats.recepciones_positivas - stats.recepciones_negativas, stats.recepciones_positivas + stats.recepciones_negativas),
    eficiencia_defensa: safeDiv(stats.defensas_positivas - stats.defensas_negativas, stats.defensas_positivas + stats.defensas_negativas),
    eficiencia_armado: safeDiv(stats.asistencias - stats.errores_armado, stats.asistencias + stats.errores_armado),
    control_errores: 1 - safeDiv(totalErrors, totalActions),
  };

  const allAxes = {
    ataque: scoreFromEfficiency(metrics.eficiencia_ataque),
    recepcion: scoreFromEfficiency(metrics.eficiencia_recepcion),
    defensa: scoreFromEfficiency(metrics.eficiencia_defensa),
    saque: scoreFromEfficiency(metrics.eficiencia_saque),
    bloqueo: scoreFromEfficiency(metrics.eficiencia_bloqueo),
    armado: scoreFromEfficiency(metrics.eficiencia_armado),
    consistencia: Math.round(clamp(metrics.control_errores * 100) * 100) / 100,
  };

  const normalizedPosition = normalizePosition(position);
  const weights = RADAR_WEIGHTS[normalizedPosition] || RADAR_WEIGHTS.Punta;
  const score = Object.entries(weights).reduce((sum, [axis, weight]) => {
    return sum + (allAxes[axis] || 0) * weight;
  }, 0);

  return Math.round(score * 100) / 100;
}

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
        acc.ataques_positivos += number(row.ataques_positivos);
        acc.errores_ataque += number(row.errores_ataque);
        acc.aces += number(row.aces);
        acc.errores_saque += number(row.errores_saque);
        acc.bloqueos_positivos += number(row.bloqueos_positivos);
        acc.errores_bloqueo += number(row.errores_bloqueo);
        acc.recepciones_positivas += number(row.recepciones_positivas);
        acc.recepciones_negativas += number(row.recepciones_negativas);
        acc.defensas_positivas += number(row.defensas_positivas);
        acc.defensas_negativas += number(row.defensas_negativas);
        acc.asistencias += number(row.asistencias);
        acc.errores_armado += number(row.errores_armado);
        acc.errores += number(row.errores);
        return acc;
      }, {
        ataques_positivos: 0,
        errores_ataque: 0,
        aces: 0,
        errores_saque: 0,
        bloqueos_positivos: 0,
        errores_bloqueo: 0,
        recepciones_positivas: 0,
        recepciones_negativas: 0,
        defensas_positivas: 0,
        defensas_negativas: 0,
        asistencias: 0,
        errores_armado: 0,
        errores: 0,
      });

      const scorePosicional100 = calculatePlayerScore100(player.posicion, totals);

      return {
        player_id: String(player.id),
        name: player.nombre,
        posicion: player.posicion || "Sin posicion",
        partidos,
        score_posicional_100: scorePosicional100,
        promedios: {
          ataques: partidos ? totals.ataques_positivos / partidos : 0,
          bloqueos: partidos ? totals.bloqueos_positivos / partidos : 0,
          recepciones: partidos ? totals.recepciones_positivas / partidos : 0,
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

    const payload = {
      team_id: String(team.id),
      team_name: team.nombre,
      players: playersWithMatches.map(player => ({
        player_id: player.player_id,
        name: player.name,
        posicion: player.posicion,
        score_historico: Number((player.score_posicional_100 / 10).toFixed(2)),
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
