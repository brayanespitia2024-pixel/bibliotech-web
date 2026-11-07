/* =========================================================
   admin.js  ·  Dueño: Mateo  ·  Rama: feature/admin
   CRUD de libros contra la API:
     Crear  → POST   /api/libros
     Leer   → GET    /api/libros
     Editar → PUT    /api/libros/:id
     Borrar → DELETE /api/libros/:id
   ========================================================= */

let librosAdmin = [];
const formulario = document.querySelector("#form-libro");

// ---------- 1. Arranque y permisos ----------
async function iniciarAdmin() {
  if (!esBibliotecario()) {
    document.querySelector("#sin-permiso").hidden = false;
    document.querySelector("#origen-datos").hidden = true;
    return;
  }
  document.querySelector("#zona-admin").hidden = false;
  await recargar();
}

async function recargar() {
  librosAdmin = await obtenerLibros(); // de comun.js: API o respaldo
  pintarOrigen(document.querySelector("#origen-datos"));

  const sinApi = origenDatos !== "api";
  document.querySelector("#aviso-api").hidden = !sinApi;
  // Sin API no se puede guardar: desactivamos todo el formulario
  formulario.querySelectorAll("input, select, textarea, button").forEach(el => { el.disabled = sinApi; });

  llenarSugerenciasGenero();
  pintarTabla();
}

// ---------- 2. Tabla ----------
function pintarTabla() {
  const filtro = document.querySelector("#buscar-admin").value.toLowerCase();
  const lista = librosAdmin.filter(l => (l.titulo + l.autor + l.codigo).toLowerCase().includes(filtro));
  const sinApi = origenDatos !== "api";

  document.querySelector("#cuerpo-admin").innerHTML = lista.map(l => `
    <tr data-fila="${l.id}">
      <td><code>${l.codigo}</code></td>
      <td><span class="punto" style="background:${l.color}"></span><strong>${l.titulo}</strong><small>${l.autor} · ${l.anio}</small></td>
      <td>${l.genero}</td>
      <td>${l.disponibles}/${l.total}</td>
      <td>
        <div class="botones-fila">
          <button class="boton borde pequeno" type="button" data-editar="${l.id}" ${sinApi ? "disabled" : ""}>Editar</button>
          <button class="boton peligro pequeno" type="button" data-eliminar="${l.id}" ${sinApi ? "disabled" : ""}>Eliminar</button>
        </div>
      </td>
    </tr>`).join("");
}

function llenarSugerenciasGenero() {
  const generos = [...new Set(librosAdmin.map(l => l.genero))].sort();
  document.querySelector("#lista-generos").innerHTML = generos.map(g => `<option value="${g}">`).join("");
}

// ---------- 3. Formulario: crear o editar ----------
function cargarEnFormulario(libro) {
  ["titulo", "autor", "anio", "total", "genero", "ubicacion", "color", "sinopsis"].forEach(campo => {
    document.querySelector("#" + campo).value = libro[campo] ?? "";
  });
  document.querySelector("#libro-id").value = libro.id;
  document.querySelector("#titulo-formulario").textContent = `Editar «${libro.titulo}»`;
  document.querySelector("#boton-guardar").textContent = "Guardar cambios";
  document.querySelectorAll("tr.editando").forEach(f => f.classList.remove("editando"));
  document.querySelector(`tr[data-fila="${libro.id}"]`)?.classList.add("editando");
  document.querySelector("#titulo").focus();
}

function limpiarFormulario() {
  document.querySelector("#libro-id").value = "";
  document.querySelector("#titulo-formulario").textContent = "Agregar libro";
  document.querySelector("#boton-guardar").textContent = "Guardar libro";
  document.querySelector("#errores").innerHTML = "";
  document.querySelectorAll("tr.editando").forEach(f => f.classList.remove("editando"));
}

formulario.addEventListener("submit", async evento => {
  evento.preventDefault();
  const datos = Object.fromEntries(new FormData(formulario));
  const id = datos.id;
  delete datos.id;
  datos.anio = Number(datos.anio);
  datos.total = Number(datos.total);

  // Si hay id es edición (PUT); si no, es un libro nuevo (POST)
  const url = id ? `${URL_API}/${id}` : URL_API;
  const metodo = id ? "PUT" : "POST";

  try {
    const respuesta = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
    const cuerpo = await respuesta.json();

    if (!respuesta.ok) {
      // La API responde { error, detalles: [...] } cuando algo falla
      const lista = cuerpo.detalles || [cuerpo.error];
      document.querySelector("#errores").innerHTML = lista.map(e => `<li>${e}</li>`).join("");
      return;
    }
    mostrarAviso(id ? "Cambios guardados." : `Libro creado con código ${cuerpo.codigo}.`);
    formulario.reset();
    limpiarFormulario();
    await recargar();
  } catch (error) {
    mostrarAviso("No se pudo conectar con la API.");
  }
});

formulario.addEventListener("reset", limpiarFormulario);

// ---------- 4. Botones de la tabla ----------
// Eliminar pide confirmación con un segundo clic (sin ventanas emergentes)
document.querySelector("#cuerpo-admin").addEventListener("click", async evento => {
  const editar = evento.target.closest("button[data-editar]");
  const eliminar = evento.target.closest("button[data-eliminar]");

  if (editar) {
    cargarEnFormulario(librosAdmin.find(l => l.id === Number(editar.dataset.editar)));
  }

  if (eliminar) {
    if (eliminar.dataset.confirmar !== "si") {
      eliminar.dataset.confirmar = "si";
      eliminar.textContent = "¿Seguro?";
      setTimeout(() => { eliminar.dataset.confirmar = ""; eliminar.textContent = "Eliminar"; }, 3000);
      return;
    }
    const respuesta = await fetch(`${URL_API}/${eliminar.dataset.eliminar}`, { method: "DELETE" });
    if (respuesta.ok) {
      mostrarAviso("Libro eliminado.");
      await recargar();
    } else {
      const cuerpo = await respuesta.json();
      mostrarAviso(cuerpo.error);
    }
  }
});

document.querySelector("#buscar-admin").addEventListener("input", pintarTabla);

iniciarAdmin();
