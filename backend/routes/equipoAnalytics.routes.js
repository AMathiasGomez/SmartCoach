const express = require('express');
const router  = express.Router();
const path    = require('path');
const { spawn } = require('child_process');
const axios = require('axios');
const db      = require('../config/db');

const PYTHON_SCRIPT = path.join(__dirname, '..', 'analytics', 'models', 'teamAnalytics.py');
const PYTHON_BINARIES = [process.env.PYTHON_BIN, 'python3', 'python', 'py'].filter(Boolean);
const ANALYTICS_SERVICE_URL = (process.env.ANALYTICS_SERVICE_URL || '').replace(/\/$/, '');
const DETAILED_COLUMNS = [
  'ataques_positivos',
  'errores_ataque',
  'aces',
  'errores_saque',
  'bloqueos_positivos',
  'errores_bloqueo',
  'recepciones_positivas',
  'recepciones_negativas',
  'defensas_positivas',
  'defensas_negativas',
  'asistencias',
  'errores_armado',
];

function detailedSumSelect(alias) {
  return DETAILED_COLUMNS
    .map(column => `COALESCE(SUM(${alias}.${column}), 0) AS ${column}`)
    .join(',\n             ');
}

async function runRemotePython(payload) {
  if (!ANALYTICS_SERVICE_URL) {
    throw new Error('ANALYTICS_SERVICE_URL no configurado');
  }

  const response = await axios.post(
    `${ANALYTICS_SERVICE_URL}/analyze/team`,
    payload,
    { timeout: 30000 }
  );

  return response.data;
}

function runLocalPython(input) {
  return new Promise((resolve, reject) => {
    const py = spawn('python', [PYTHON_SCRIPT]);
    let out = '', err = '';
    py.stdout.on('data', c => out += c);
    py.stderr.on('data', c => err += c);
    py.on('close', code => {
      if (code !== 0) return reject(new Error(`Python exited ${code}: ${err}`));
      try { resolve(JSON.parse(out.trim())); }
      catch(e) { reject(new Error(`JSON inválido: ${out}`)); }
    });
    py.stdin.write(input);
    py.stdin.end();
  });
}

router.get('/:id/analytics', async (req, res) => {
  const equipoId = parseInt(req.params.id, 10);
  if (isNaN(equipoId)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const [equipoRows] = await db.query(
      'SELECT id, nombre FROM equipos WHERE id = ?', [equipoId]
    );
    if (!equipoRows?.length) return res.status(404).json({ error: 'Equipo no encontrado' });
    const equipo = equipoRows[0];

    const [jugadoresRows] = await db.query(
      'SELECT id, nombre, posicion FROM jugadores WHERE equipo_id = ?', [equipoId]
    );

    if (!jugadoresRows?.length) {
      return res.json({ equipo_id: equipoId, nombre: equipo.nombre,
        analysis: null, mensaje: 'El equipo no tiene jugadores registrados' });
    }

    const jugadoresConStats = await Promise.all(
      jugadoresRows.map(async (j) => {
        const [stats] = await db.query(
          `SELECT
             sp.partido_id,
             p.fecha,
             ${detailedSumSelect('ejs')},
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
          [j.id]
        );
        return {
          jugador_id: j.id,
          nombre:     j.nombre,
          posicion:   j.posicion || '',
          partidos:   (stats || []).map(s => ({
            partido_id: s.partido_id,
            ...DETAILED_COLUMNS.reduce((acc, column) => {
              acc[column] = Number(s[column]) || 0;
              return acc;
            }, {}),
            ataques: Number(s.ataques) || 0,
            bloqueos: Number(s.bloqueos) || 0,
            recepciones: Number(s.recepciones) || 0,
            errores: Number(s.errores) || 0,
          }))
        };
      })
    );

    const conDatos = jugadoresConStats.filter(j => j.partidos.length > 0);

    if (!conDatos.length) {
      return res.json({ equipo_id: equipoId, nombre: equipo.nombre,
        analysis: null, mensaje: 'Ningún jugador tiene estadísticas aún' });
    }

    const [setsRows] = await db.query(
      `SELECT
         sp.partido_id,
         sp.numero_set,
         ${detailedSumSelect('ejs')},
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
       JOIN jugadores j ON ejs.jugador_id = j.id
       WHERE j.equipo_id = ?
       GROUP BY sp.partido_id, sp.numero_set
       ORDER BY sp.partido_id ASC, sp.numero_set ASC`,
      [equipoId]
    );

    const sets = (setsRows || []).map(s => ({
      partido_id: s.partido_id,
      numero_set: s.numero_set,
      ...DETAILED_COLUMNS.reduce((acc, column) => {
        acc[column] = Number(s[column]) || 0;
        return acc;
      }, {}),
      ataques: Number(s.ataques) || 0,
      bloqueos: Number(s.bloqueos) || 0,
      recepciones: Number(s.recepciones) || 0,
      errores: Number(s.errores) || 0,
    }));

    const payload = { equipo_id: equipoId, jugadores: conDatos, sets };
    const analysis = ANALYTICS_SERVICE_URL
      ? await runRemotePython(payload)
      : await runLocalPython(JSON.stringify(payload));

    console.log('>>> ANÁLISIS EQUIPO:', JSON.stringify(analysis, null, 2));

    res.json({ equipo_id: equipoId, nombre: equipo.nombre, analysis });

  } catch (err) {
    console.error('Error analytics equipo:', err.message);
    res.status(500).json({ error: 'Error al generar análisis', details: err.message });
  }
});

module.exports = router;
