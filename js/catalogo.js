/* =========================================================
   catalogo.js  ·  Dueña: Sofi  ·  Rama: feature/catalogo
   1. Carga los libros con obtenerLibros() (API o respaldo).
   2. Llena los filtros y lee la búsqueda que viene de la portada.
   3. Filtra, ordena y pinta las tarjetas.
   4. Solicita préstamos con crearPrestamo() de comun.js
   ========================================================= */

let libros = []; // aquí quedan los libros cargados

// ---------- 1. Cargar ----------
async function iniciarCatalogo() {
  libros = await obtenerLibros();
  pintarOrigen(document.querySelector("#origen-datos"));
  llenarGeneros();
  leerFiltrosIniciales();
  mostrarLibros();
}

// ---------- 2. Filtros ----------
function llenarGeneros() {
  const select = document.querySelector("#filtro-genero");
  const generos = [...new Set(libros.map(libro => libro.genero))].sort();
  generos.forEach(genero => select.add(new Option(genero, genero)));
}

// Si el usuario llegó desde la portada (buscador o botón de género)
function leerFiltrosIniciales() {
  const parametros = new URLSearchParams(window.location.search);
  let texto = parametros.get("q");
  let genero = parametros.get("genero");
  try {
    texto = texto || sessionStorage.getItem("bibliotech_busqueda");
    genero = genero || sessionStorage.getItem("bibliotech_genero");
    sessionStorage.removeItem("bibliotech_busqueda");
    sessionStorage.removeItem("bibliotech_genero");
  } catch (e) {}
  if (texto) document.querySelector("#filtro-texto").value = texto;
  if (genero) document.querySelector("#filtro-genero").value = genero;
}

// Quita tildes y mayúsculas para comparar: "García" === "garcia"
function normalizar(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function filtrarLibros() {
  const texto = normalizar(document.querySelector("#filtro-texto").value);
  const genero = document.querySelector("#filtro-genero").value;
  const soloDisponibles = document.querySelector("#filtro-disponibles").checked;

  return libros.filter(libro => {
    const coincideTexto = normalizar(libro.titulo + " " + libro.autor).includes(texto);
    const coincideGenero = genero === "" || libro.genero === genero;
    const coincideStock = !soloDisponibles || disponiblesReales(libro) > 0;
    return coincideTexto && coincideGenero && coincideStock;
  });
}

function ordenarLibros(lista) {
  const orden = document.querySelector("#filtro-orden").value;
  const copia = [...lista];
  if (orden === "titulo") copia.sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));
  if (orden === "recientes") copia.sort((a, b) => b.anio - a.anio);
  if (orden === "disponibles") copia.sort((a, b) => disponiblesReales(b) - disponiblesReales(a));
  return copia;
}

// ---------- 3. Pintar tarjetas ----------
function textoBoton(libro) {
  if (tienePrestado(libro.id)) return "Ya lo tienes";
  if (disponiblesReales(libro) <= 0) return "Agotado";
  return "Solicitar préstamo";
}

function mostrarLibros() {
  const lista = ordenarLibros(filtrarLibros());
  const rejilla = document.querySelector("#rejilla");
  document.querySelector("#resumen").textContent = `${lista.length} de ${libros.length} libros`;

  if (lista.length === 0) {
    rejilla.innerHTML = `<p class="vacio">No encontramos libros con esos filtros. Pulsa «Limpiar» para ver todos.</p>`;
    return;
  }

  rejilla.innerHTML = lista.map(libro => {
    const quedan = disponiblesReales(libro);
    const bloqueado = tienePrestado(libro.id) || quedan <= 0;
    return `
      <article class="tarjeta">
        <div class="portada" style="background:${libro.color}" data-ver="${libro.id}">
          <strong>${libro.titulo}</strong>
          <small>${libro.anio}</small>
        </div>
        <h3><a href="libro.html?id=${libro.id}" data-ver="${libro.id}">${libro.titulo}</a></h3>
        <p class="autor">${libro.autor}</p>
        <div class="datos-libro">
          <span class="chip">${libro.genero}</span>
          <span class="stock ${quedan <= 0 ? "agotado" : ""}">${quedan} de ${libro.total} disp.</span>
        </div>
        <button class="boton secundario" type="button" data-prestar="${libro.id}" ${bloqueado ? "disabled" : ""}>${textoBoton(libro)}</button>
      </article>`;
  }).join("");
}

// ---------- 4. Préstamo ----------
function solicitar(idLibro) {
  const libro = libros.find(l => l.id === idLibro);
  const resultado = crearPrestamo(libro); // aplica las reglas de comun.js
  mostrarAviso(resultado.mensaje);
  if (resultado.login) {
    setTimeout(() => { window.location.href = "login.html"; }, 1200);
  }
  mostrarLibros();
}

// ---------- 5. Eventos ----------
// Un solo "escuchador" en la rejilla atiende todos los clics (delegación)
document.querySelector("#rejilla").addEventListener("click", evento => {
  const ver = evento.target.closest("[data-ver]");
  const prestar = evento.target.closest("button[data-prestar]");
  if (ver) {
    evento.preventDefault();
    irALibro(Number(ver.dataset.ver));
  }
  if (prestar) solicitar(Number(prestar.dataset.prestar));
});

const filtros = document.querySelector("#filtros");
filtros.addEventListener("input", mostrarLibros);
filtros.addEventListener("submit", evento => evento.preventDefault());
// "reset" limpia los campos; esperamos un instante para volver a pintar
filtros.addEventListener("reset", () => setTimeout(mostrarLibros, 0));

iniciarCatalogo();
