const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());

// 👇 Reemplaza app.use(express.json()) con esto
app.use((req, res, next) => {
  if (req.path.startsWith('/api/jugadores')) {
    return next();
  }
  express.json()(req, res, next);
});

app.use('/uploads', express.static('uploads'));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/equipos', require('./routes/equipo.routes'));
app.use('/api/jugadores', require('./routes/jugador.routes'));
app.use('/api/usuarios', require('./routes/user.routes'));
app.use('/api/partidos', require('./routes/partido.routes'));
app.use('/api/entrenamientos', require('./routes/entrenamiento.routes'));

app.listen(3006, () => {
  console.log('Servidor corriendo en puerto 3006');
});