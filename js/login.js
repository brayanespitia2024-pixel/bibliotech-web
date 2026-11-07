/* =========================================================
   login.js  ·  Dueño: Leo  ·  Rama: feature/home
   Valida el formulario de ingreso y guarda la sesión.
   Usa iniciarSesion() y leerUsuario() de comun.js
   ========================================================= */

const formulario = document.querySelector("#form-ingreso");

// Si ya hay sesión, no tiene sentido ingresar otra vez
const usuarioActual = leerUsuario();
if (usuarioActual) {
  mostrarAviso(`Ya ingresaste como ${usuarioActual.nombre}.`);
}

// Muestra u oculta el mensaje de error de un campo
function marcarError(idCampo, mensaje) {
  const campo = document.querySelector("#" + idCampo).closest(".campo");
  campo.classList.toggle("con-error", mensaje !== "");
  document.querySelector("#error-" + idCampo).textContent = mensaje;
  return mensaje === ""; // true si el campo está bien
}

// Reglas de validación de cada campo
function validar(datos) {
  const nombreOk = marcarError("nombre",
    datos.nombre.length < 3 ? "Escribe tu nombre completo (mínimo 3 letras)." : "");

  const codigoOk = marcarError("codigo",
    /^\d{8}$/.test(datos.codigo) ? "" : "El código debe tener exactamente 8 números.");

  const correoOk = marcarError("correo",
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo) ? "" : "Escribe un correo válido, por ejemplo ana@colegio.edu.co.");

  return nombreOk && codigoOk && correoOk;
}

formulario.addEventListener("submit", evento => {
  evento.preventDefault();

  // FormData lee todos los campos del formulario por su atributo name
  const datos = Object.fromEntries(new FormData(formulario));
  datos.nombre = datos.nombre.trim();
  datos.codigo = datos.codigo.trim();
  datos.correo = datos.correo.trim().toLowerCase();

  if (!validar(datos)) {
    mostrarAviso("Revisa los campos marcados en rojo.");
    return;
  }

  iniciarSesion(datos);
  mostrarAviso(`Bienvenido, ${datos.nombre.split(" ")[0]}.`);

  // Después de 1 segundo, el bibliotecario va a Administrar y los demás al catálogo
  setTimeout(() => {
    window.location.href = datos.rol === "bibliotecario" ? "admin.html" : "catalogo.html";
  }, 1000);
});
