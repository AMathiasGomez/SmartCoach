const db = require('../config/db');

const Equipo = {
  getAll: async () => {
    const [rows] = await db.execute('SELECT * FROM equipos'); 
    return rows;
  },

  getById: (id) => {
    return db.query('SELECT * FROM equipos WHERE id = ?', [id]);
  },

  create: (equipo) => {
    return db.query(
      'INSERT INTO equipos (nombre, categoria, ano_fundacion, descripcion) VALUES (?, ?, ?, ?)',
      [equipo.nombre, equipo.categoria, equipo.ano_fundacion, equipo.descripcion]
    );
  },

  update: (id, equipo) => {
    return db.query(
      'UPDATE equipos SET nombre = ?, categoria = ?, ano_fundacion = ?, descripcion = ? WHERE id = ?',
      [equipo.nombre, equipo.categoria, equipo.ano_fundacion, equipo.descripcion, id]
    );
  },

  delete: (id) => {
    return db.query('DELETE FROM equipos WHERE id = ?', [id]);
  },

  getById: (id) => {
    return db.query('SELECT * FROM equipos WHERE id = ?', [id]);
  }
};

module.exports = Equipo;