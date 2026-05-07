const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../config/db');

const PYTHON_API = process.env.PYTHON_API_URL;

router.get('/:id/analytics', async (req, res) => {

  const equipoId = parseInt(req.params.id, 10);

  if (isNaN(equipoId)) {
    return res.status(400).json({
      error: 'ID inválido'
    });
  }

  try {

    // Obtener equipo
    const [equipoRows] = await db.query(
      'SELECT id, nombre FROM equipos WHERE id = ?',
      [equipoId]
    );

    if (!equipoRows.length) {
      return res.status(404).json({
        error: 'Equipo no encontrado'
      });
    }

    const equipo = equipoRows[0];

    // Obtener jugadores
    const [jugadoresRows] = await db.query(
      `SELECT id, nombre, posicion
       FROM jugadores
       WHERE equipo_id = ?`,
      [equipoId]
    );

    if (!jugadoresRows.length) {
      return res.json({
        equipo_id: equipoId,
        nombre: equipo.nombre,
        analysis: null,
        mensaje: 'El equipo no tiene jugadores registrados'
      });
    }

    // Obtener estadísticas de cada jugador
    const jugadoresConStats = await Promise.all(

      jugadoresRows.map(async (jugador) => {

        const [stats] = await db.query(
          `SELECT ataques, bloqueos, recepciones, errores
           FROM estadisticas_jugador
           WHERE jugador_id = ?
           ORDER BY created_at ASC`,
          [jugador.id]
        );

        return {
          player_id: jugador.id,
          name: jugador.nombre,
          position: jugador.posicion || '',
          stats: stats.map((s) => ({
            ataques: Number(s.ataques) || 0,
            bloqueos: Number(s.bloqueos) || 0,
            recepciones: Number(s.recepciones) || 0,
            errores: Number(s.errores) || 0
          }))
        };

      })

    );

    // Filtrar jugadores con estadísticas
    const playersWithData = jugadoresConStats.filter(
      (p) => p.stats.length > 0
    );

    if (!playersWithData.length) {
      return res.json({
        equipo_id: equipoId,
        nombre: equipo.nombre,
        analysis: null,
        mensaje: 'Ningún jugador tiene estadísticas aún'
      });
    }

    // Payload para FastAPI
    const payload = {
      match_id: equipoId,
      players: playersWithData
    };

    console.log('Enviando a Python:', payload);

    // Request al microservicio Python
    const response = await axios.post(
      `${PYTHON_API}/analyze/players`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('Respuesta Python:', response.data);

    // Respuesta final
    return res.json({
      equipo_id: equipoId,
      nombre: equipo.nombre,
      analytics_result: response.data
    });

  } catch (err) {

    console.error('Error analytics equipo:', err);

    return res.status(500).json({
      error: 'Error al generar análisis',
      details:
        err.response?.data ||
        err.message ||
        'Error desconocido'
    });

  }

});

module.exports = router;