import "./style.css";

// Elementos de la página que usa el código
const formulario = document.querySelector("#form-busqueda");
const campoCiudad = document.querySelector("#campo-ciudad");
const mensaje = document.querySelector("#mensaje");
const listaCoincidencias = document.querySelector("#coincidencias");

// Busca ciudades por nombre en el geocoding de Open-Meteo
async function buscarCiudades(texto) {
  const url =
    "https://geocoding-api.open-meteo.com/v1/search?count=5&language=es&name=" +
    encodeURIComponent(texto);

  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    return null;
  }

  const datos = await respuesta.json();
  if (!datos.results) {
    return [];
  }
  return datos.results;
}

// Texto de cada opción: "Valencia, Comunidad Valenciana, España"
function textoCiudad(ciudad) {
  const partes = [ciudad.name, ciudad.admin1, ciudad.country];
  return partes.filter(Boolean).join(", ");
}

// Pinta la lista de coincidencias como botones
function mostrarCoincidencias(ciudades) {
  listaCoincidencias.innerHTML = "";

  for (const ciudad of ciudades) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = textoCiudad(ciudad);
    boton.addEventListener("click", function () {
      elegirCiudad(ciudad);
    });

    const elemento = document.createElement("li");
    elemento.append(boton);
    listaCoincidencias.append(elemento);
  }
}

// Qué pasa al elegir una ciudad de la lista
function elegirCiudad(ciudad) {
  listaCoincidencias.innerHTML = "";
  console.log("Ciudad elegida:", ciudad);
}

// Qué pasa cuando el usuario pulsa "Buscar" (o Enter)
formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const texto = campoCiudad.value.trim();
  listaCoincidencias.innerHTML = "";
  mensaje.textContent = "Estamos buscando tu tiempo";

  const ciudades = await buscarCiudades(texto);

  if (ciudades === null) {
    mensaje.textContent = "Error en la búsqueda. Inténtalo de nuevo.";
    return;
  }
  if (ciudades.length === 0) {
    mensaje.textContent = "Ciudad no encontrada, busca de nuevo";
    return;
  }

  mensaje.textContent = "";
  mostrarCoincidencias(ciudades);
});
