const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api/equipos', require('./routes/equipo.routes'));

app.listen(3006, () => {
  console.log('Servidor corriendo en puerto 3306');
});