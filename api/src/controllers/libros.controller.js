/* =========================================================
   libros.controller.js  ·  Dueño: Mateo  ·  Rama: feature/api-libros
   Lógica de cada ruta. Los libros se guardan en data/libros.json,
   así los cambios del panel de administración no se pierden
   al apagar el servidor.
   ========================================================= */
const fs = require("fs");
const path = require("path");

const ARCHIVO = path.join(__dirname, "..", "data", "libros.json");

// ---------- Utilidades para leer y guardar el archivo ----------
function leerLibros() {
  return JSON.parse(fs.readFileSync(ARCHIVO, "utf8"));
}

function guardarLibros(libros) {
  fs.writeFileSync(ARCHIVO, JSON.stringify(libros, null, 2) + "\n");
}

function buscarPorId(libros, id) {
  return libros.find(libro => libro.id === Number(id));
}

// Revisa los datos que llegan del formulario. Devuelve la lista de errores.
function validarLibro(datos) {
  const errores = [];
  const anioActual = new Date().getFullYear();
  if (!datos.titulo || datos.titulo.trim().length < 2) errores.push("El título es obligatorio.");
  if (!datos.autor || datos.autor.trim().length < 3) errores.push("El autor es obligatorio.");
  if (!datos.genero) errores.push("El género es obligatorio.");
  if (!Number.isInteger(Number(datos.anio)) || datos.anio < 1000 || datos.anio > anioActual) {
    errores.push(`El año debe ser un número entre 1000 y ${anioActual}.`);
  }
  if (!Number.isInteger(Number(datos.total)) || datos.total < 1) errores.push("Debe haber al menos 1 ejemplar.");
  return errores;
}

// Deja solo los campos permitidos y con el tipo correcto
function limpiarDatos(datos) {
  return {
    titulo: String(datos.titulo).trim(),
    autor: String(datos.autor).trim(),
    genero: String(datos.genero).trim(),
    anio: Number(datos.anio),
    total: Number(datos.total),
    ubicacion: String(datos.ubicacion || "Por asignar").trim(),
    color: /^#[0-9A-Fa-f]{6}$/.test(datos.color) ? datos.color : "#1E5B4F",
    sinopsis: String(datos.sinopsis || "").trim()
  };
}

// ---------- GET /api/libros?genero=Novela&q=garcia ----------
function listarLibros(req, res) {
  const { genero, q } = req.query;
  let resultado = leerLibros();

  if (genero) resultado = resultado.filter(libro => libro.genero === genero);
  if (q) {
    const texto = q.toLowerCase();
    resultado = resultado.filter(libro => (libro.titulo + " " + libro.autor).toLowerCase().includes(texto));
  }
  res.json(resultado);
}

// ---------- GET /api/libros/:id ----------
function obtenerLibro(req, res) {
  const libro = buscarPorId(leerLibros(), req.params.id);
  if (!libro) return res.status(404).json({ error: "Libro no encontrado" });
  res.json(libro);
}

// ---------- POST /api/libros ----------
function crearLibro(req, res) {
  const errores = validarLibro(req.body);
  if (errores.length > 0) return res.status(400).json({ error: "Datos inválidos", detalles: errores });

  const libros = leerLibros();
  const nuevoId = libros.length ? Math.max(...libros.map(l => l.id)) + 1 : 1;
  const datos = limpiarDatos(req.body);
  const libro = {
    id: nuevoId,
    codigo: "BT-" + String(nuevoId).padStart(3, "0"),
    ...datos,
    disponibles: datos.total // un libro nuevo tiene todos sus ejemplares libres
  };
  libros.push(libro);
  guardarLibros(libros);
  res.status(201).json(libro); // 201 = creado
}

// ---------- PUT /api/libros/:id ----------
function actualizarLibro(req, res) {
  const libros = leerLibros();
  const libro = buscarPorId(libros, req.params.id);
  if (!libro) return res.status(404).json({ error: "Libro no encontrado" });

  const errores = validarLibro(req.body);
  if (errores.length > 0) return res.status(400).json({ error: "Datos inválidos", detalles: errores });

  const datos = limpiarDatos(req.body);
  const prestados = libro.total - libro.disponibles;
  if (datos.total < prestados) {
    return res.status(409).json({ error: `Hay ${prestados} ejemplares prestados; el total no puede ser menor.` });
  }
  Object.assign(libro, datos, { disponibles: datos.total - prestados });
  guardarLibros(libros);
  res.json(libro);
}

// ---------- DELETE /api/libros/:id ----------
function eliminarLibro(req, res) {
  const libros = leerLibros();
  const libro = buscarPorId(libros, req.params.id);
  if (!libro) return res.status(404).json({ error: "Libro no encontrado" });
  if (libro.disponibles < libro.total) {
    return res.status(409).json({ error: "No se puede eliminar: tiene ejemplares prestados." });
  }
  guardarLibros(libros.filter(l => l.id !== libro.id));
  res.status(204).end(); // 204 = hecho, sin contenido
}

// ---------- PATCH /api/libros/:id/prestar ----------
function prestarLibro(req, res) {
  const libros = leerLibros();
  const libro = buscarPorId(libros, req.params.id);
  if (!libro) return res.status(404).json({ error: "Libro no encontrado" });
  if (libro.disponibles === 0) return res.status(409).json({ error: "No quedan ejemplares disponibles" });
  libro.disponibles -= 1;
  guardarLibros(libros);
  res.json(libro);
}

// ---------- PATCH /api/libros/:id/devolver ----------
function devolverLibro(req, res) {
  const libros = leerLibros();
  const libro = buscarPorId(libros, req.params.id);
  if (!libro) return res.status(404).json({ error: "Libro no encontrado" });
  if (libro.disponibles >= libro.total) return res.status(409).json({ error: "Todos los ejemplares ya están en la biblioteca" });
  libro.disponibles += 1;
  guardarLibros(libros);
  res.json(libro);
}

module.exports = {
  listarLibros, obtenerLibro, crearLibro, actualizarLibro,
  eliminarLibro, prestarLibro, devolverLibro
};
