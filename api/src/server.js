/* =========================================================
   server.js  ·  Dueño: Mateo  ·  Rama: feature/api-libros
   Punto de entrada de la API. Crea el servidor Express,
   activa CORS y conecta las rutas de libros.
   ========================================================= */
require("dotenv").config();          // lee las variables del archivo .env
const express = require("express");
const cors = require("cors");
const librosRoutes = require("./routes/libros.routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());            // permite que el frontend (otro origen) consulte la API
app.use(express.json());    // permite recibir JSON en el cuerpo de las peticiones

// Ruta de prueba para saber si la API está viva
app.get("/api/salud", (req, res) => {
  res.json({ estado: "ok", mensaje: "API de BiblioTech funcionando" });
});

// Todas las rutas de libros empiezan por /api/libros
app.use("/api/libros", librosRoutes);

// Cualquier otra ruta responde 404
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.listen(PORT, () => {
  console.log(`API de BiblioTech en http://localhost:${PORT}/api/libros`);
});
