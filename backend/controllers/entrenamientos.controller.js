const db = require('../config/db');

const ESTADOS_ENTRENAMIENTO = ['programado', 'en_curso', 'completado', 'cancelado'];
const APP_TIME_ZONE = process.env.APP_TIME_ZONE || 'America/Bogota';

function getFechaHoraLocal() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}`;
}

exports.createEntrenamiento = async (req, res) => {
  try {
    let { equipo_id, fecha, hora, tipo, duracion, descripcion } = req.body;

    if (!equipo_id || !fecha || !hora || !tipo || !duracion) {
      return res.status(400).json({
        message: 'Faltan campos obligatorios'
      });
    }

    tipo = tipo.trim().toLowerCase();

    const [result] = await db.query(
      `INSERT INTO entrenamientos 
      (equipo_id, fecha, hora, tipo, duracion, descripcion) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [equipo_id, fecha, hora, tipo, duracion, descripcion || null]
    );

    res.status(201).json({
      message: 'Entrenamiento creado correctamente',
      id: result.insertId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al crear entrenamiento'
    });
  }
};

exports.getEntrenamientos = async (req, res) => {
  try {

    const sql = `
      SELECT 
        entrenamiento.id,
        entrenamiento.equipo_id,
        entrenamiento.fecha,
        entrenamiento.hora,
        entrenamiento.duracion,
        entrenamiento.tipo,
        entrenamiento.estado,
        e.nombre AS equipo_nombre
      FROM entrenamientos entrenamiento
      LEFT JOIN equipos e ON entrenamiento.equipo_id = e.id
      ORDER BY entrenamiento.created_at DESC
    `;

    const [rows] = await db.query(sql);

    res.status(200).json(rows);

  } catch (error) {
    console.error('ERROR SQL (getEntrenamientos):', error);
    res.status(500).json({
      message: 'Error al obtener entrenamientos'
    });
  }
};

exports.getReporteAsistencias = async (req, res) => {
  try {
    const sql = `
      SELECT
        e.id AS entrenamiento_id,
        e.fecha,
        e.hora,
        e.tipo,
        e.estado AS estado_entrenamiento,
        eq.id AS equipo_id,
        eq.nombre AS equipo_nombre,
        j.id AS jugador_id,
        j.nombre AS jugador_nombre,
        j.numero AS jugador_numero,
        j.posicion AS jugador_posicion,
        COALESCE(a.estado, 'sin registrar') AS estado_asistencia
      FROM entrenamientos e
      LEFT JOIN equipos eq ON e.equipo_id = eq.id
      LEFT JOIN jugadores j ON j.equipo_id = e.equipo_id
      LEFT JOIN asistencias a
        ON a.entrenamiento_id = e.id
        AND a.jugador_id = j.id
      ORDER BY e.fecha DESC, e.hora DESC, eq.nombre ASC, j.nombre ASC
    `;

    const [rows] = await db.query(sql);
    res.status(200).json(rows);
  } catch (error) {
    console.error('ERROR SQL (getReporteAsistencias):', error);
    res.status(500).json({
      message: 'Error al obtener reporte de asistencias'
    });
  }
};

