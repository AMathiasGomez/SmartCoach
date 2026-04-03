const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '159951',
  database: 'smartcoach',
});

module.exports = db;