const db = require('../config/db');

const Partido = {

  create: (partido, callback) => {
    const sql = `
      INSERT INTO partidos 
      (nombre, equipo_id, tipo, fecha, rival, ubicacion, estado) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
      partido.nombre,
      partido.equipo_id,
      partido.tipo,
      partido.fecha,
      partido.rival,
      partido.ubicacion,
      partido.estado
    ], callback);
  },

  getAll: (callback) => {
    const sql = `
      SELECT p.*, e.nombre AS equipo_nombre
      FROM partidos p
      JOIN equipos e ON p.equipo_id = e.id
      ORDER BY p.fecha DESC
    `;

    db.query(sql, callback);
  },

  getById: (id, callback) => {
    const sql = `SELECT * FROM partidos WHERE id = ?`;
    db.query(sql, [id], callback);
  },

  update: (id, partido, callback) => {
    const sql = `
      UPDATE partidos SET
        nombre = ?,
        equipo_id = ?,
        tipo = ?,
        fecha = ?,
        rival = ?,
        ubicacion = ?,
        estado = ?
      WHERE id = ?
    `;

    db.query(sql, [
      partido.nombre,
      partido.equipo_id,
      partido.tipo,
      partido.fecha,
      partido.rival,
      partido.ubicacion,
      partido.estado,
      id
    ], callback);
  },

  delete: (id) => {
    return db.query('DELETE FROM partidos WHERE id = ?', [id]);
  }

};

module.exports = Partido;