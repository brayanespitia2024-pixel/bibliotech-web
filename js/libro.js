/* =========================================================
   libro.js  ·  Dueña: Sofi  ·  Rama: feature/catalogo
   Muestra el detalle de UN libro. El id llega en la dirección
   (libro.html?id=3) o en sessionStorage (lo guarda irALibro).
   ========================================================= */

let libroActual = null;

// 1. ¿Qué libro hay que mostrar?
function leerIdLibro() {
  const desdeUrl = new URLSearchParams(window.location.search).get("id");
  if (desdeUrl) return Number(desdeUrl);
  try { return Number(sessionStorage.getItem("bibliotech_libro")); } catch (e) { return 0; }
}

// 2. Llenar la ficha
function mostrarDetalle(libro) {
  document.title = `BiblioTech · ${libro.titulo}`;
  const poner = (id, texto) => { document.querySelector(id).textContent = texto; };

  poner("#miga-titulo", libro.titulo);
  poner("#portada-titulo", libro.titulo);
  poner("#portada-autor", libro.autor);
  poner("#detalle-genero", libro.genero);
  poner("#detalle-titulo", libro.titulo);
  poner("#detalle-autor", libro.autor);
  poner("#detalle-sinopsis", libro.sinopsis || "Sin sinopsis registrada.");
  poner("#detalle-codigo", libro.codigo);
  poner("#detalle-anio", libro.anio);
  poner("#detalle-ubicacion", libro.ubicacion);
  poner("#detalle-ejemplares", `${disponiblesReales(libro)} de ${libro.total} disponibles`);
  document.querySelector("#detalle-portada").style.background = libro.color;

  actualizarBoton();
}

// 3. El botón cambia según las reglas de préstamo
function actualizarBoton() {
  const boton = document.querySelector("#boton-prestar");
  const mensaje = document.querySelector("#detalle-mensaje");
  const prestamo = leerPrestamos().find(p => p.id === libroActual.id);

  if (prestamo) {
    boton.disabled = true;
    boton.textContent = "Ya lo tienes";
    mensaje.textContent = `Debes devolverlo antes del ${formatearFecha(prestamo.devolucion)}.`;
  } else if (disponiblesReales(libroActual) <= 0) {
    boton.disabled = true;
    boton.textContent = "Agotado";
    mensaje.textContent = "Todos los ejemplares están prestados. Vuelve a consultar en unos días.";
  } else {
    boton.disabled = false;
    boton.textContent = "Solicitar préstamo";
    mensaje.textContent = leerUsuario() ? "" : "Debes ingresar para pedir este libro.";
  }
}

// 4. Libros del mismo género (máximo 4)
function mostrarRelacionados(libros) {
  const relacionados = libros
    .filter(l => l.genero === libroActual.genero && l.id !== libroActual.id)
    .slice(0, 4);
  const contenedor = document.querySelector("#relacionados");

  if (relacionados.length === 0) {
    contenedor.innerHTML = `<p class="gris">No hay más libros de ${libroActual.genero}.</p>`;
    return;
  }
  contenedor.innerHTML = relacionados.map(l => `
    <article class="tarjeta">
      <div class="portada" style="background:${l.color}" data-ver="${l.id}">
        <strong>${l.titulo}</strong><small>${l.autor}</small>
      </div>
    </article>`).join("");
}

// 5. Arranque
async function iniciarDetalle() {
  const libros = await obtenerLibros();
  libroActual = libros.find(l => l.id === leerIdLibro());

  if (!libroActual) {
    document.querySelector("#detalle").innerHTML =
      `<div class="panel"><h1>Libro no encontrado</h1><p>Vuelve al <a href="catalogo.html">catálogo</a> y elige otro.</p></div>`;
    return;
  }
  mostrarDetalle(libroActual);
  mostrarRelacionados(libros);
}

// 6. Eventos
document.querySelector("#boton-prestar").addEventListener("click", () => {
  const resultado = crearPrestamo(libroActual);
  mostrarAviso(resultado.mensaje);
  if (resultado.login) setTimeout(() => { window.location.href = "login.html"; }, 1200);
  mostrarDetalle(libroActual);
});

document.querySelector("#relacionados").addEventListener("click", evento => {
  const tarjeta = evento.target.closest("[data-ver]");
  if (tarjeta) irALibro(Number(tarjeta.dataset.ver));
});

iniciarDetalle();
