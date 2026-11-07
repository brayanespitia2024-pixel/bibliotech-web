/* =========================================================
   libros.routes.js  ·  Dueño: Mateo  ·  Rama: feature/api-libros
   Define QUÉ direcciones existen. La lógica está en el controlador.
   ========================================================= */
const { Router } = require("express");
const controlador = require("../controllers/libros.controller");

const router = Router();

router.get("/", controlador.listarLibros);                // GET    /api/libros
router.get("/:id", controlador.obtenerLibro);             // GET    /api/libros/5
router.post("/", controlador.crearLibro);                 // POST   /api/libros
router.put("/:id", controlador.actualizarLibro);          // PUT    /api/libros/5
router.delete("/:id", controlador.eliminarLibro);         // DELETE /api/libros/5
router.patch("/:id/prestar", controlador.prestarLibro);   // PATCH  /api/libros/5/prestar
router.patch("/:id/devolver", controlador.devolverLibro); // PATCH  /api/libros/5/devolver

module.exports = router;
