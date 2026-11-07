/* =========================================================
   comun.js  ·  Dueña: Ana (líder)  ·  Rama: develop (fase 0)
   Funciones que usan TODAS las páginas. Se carga después de
   datos.js y antes del script propio de cada página.
     1. Configuración
     2. Guardar y leer datos en el navegador
     3. Usuario (sesión)
     4. Fechas
     5. Préstamos (reglas de la biblioteca)
     6. Libros (API o respaldo)
     7. Encabezado y avisos
   ========================================================= */

// ---------- 1. Configuración ----------
const URL_API = "http://localhost:3000/api/libros";
const CLAVE_PRESTAMOS = "bibliotech_prestamos";
const CLAVE_USUARIO = "bibliotech_usuario";
const DIAS_PRESTAMO = 14;     // un préstamo dura 14 días
const DIAS_RENOVACION = 7;    // renovar suma 7 días (solo una vez)
const MAX_PRESTAMOS = 3;      // máximo de libros a la vez por usuario

// ---------- 2. Guardar y leer datos en el navegador ----------
// localStorage guarda texto; JSON convierte objetos <-> texto.
function leerDato(clave, valorPorDefecto) {
  try {
    const texto = localStorage.getItem(clave);
    return texto ? JSON.parse(texto) : valorPorDefecto;
  } catch (error) {
    return valorPorDefecto; // navegador sin almacenamiento: seguimos sin fallar
  }
}

function guardarDato(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch (error) {
    console.warn("No se pudo guardar en el navegador", error);
  }
}

// ---------- 3. Usuario (sesión) ----------
// OJO: es una sesión de práctica guardada en el navegador.
// En un sistema real el inicio de sesión lo valida el servidor.
function leerUsuario() {
  return leerDato(CLAVE_USUARIO, null);
}

function iniciarSesion(usuario) {
  guardarDato(CLAVE_USUARIO, usuario);
}

function cerrarSesion() {
  try { localStorage.removeItem(CLAVE_USUARIO); } catch (e) {}
  window.location.href = "index.html";
}

function esBibliotecario() {
  const usuario = leerUsuario();
  return usuario !== null && usuario.rol === "bibliotecario";
}