exports.deleteEntrenamiento = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'DELETE FROM entrenamientos WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Entrenamiento no encontrado' });
    }

    res.json({ message: 'Entrenamiento eliminado' });

  } catch (error) {
    console.error('ERROR DELETE:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getEntrenamientoById = async (req, res) => {
  try {
    const { id } = req.params;
    const [entrenamientos] = await db.query(`
      SELECT 
        e.*, eq.nombre as equipo_nombre
      FROM entrenamientos e
      LEFT JOIN equipos eq ON e.equipo_id = eq.id
      WHERE e.id = ?
    `, [id]);

    if (entrenamientos.length === 0) {
      return res.status(404).json({ message: 'Entrenamiento no encontrado' });
    }

    const entrenamiento = entrenamientos[0];

    // Get jugadores del equipo
    const [jugadores] = await db.query(`
      SELECT id, nombre, numero, posicion, foto_url 
      FROM jugadores 
      WHERE equipo_id = ?
    `, [entrenamiento.equipo_id]);

    // Get asistencia existente
    const [asistencias] = await db.query(`
      SELECT jugador_id, estado 
      FROM asistencias 
      WHERE entrenamiento_id = ?
    `, [id]);

    const asistenciaMap = {};
    asistencias.forEach(a => {
      asistenciaMap[a.jugador_id] = a.estado === 'presente';
    });

    jugadores.forEach(j => {
      j.presente = asistenciaMap[j.id] !== undefined ? asistenciaMap[j.id] : false;
    });

    res.json({
      ...entrenamiento,
      jugadores
    });

  } catch (error) {
    console.error('ERROR getEntrenamientoById:', error);
    res.status(500).json({ message: 'Error al obtener entrenamiento' });
  }
};

exports.updateEntrenamiento = async (req, res) => {
  try {
    const { id } = req.params;
    let { equipo_id, fecha, hora, tipo, duracion, descripcion, estado } = req.body;

    if (!equipo_id || !fecha || !hora || !tipo || !duracion || !estado) {
      return res.status(400).json({
        message: 'Faltan campos obligatorios'
      });
    }

    const [entrenamientos] = await db.query(
      'SELECT estado FROM entrenamientos WHERE id = ?',
      [id]
    );

    if (entrenamientos.length === 0) {
      return res.status(404).json({ message: 'Entrenamiento no encontrado' });
    }

    if (entrenamientos[0].estado === 'completado') {
      return res.status(400).json({
        message: 'No se puede editar un entrenamiento completado'
      });
    }

    tipo = tipo.trim().toLowerCase();
    estado = estado.trim().toLowerCase();

    if (!ESTADOS_ENTRENAMIENTO.includes(estado)) {
      return res.status(400).json({ message: 'Estado invalido' });
    }

    const [result] = await db.query(
      `UPDATE entrenamientos
       SET equipo_id = ?, fecha = ?, hora = ?, tipo = ?, duracion = ?, descripcion = ?, estado = ?
       WHERE id = ?`,
      [equipo_id, fecha, hora, tipo, duracion, descripcion || null, estado, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Entrenamiento no encontrado' });
    }

    res.json({ message: 'Entrenamiento actualizado correctamente' });

  } catch (error) {
    console.error('ERROR updateEntrenamiento:', error);
    res.status(500).json({ message: 'Error al actualizar entrenamiento' });
  }
};

exports.updateEstadoEntrenamiento = async (req, res) => {
  try {
    const { id } = req.params;
    let { estado } = req.body;

    if (!estado) {
      return res.status(400).json({ message: 'El estado es obligatorio' });
    }

    estado = estado.trim().toLowerCase();

    if (!ESTADOS_ENTRENAMIENTO.includes(estado)) {
      return res.status(400).json({ message: 'Estado invalido' });
    }

    const [entrenamientos] = await db.query(
      'SELECT estado FROM entrenamientos WHERE id = ?',
      [id]
    );

    if (entrenamientos.length === 0) {
      return res.status(404).json({ message: 'Entrenamiento no encontrado' });
    }

    if (entrenamientos[0].estado === 'completado' && estado !== 'completado') {
      return res.status(400).json({
        message: 'No se puede cambiar un entrenamiento completado'
      });
    }

    await db.query(
      'UPDATE entrenamientos SET estado = ? WHERE id = ?',
      [estado, id]
    );

    res.json({ message: 'Estado actualizado correctamente', estado });
  } catch (error) {
    console.error('ERROR updateEstadoEntrenamiento:', error);
    res.status(500).json({ message: 'Error al actualizar estado del entrenamiento' });
  }
};

exports.saveAsistencia = async (req, res) => {
  try {
    const { id } = req.params;
    const { asistencias } = req.body; // [{jugador_id, presente: bool}]

    // Delete existing
    await db.query('DELETE FROM asistencias WHERE entrenamiento_id = ?', [id]);

    // Insert new with the app's local time instead of relying on server/DB defaults.
    const fechaRegistro = getFechaHoraLocal();
    const values = asistencias.map(a => [id, a.jugador_id, a.presente ? 'presente' : 'ausente', fechaRegistro]);
    if (values.length > 0) {
      await db.query(`
        INSERT INTO asistencias (entrenamiento_id, jugador_id, estado, created_at) VALUES ?
      `, [values]);
    }

    res.json({ message: 'Asistencia guardada correctamente' });

  } catch (error) {
    console.error('ERROR saveAsistencia:', error);
    res.status(500).json({ message: 'Error al guardar asistencia' });
  }
};
