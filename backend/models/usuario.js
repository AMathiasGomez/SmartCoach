const db = require('../config/db');

const Usuario = {
  getAll: async () => {
    const [rows] = await db.execute('SELECT * FROM usuarios'); 
    return rows;
  },

  delete: (id) => {
    return db.query('DELETE FROM usuarios WHERE id = ?', [id]);
  },
};

module.exports = Jugador;