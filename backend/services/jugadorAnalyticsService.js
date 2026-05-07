const axios = require('axios');

const PYTHON_API = process.env.PYTHON_API_URL;

async function analyzePlayer(jugadorId, posicion, partidos) {

    try {

        const payload = {
            match_id: jugadorId,
            players: [
                {
                    player_id: jugadorId,
                    position: posicion,
                    stats: partidos
                }
            ]
        };

        console.log('Enviando jugador a Python:', payload);

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

        return response.data;

    } catch (error) {

        console.error(
            'Error análisis jugador:',
            error.response?.data || error.message
        );

        throw new Error(
            error.response?.data?.detail ||
            error.message ||
            'Error en análisis Python'
        );
    }
}

module.exports = { analyzePlayer };