/* =========================================================
   home.js  ·  Dueño: Leo  ·  Rama: feature/home
   Lógica de la portada: cifras, géneros, novedades y buscador.
   Usa obtenerLibros() e irALibro() de comun.js
   ========================================================= */

// 1. Cifras de la parte superior
function mostrarCifras(libros) {
  // reduce recorre la lista y va acumulando una suma
  const ejemplares = libros.reduce((suma, libro) => suma + libro.total, 0);
  const disponibles = libros.reduce((suma, libro) => suma + libro.disponibles, 0);

  document.querySelector("#total-libros").textContent = libros.length;
  document.querySelector("#total-ejemplares").textContent = ejemplares;
  document.querySelector("#total-disponibles").textContent = disponibles;
}

// 2. Un botón por género, con la cantidad de títulos
function mostrarGeneros(libros) {
  const conteo = {}; // ejemplo: { Novela: 4, Cuento: 2, ... }
  libros.forEach(libro => {
    conteo[libro.genero] = (conteo[libro.genero] || 0) + 1;
  });

  const contenedor = document.querySelector("#generos");
  contenedor.innerHTML = Object.entries(conteo)
    .map(([genero, cantidad]) => `<button type="button" data-genero="${genero}">${genero}<small>${cantidad}</small></button>`)
    .join("");

  // Al hacer clic se abre el catálogo filtrado por ese género
  contenedor.addEventListener("click", evento => {
    const boton = evento.target.closest("button[data-genero]");
    if (!boton) return;
    try { sessionStorage.setItem("bibliotech_genero", boton.dataset.genero); } catch (e) {}
    window.location.href = "catalogo.html?genero=" + encodeURIComponent(boton.dataset.genero);
  });
}

// 3. Las 6 novedades = los 6 libros más recientes
function mostrarNovedades(libros) {
  const recientes = [...libros].sort((a, b) => b.anio - a.anio).slice(0, 6);
  const contenedor = document.querySelector("#novedades");

  contenedor.innerHTML = recientes.map(libro => `
    <article class="novedad" data-id="${libro.id}" tabindex="0" aria-label="Ver ${libro.titulo}">
      <div class="portada" style="background:${libro.color}">
        <strong>${libro.titulo}</strong>
        <small>${libro.autor}</small>
      </div>
      <p>${libro.titulo}</p>
      <small>${libro.genero} · ${libro.anio}</small>
    </article>
  `).join("");

  // Clic o tecla Enter abre el detalle del libro
  const abrir = evento => {
    const tarjeta = evento.target.closest(".novedad");
    if (tarjeta) irALibro(Number(tarjeta.dataset.id));
  };
  contenedor.addEventListener("click", abrir);
  contenedor.addEventListener("keydown", evento => { if (evento.key === "Enter") abrir(evento); });
}

// 4. Buscador: guarda el texto y abre el catálogo
document.querySelector("#form-buscar").addEventListener("submit", evento => {
  evento.preventDefault(); // evita que el formulario recargue la página
  const texto = document.querySelector("#texto-buscar").value.trim();
  try { sessionStorage.setItem("bibliotech_busqueda", texto); } catch (e) {}
  window.location.href = "catalogo.html?q=" + encodeURIComponent(texto);
});

// 5. Arranque: primero se piden los libros y luego se pinta todo
async function iniciarPortada() {
  const libros = await obtenerLibros();
  mostrarCifras(libros);
  mostrarGeneros(libros);
  mostrarNovedades(libros);
}

iniciarPortada();
