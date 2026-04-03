const db = require('../config/db');

const Jugador = {
  create: (jugador, callback) => {
    const sql = `
      INSERT INTO jugadores 
      (nombre, fecha_nacimiento, posicion, numero, equipo_id) 
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(sql, [
      jugador.nombre, jugador.fecha_nacimiento, jugador.posicion, jugador.numero, jugador.equipo_id
    ], callback);
  }, 

  delete: (id) => {
    return db.query('DELETE FROM jugadores WHERE id = ?', [id]);
  },
};

module.exports = Jugador;