import "./style.css";

// Elementos de la página que usa el código
const formulario = document.querySelector("#form-busqueda");
const campoCiudad = document.querySelector("#campo-ciudad");
const mensaje = document.querySelector("#mensaje");
const listaCoincidencias = document.querySelector("#coincidencias");
const seccionActual = document.querySelector("#actual");
const seccionPrevision = document.querySelector("#prevision");
const filaDias = document.querySelector("#fila-dias");
const cuerpoPrevision = document.querySelector("#cuerpo-prevision");

// Traducción de los códigos del tiempo (estándar WMO) a texto
const estadosCielo = {
  0: "Despejado",
  1: "Mayormente despejado",
  2: "Parcialmente nublado",
  3: "Cubierto",
  45: "Niebla",
  48: "Niebla con escarcha",
  51: "Llovizna débil",
  53: "Llovizna",
  55: "Llovizna intensa",
  56: "Llovizna helada",
  57: "Llovizna helada intensa",
  61: "Lluvia débil",
  63: "Lluvia",
  65: "Lluvia fuerte",
  66: "Lluvia helada",
  67: "Lluvia helada fuerte",
  71: "Nieve débil",
  73: "Nieve",
  75: "Nieve fuerte",
  77: "Nieve granulada",
  80: "Chubascos débiles",
  81: "Chubascos",
  82: "Chubascos fuertes",
  85: "Chubascos de nieve",
  86: "Chubascos de nieve fuertes",
  95: "Tormenta",
  96: "Tormenta con granizo",
  99: "Tormenta con granizo fuerte",
};

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

// Pide a Open-Meteo el tiempo actual y de 7 días de una ciudad
async function obtenerTiempo(ciudad) {
  const datosActuales = [
    "temperature_2m",
    "apparent_temperature",
    "weather_code",
    "wind_speed_10m",
    "relative_humidity_2m",
  ];
  const datosDiarios = [
    "weather_code",
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_probability_max",
    "wind_speed_10m_max",
    "uv_index_max",
    "sunrise",
    "sunset",
  ];

  const parametros = new URLSearchParams({
    latitude: ciudad.latitude,
    longitude: ciudad.longitude,
    timezone: "auto",
    forecast_days: 7,
    current: datosActuales.join(","),
    daily: datosDiarios.join(","),
  });
  const url = "https://api.open-meteo.com/v1/forecast?" + parametros;

  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    return null;
  }
  return await respuesta.json();
}

// Texto de cada opción: "Valencia, Comunidad Valenciana, España"
function textoCiudad(ciudad) {
  const partes = [ciudad.name, ciudad.admin1, ciudad.country];
  return partes.filter(Boolean).join(", ");
}

// Escribe un texto dentro del elemento con ese id
function escribir(id, texto) {
  document.querySelector(id).textContent = texto;
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

// Rellena la sección del tiempo actual y la muestra
function mostrarTiempoActual(ciudad, tiempo) {
  const actual = tiempo.current;
  const temperatura = Math.round(actual.temperature_2m);
  const sensacion = Math.round(actual.apparent_temperature);

  escribir("#actual-ciudad", textoCiudad(ciudad));
  escribir("#actual-cielo", estadosCielo[actual.weather_code] || "Sin datos");
  escribir("#actual-temperatura", temperatura + " °C");
  escribir("#actual-sensacion", "Sensación " + sensacion + " °C");
  escribir("#actual-viento", actual.wind_speed_10m + " km/h");
  escribir("#actual-humedad", actual.relative_humidity_2m + " %");

  seccionActual.hidden = false;
}
// Nombre corto del día: "Hoy", "vie 2", "sáb 3"...
function nombreDia(fecha, posicion) {
  if (posicion === 0) {
    return "Hoy";
  }
  const dia = new Date(fecha + "T00:00");
  return dia.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" });
}

// Hora de un texto como "2026-10-01T07:58" → "07:58"
function hora(fechaHora) {
  return fechaHora.slice(11, 16);
}

// Crea una celda de la tabla (th o td) con su texto
function crearCelda(etiqueta, texto) {
  const celda = document.createElement(etiqueta);
  celda.textContent = texto;
  return celda;
}

// Crea una fila de la tabla: título a la izquierda y un valor por día
function crearFila(titulo, valores, nombreFila) {
  const fila = document.createElement("tr");
  const cabecera = crearCelda("th", titulo);
  cabecera.scope = "row";
  fila.append(cabecera);

  for (const valor of valores) {
    fila.append(crearCelda("td", valor));
  }

  // Las filas con nombre son las opcionales: empiezan ocultas
  if (nombreFila) {
    fila.dataset.fila = nombreFila;
    fila.hidden = true;
  }
  return fila;
}

// Rellena la tabla de los próximos 7 días y la muestra
function mostrarPrevision(diario) {
  filaDias.innerHTML = "";
  cuerpoPrevision.innerHTML = "";

  // Fila de cabecera: una celda vacía y luego un día por columna
  filaDias.append(crearCelda("th", ""));
  diario.time.forEach(function (fecha, posicion) {
    const celda = crearCelda("th", nombreDia(fecha, posicion));
    celda.scope = "col";
    filaDias.append(celda);
  });

  // Convertimos cada lista de datos en una lista de textos
  const cielo = diario.weather_code.map(
    (codigo) => estadosCielo[codigo] || "—",
  );
  const maximas = diario.temperature_2m_max.map((t) => Math.round(t) + " °C");
  const minimas = diario.temperature_2m_min.map((t) => Math.round(t) + " °C");
  const lluvia = diario.precipitation_probability_max.map((p) => p + " %");
  const viento = diario.wind_speed_10m_max.map((v) => v + " km/h");
  const uv = diario.uv_index_max.map((u) => String(u));
  const sol = diario.sunrise.map(
    (amanecer, i) => hora(amanecer) + " / " + hora(diario.sunset[i]),
  );

  cuerpoPrevision.append(
    crearFila("Cielo", cielo),
    crearFila("Máxima", maximas),
    crearFila("Mínima", minimas),
    crearFila("Prob. lluvia", lluvia),
    crearFila("Viento máx.", viento, "viento"),
    crearFila("Índice UV", uv, "uv"),
    crearFila("Amanecer / atardecer", sol, "sol"),
  );

  seccionPrevision.hidden = false;
}

// Qué pasa al elegir una ciudad de la lista
async function elegirCiudad(ciudad) {
  listaCoincidencias.innerHTML = "";
  mensaje.textContent = "Estamos buscando tu tiempo";

  const tiempo = await obtenerTiempo(ciudad);
  if (tiempo === null) {
    mensaje.textContent = "No se pudo obtener el tiempo. Inténtalo de nuevo.";
    return;
  }

  mensaje.textContent = "";
  mostrarTiempoActual(ciudad, tiempo);
  mostrarPrevision(tiempo.daily);
}

// Qué pasa cuando el usuario pulsa "Buscar" (o Enter)
formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const texto = campoCiudad.value.trim();
  listaCoincidencias.innerHTML = "";
  seccionActual.hidden = true;
  seccionPrevision.hidden = true;
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
