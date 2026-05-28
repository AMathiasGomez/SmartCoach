require('dotenv').config();

console.log('DB_HOST:', process.env.DB_HOST);

const mysql = require('mysql2/promise');

const dbTimeZone = process.env.DB_TIMEZONE || '-05:00';

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  timezone: dbTimeZone,
  dateStrings: true,
});

db.on('connection', (connection) => {
  connection.query(`SET time_zone = ?`, [dbTimeZone]);
});

module.exports = db;
