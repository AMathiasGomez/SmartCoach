const express = require('express');
const router  = express.Router();
const path    = require('path');
const { spawn } = require('child_process');
const db      = require('../config/db');
 
const PYTHON_SCRIPT = path.join(__dirname, '..', 'analytics', 'models', 'teamAnalytics.py');
 
function runPython(input) {
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
      'SELECT id, nombre FROM equipos WHERE id = ?',
      [equipoId]
    );
    if (!equipoRows?.length) return res.status(404).json({ error: 'Equipo no encontrado' });
    const equipo = equipoRows[0];
 
    const [jugadoresRows] = await db.query(
      'SELECT id, nombre, posicion FROM jugadores WHERE equipo_id = ?',
      [equipoId]
    );
 
    if (!jugadoresRows?.length) {
      return res.json({ equipo_id: equipoId, nombre: equipo.nombre,
        analysis: null, mensaje: 'El equipo no tiene jugadores registrados' });
    }
 
    const jugadoresConStats = await Promise.all(
      jugadoresRows.map(async (j) => {
        const [stats] = await db.query(
          `SELECT ataques, bloqueos, recepciones, errores
           FROM estadisticas_jugador
           WHERE jugador_id = ?
           ORDER BY created_at ASC`,
          [j.id]
        );
        return {
          jugador_id: j.id,
          nombre:     j.nombre,
          posicion:   j.posicion || '',
          partidos:   (stats || []).map(s => ({
            ataques:     Number(s.ataques)     || 0,
            bloqueos:    Number(s.bloqueos)    || 0,
            recepciones: Number(s.recepciones) || 0,
            errores:     Number(s.errores)     || 0,
          }))
        };
      })
    );
 
    const conDatos = jugadoresConStats.filter(j => j.partidos.length > 0);
 
    if (!conDatos.length) {
      return res.json({ equipo_id: equipoId, nombre: equipo.nombre,
        analysis: null, mensaje: 'Ningún jugador tiene estadísticas aún' });
    }
 
    const payload  = JSON.stringify({ equipo_id: equipoId, jugadores: conDatos });
    const analysis = await runPython(payload);
 
    res.json({ equipo_id: equipoId, nombre: equipo.nombre, analysis });
 
  } catch (err) {
    console.error('Error analytics equipo:', err.message);
    res.status(500).json({ error: 'Error al generar análisis', details: err.message });
  }
});
 
module.exports = router;