// ---------- 4. Fechas ----------
// Las fechas se guardan como texto "AAAA-MM-DD" para compararlas fácil.
// Convierte un objeto Date a "AAAA-MM-DD" usando la hora local
function aISO(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function hoyISO() {
  return aISO(new Date());
}

function sumarDias(fechaISO, dias) {
  const fecha = new Date(fechaISO + "T12:00:00"); // mediodía evita saltos por zona horaria
  fecha.setDate(fecha.getDate() + dias);
  return aISO(fecha);
}

function diasHasta(fechaISO) {
  const unDia = 24 * 60 * 60 * 1000;
  const hoy = new Date(hoyISO() + "T12:00:00");
  const fecha = new Date(fechaISO + "T12:00:00");
  return Math.round((fecha - hoy) / unDia);
}

function formatearFecha(fechaISO) {
  return new Date(fechaISO + "T12:00:00").toLocaleDateString("es-CO", {
    day: "numeric", month: "short", year: "numeric"
  });
}

// ---------- 5. Préstamos (reglas de la biblioteca) ----------
function leerPrestamos() {
  return leerDato(CLAVE_PRESTAMOS, []);
}

function guardarPrestamos(lista) {
  guardarDato(CLAVE_PRESTAMOS, lista);
  pintarEncabezado();
}

function tienePrestado(idLibro) {
  return leerPrestamos().some(prestamo => prestamo.id === idLibro);
}

// Ejemplares que quedan, descontando el que tiene el usuario
function disponiblesReales(libro) {
  return libro.disponibles - (tienePrestado(libro.id) ? 1 : 0);
}

// Aplica las reglas y, si todo está bien, registra el préstamo.
// Devuelve { ok: true/false, mensaje: "..." }
function crearPrestamo(libro) {
  const usuario = leerUsuario();
  const prestamos = leerPrestamos();

  if (!usuario) return { ok: false, mensaje: "Debes ingresar para pedir libros.", login: true };
  if (tienePrestado(libro.id)) return { ok: false, mensaje: "Ya tienes este libro." };
  if (disponiblesReales(libro) <= 0) return { ok: false, mensaje: "No quedan ejemplares disponibles." };
  if (prestamos.length >= MAX_PRESTAMOS) return { ok: false, mensaje: `Solo puedes tener ${MAX_PRESTAMOS} libros a la vez.` };
  const vencidos = prestamos.filter(p => diasHasta(p.devolucion) < 0);
  if (vencidos.length > 0) return { ok: false, mensaje: "Tienes préstamos vencidos. Devuélvelos primero." };

  prestamos.push({
    id: libro.id,
    titulo: libro.titulo,
    autor: libro.autor,
    color: libro.color,
    fecha: hoyISO(),
    devolucion: sumarDias(hoyISO(), DIAS_PRESTAMO),
    renovado: false
  });
  guardarPrestamos(prestamos);
  avisarApi(libro.id, "prestar");
  return { ok: true, mensaje: `Préstamo registrado. Devuélvelo antes del ${formatearFecha(sumarDias(hoyISO(), DIAS_PRESTAMO))}.` };
}

function devolverPrestamo(idLibro) {
  guardarPrestamos(leerPrestamos().filter(p => p.id !== idLibro));
  avisarApi(idLibro, "devolver");
}

function renovarPrestamo(idLibro) {
  const prestamos = leerPrestamos();
  const prestamo = prestamos.find(p => p.id === idLibro);
  if (!prestamo) return { ok: false, mensaje: "No encontramos ese préstamo." };
  if (prestamo.renovado) return { ok: false, mensaje: "Este préstamo ya se renovó una vez." };
  if (diasHasta(prestamo.devolucion) < 0) return { ok: false, mensaje: "Un préstamo vencido no se puede renovar." };
  prestamo.devolucion = sumarDias(prestamo.devolucion, DIAS_RENOVACION);
  prestamo.renovado = true;
  guardarPrestamos(prestamos);
  return { ok: true, mensaje: `Renovado hasta el ${formatearFecha(prestamo.devolucion)}.` };
}

// Estado para mostrar: al día, vence pronto (3 días o menos) o vencido
function estadoPrestamo(prestamo) {
  const dias = diasHasta(prestamo.devolucion);
  if (dias < 0) return { clase: "vencido", texto: `Vencido hace ${-dias} día(s)`, dias };
  if (dias <= 3) return { clase: "alerta", texto: dias === 0 ? "Vence hoy" : `Vence en ${dias} día(s)`, dias };
  return { clase: "ok", texto: `Al día · faltan ${dias} días`, dias };
}

// ---------- 6. Libros (API o respaldo) ----------
let origenDatos = "respaldo";

// Pide los libros a la API. Si no responde en 2 s, usa LIBROS_RESPALDO.
async function obtenerLibros() {
  try {
    const control = new AbortController();
    const temporizador = setTimeout(() => control.abort(), 2000);
    const respuesta = await fetch(URL_API, { signal: control.signal });
    clearTimeout(temporizador);
    if (!respuesta.ok) throw new Error("Error " + respuesta.status);
    origenDatos = "api";
    return await respuesta.json();
  } catch (error) {
    origenDatos = "respaldo";
    return LIBROS_RESPALDO;
  }
}

// Avisa a la API que un libro se prestó o devolvió (si está encendida)
function avisarApi(idLibro, accion) {
  if (origenDatos !== "api") return;
  fetch(`${URL_API}/${idLibro}/${accion}`, { method: "PATCH" }).catch(() => {});
}

// Muestra en una etiqueta de dónde vienen los datos
function pintarOrigen(elemento) {
  if (!elemento) return;
  elemento.textContent = origenDatos === "api" ? "Datos: API en localhost:3000" : "Datos: respaldo local (API apagada)";
  elemento.className = "estado " + (origenDatos === "api" ? "ok" : "alerta");
}

// Abre la página de detalle de un libro
function irALibro(idLibro) {
  try { sessionStorage.setItem("bibliotech_libro", idLibro); } catch (e) {}
  window.location.href = "libro.html?id=" + idLibro;
}

// ---------- 7. Encabezado y avisos ----------
function pintarEncabezado() {
  // Contador de préstamos
  const contador = document.querySelector("#contador-prestamos");
  if (contador) contador.textContent = leerPrestamos().length;

  // Enlace activo según <body data-pagina="...">
  const pagina = document.body.dataset.pagina;
  document.querySelectorAll(".menu a").forEach(enlace => {
    enlace.classList.toggle("activo", enlace.dataset.pagina === pagina);
  });

  // Enlace "Administrar" solo para bibliotecarios
  document.querySelectorAll(".solo-bibliotecario").forEach(el => { el.hidden = !esBibliotecario(); });

  // Zona de usuario
  const zona = document.querySelector("#zona-usuario");
  if (!zona) return;
  const usuario = leerUsuario();
  if (usuario) {
    zona.innerHTML = `<span>Hola, <strong>${usuario.nombre.split(" ")[0]}</strong></span>
                      <button type="button" id="boton-salir">Salir</button>`;
    document.querySelector("#boton-salir").addEventListener("click", cerrarSesion);
  } else {
    zona.innerHTML = `<a class="boton pequeno" href="login.html">Ingresar</a>`;
  }
}

function mostrarAviso(texto) {
  let aviso = document.querySelector(".aviso");
  if (!aviso) {
    aviso = document.createElement("div");
    aviso.className = "aviso";
    aviso.setAttribute("role", "status");
    document.body.appendChild(aviso);
  }
  aviso.textContent = texto;
  aviso.classList.add("visible");
  clearTimeout(aviso.temporizador);
  aviso.temporizador = setTimeout(() => aviso.classList.remove("visible"), 3000);
}

document.addEventListener("DOMContentLoaded", pintarEncabezado);
