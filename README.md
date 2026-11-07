# BiblioTech

Sitio web de préstamo de libros para una biblioteca escolar. Proyecto de aula para practicar control de versiones con Git y GitHub trabajando por ramas.

## Páginas

| Página | Para qué sirve |
|---|---|
| `index.html` | Portada: buscador, cifras, géneros y novedades |
| `acerca.html` | Horario, ubicación, reglamento y preguntas frecuentes |
| `login.html` | Ingreso del usuario (estudiante, docente o bibliotecario) |
| `catalogo.html` | Catálogo con filtros, orden y botón de préstamo |
| `libro.html` | Detalle de un libro y libros relacionados |
| `prestamos.html` | Mis préstamos: fechas, estado, renovar y devolver |
| `admin.html` | Panel del bibliotecario: agregar, editar y eliminar libros |

## Equipo, ramas y archivos

| Integrante | Rol | Rama | Archivos |
|---|---|---|---|
| Ana | Líder · integración | `develop` | `README.md`, `.gitignore`, `css/base.css`, `js/datos.js`, `js/comun.js` |
| Leo | Frontend · portada e ingreso | `feature/home` | `index.html`, `acerca.html`, `login.html`, `css/home.css`, `css/login.css`, `js/home.js`, `js/login.js` |
| Sofi | Frontend · catálogo y préstamos | `feature/catalogo` | `catalogo.html`, `libro.html`, `prestamos.html`, `css/catalogo.css`, `css/prestamos.css`, `js/catalogo.js`, `js/libro.js`, `js/prestamos.js` |
| Mateo | Backend · API | `feature/api-libros` | todo lo que está en `api/` |
| Mateo | Frontend · administración | `feature/admin` | `admin.html`, `css/admin.css`, `js/admin.js` |

## Reglas de préstamo (en `js/comun.js`)

- Máximo 3 libros a la vez.
- 14 días por préstamo y una renovación de 7 días.
- Con un préstamo vencido no se puede pedir otro.

## Cómo ver el sitio

Abre `index.html` con la extensión **Live Server** de VS Code.
Si la API no está encendida, las páginas usan los datos de respaldo de `js/datos.js` y el panel de administración queda en solo lectura.

## Cómo encender la API

```bash
cd api
npm install
cp .env.example .env     # en PowerShell: Copy-Item .env.example .env
npm run dev
```

Prueba en el navegador: <http://localhost:3000/api/libros>

## Rutas de la API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/salud` | Comprueba que la API está encendida |
| GET | `/api/libros` | Lista de libros. Filtros opcionales: `?genero=Novela&q=garcia` |
| GET | `/api/libros/:id` | Un libro por su id |
| POST | `/api/libros` | Crea un libro (JSON en el cuerpo) |
| PUT | `/api/libros/:id` | Actualiza un libro |
| DELETE | `/api/libros/:id` | Elimina un libro sin ejemplares prestados |
| PATCH | `/api/libros/:id/prestar` | Resta un ejemplar disponible |
| PATCH | `/api/libros/:id/devolver` | Suma un ejemplar disponible |

## Flujo de trabajo

1. Nadie programa en `main`. Las ramas `feature/*` salen de `develop`.
2. Cada integrante sube su rama y abre un Pull Request hacia `develop`.
3. Ana revisa, aprueba y une. Al cerrar la entrega: `develop` → `main` y etiqueta `v1.0.0`.
