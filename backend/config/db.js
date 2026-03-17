const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "159951",
  database: "smartcoach"
});

connection.connect((error) => {
  if (error) {
    console.error("Error de conexión:", error);
  } else {
    console.log("Conectado a la base de datos SmartCoach");
  }
});


module.exports = connection;