# 🏆 SmartCoach

Sistema de gestión deportiva para clubes formativos que permite registrar jugadores, partidos, entrenamientos y calcular automáticamente el índice de rendimiento de cada jugador.

---

## 👥 Integrantes

| Nombre | Rol |
|--------|-----|
| Alan Gómez | Backend |
| Luis Solano | Frontend |
| Alejandro Hilarión | Frontend |
| Felipe Fonseca | Base de datos |

**Ficha:** 3147272 — Centro de Biotecnología Agropecuaria  
**Instructora:** Steffi Velandia

---

## 📋 Descripción del proyecto

SmartCoach es una plataforma web fullstack diseñada para clubes deportivos de nivel formativo. Permite a administradores y entrenadores gestionar jugadores, registrar estadísticas de partidos y entrenamientos, y obtener clasificaciones automáticas de rendimiento (Alto, Medio, Bajo) basadas en datos reales.

### Funcionalidades principales
- Inicio de sesión con roles (Administrador / Entrenador)
- Gestión de jugadores, equipos y entrenadores
- Registro de partidos y estadísticas individuales por jugador
- Registro de asistencia a entrenamientos
- Cálculo automático de índice de rendimiento
- Clasificación automática: Alto, Medio o Bajo rendimiento

---

## 🛠️ Tecnologías utilizadas

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular, Bootstrap, TypeScript |
| Backend | Node.js, Express.js |
| Base de datos | MySQL |
| Editor | Visual Studio Code |
| Control de versiones | Git / GitHub |

---

## 📁 Estructura del repositorio

```
SmartCoach/
├── frontend/          # Aplicación Angular
│   ├── src/
│   └── ...
├── backend/           # API REST con Node.js y Express
│   ├── src/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── database/
│   └── smartcoach.sql # Script de creación de la base de datos
└── README.md
```

**Ramas:**
- `main` — versión estable
- `develop` — desarrollo de nuevas funcionalidades
- `feature/nombre-funcionalidad` — nuevas funcionalidades
- `fix/nombre-error` — corrección de errores

---

## ⚙️ Instalación y configuración

### Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [MySQL](https://www.mysql.com/) v8 o superior
- [Angular CLI](https://angular.io/cli) v15 o superior
- npm v9 o superior

Verificar instalaciones:
```bash
node -v
npm -v
ng version
```

### 1. Clonar el repositorio

```bash
git clone https://github.com/AMathiasGomez/SmartCoach.git
cd SmartCoach
```

### 2. Configurar la base de datos

1. Abrir MySQL Workbench o la consola de MySQL.
2. Ejecutar el script de creación:

```sql
source database/smartcoach.sql;
```

Esto creará la base de datos `smartcoach` con las tablas: `usuario`, `jugador`, `equipo`, `entrenamiento`, `partido`, `estadistica`, `asistencia` y `comentario`.

### 3. Configurar variables de entorno (Backend)

```bash
cd backend
cp .env.example .env
```

Editar el archivo `.env` con tus datos locales:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=smartcoach
JWT_SECRET=clave_secreta_segura
```

### 4. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 5. Instalar dependencias del frontend

```bash
cd frontend
npm install
```

---

## ▶️ Ejecución local

### Iniciar el backend

```bash
cd backend
node server.js
```

El servidor estará disponible en: `http://localhost:3000`

### Iniciar el frontend

```bash
cd frontend
ng serve
```

La aplicación estará disponible en: `http://localhost:4200`

> Asegúrate de tener el backend corriendo antes de iniciar el frontend.

---

## 🌐 API REST — Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/register` | Registrar usuario |
| GET | `/api/jugadores` | Listar jugadores |
| POST | `/api/jugadores` | Crear jugador |
| GET | `/api/partidos` | Listar partidos |
| POST | `/api/partidos` | Crear partido |
| POST | `/api/estadisticas` | Registrar estadísticas |
| GET | `/api/estadisticas/jugador/:id` | Estadísticas de un jugador |
| POST | `/api/asistencias` | Registrar asistencia |

---

## 🚀 Despliegue

El proyecto está diseñado para desplegarse con la siguiente configuración:

- **Frontend (Angular):** [Vercel](https://vercel.com)
- **Backend (Node.js + Express):** [Railway](https://railway.app)
- **Base de datos (MySQL):** Railway MySQL 

### Pasos básicos de despliegue en Render (backend)

1. Crear cuenta en [render.com](https://render.com)
2. Conectar el repositorio de GitHub
3. Seleccionar la carpeta `backend` como raíz
4. Agregar las variables de entorno desde el panel de Render
5. Deploy

---

## 🔒 Seguridad

- Las contraseñas se almacenan cifradas.
- El acceso está controlado por roles (Administrador / Entrenador).
- Las variables sensibles (credenciales de BD, JWT secret) se gestionan mediante `.env` y **nunca se suben al repositorio**.
- El archivo `.env.example` documenta las variables necesarias sin exponer valores reales.

---

## 📄 Licencia

Proyecto académico desarrollado para el SENA — Centro de Biotecnología Agropecuaria, Ficha 3147272.  
Todos los derechos reservados a los autores del equipo SmartCoach, 2026.