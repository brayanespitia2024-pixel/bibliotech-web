/* =========================================================
   prestamos.js  ·  Dueña: Sofi  ·  Rama: feature/catalogo
   Lista los préstamos del usuario con su estado y permite
   renovar o devolver. Las reglas están en comun.js
   ========================================================= */

// 1. Mostrar u ocultar según haya sesión
function iniciarPrestamos() {
  const usuario = leerUsuario();
  document.querySelector("#sin-sesion").hidden = usuario !== null;
  document.querySelector("#con-sesion").hidden = usuario === null;
  if (!usuario) return;

  document.querySelector("#saludo").textContent =
    `${usuario.nombre} · código ${usuario.codigo}. Revisa tus fechas de devolución, renueva o devuelve tus libros.`;
  mostrarPrestamos();
}

// 2. Tarjetas de resumen
function mostrarResumen(prestamos) {
  const estados = prestamos.map(estadoPrestamo);
  document.querySelector("#total-activos").textContent = prestamos.length;
  document.querySelector("#total-por-vencer").textContent = estados.filter(e => e.clase === "alerta").length;
  document.querySelector("#total-vencidos").textContent = estados.filter(e => e.clase === "vencido").length;
}

// 3. Filas de la tabla, ordenadas por la fecha de devolución más cercana
function mostrarPrestamos() {
  const prestamos = leerPrestamos().sort((a, b) => a.devolucion.localeCompare(b.devolucion));
  mostrarResumen(prestamos);

  const cuerpo = document.querySelector("#cuerpo-prestamos");
  document.querySelector("#sin-prestamos").hidden = prestamos.length > 0;
  cuerpo.closest("table").hidden = prestamos.length === 0;

  cuerpo.innerHTML = prestamos.map(p => {
    const estado = estadoPrestamo(p);
    const puedeRenovar = !p.renovado && estado.clase !== "vencido";
    return `
      <tr>
        <td>
          <div class="libro-celda">
            <span class="mini-portada" style="background:${p.color}"></span>
            <span><strong>${p.titulo}</strong><small>${p.autor}</small></span>
          </div>
        </td>
        <td>${formatearFecha(p.fecha)}</td>
        <td>${formatearFecha(p.devolucion)}${p.renovado ? " <small class='gris'>(renovado)</small>" : ""}</td>
        <td><span class="estado ${estado.clase}">${estado.texto}</span></td>
        <td>
          <div class="botones-fila">
            <button class="boton borde pequeno" type="button" data-renovar="${p.id}" ${puedeRenovar ? "" : "disabled"}>Renovar</button>
            <button class="boton pequeno" type="button" data-devolver="${p.id}">Devolver</button>
          </div>
        </td>
      </tr>`;
  }).join("");
}

// 4. Botones de cada fila (delegación de eventos)
document.querySelector("#cuerpo-prestamos").addEventListener("click", evento => {
  const renovar = evento.target.closest("button[data-renovar]");
  const devolver = evento.target.closest("button[data-devolver]");

  if (renovar) {
    const resultado = renovarPrestamo(Number(renovar.dataset.renovar));
    mostrarAviso(resultado.mensaje);
  }
  if (devolver) {
    devolverPrestamo(Number(devolver.dataset.devolver));
    mostrarAviso("Libro devuelto. ¡Gracias!");
  }
  mostrarPrestamos();
});

iniciarPrestamos();
