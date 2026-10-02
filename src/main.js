import "./style.css";

// Elementos de la página que usa el código
const formulario = document.querySelector("#form-busqueda");
const campoCiudad = document.querySelector("#campo-ciudad");
const mensaje = document.querySelector("#mensaje");
const listaCoincidencias = document.querySelector("#coincidencias");
const seccionActual = document.querySelector("#actual");
const seccionPrevision = document.querySelector("#prevision");
const listaDias = document.querySelector("#lista-dias");

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

// Agrupa los códigos en 6 tipos de cielo, para elegir el color de fondo
function grupoCielo(codigo) {
  if (codigo <= 1) return "despejado";
  if (codigo <= 3) return "nubes";
  if (codigo <= 48) return "niebla";
  if (codigo <= 67) return "lluvia";
  if (codigo <= 77) return "nieve";
  if (codigo <= 82) return "lluvia";
  if (codigo <= 86) return "nieve";
  return "tormenta";
}
// Hace una petición y devuelve los datos, o null si algo falla
async function pedirDatos(url) {
  try {
    const respuesta = await fetch(url);
    if (!respuesta.ok) {
      return null;
    }
    return await respuesta.json();
  } catch (error) {
    return null;
  }
}

// Busca ciudades por nombre en el geocoding de Open-Meteo
async function buscarCiudades(texto) {
  const url =
    "https://geocoding-api.open-meteo.com/v1/search?count=5&language=es&name=" +
    encodeURIComponent(texto);

  const datos = await pedirDatos(url);
  if (datos === null) {
    return null;
  }
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
    "is_day",
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
    "moon_phase",
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

  return await pedirDatos(url);
}

// Texto de cada opción: "Valencia, Comunidad Valenciana, España"
function textoCiudad(ciudad) {
  const partes = [ciudad.name, ciudad.admin1, ciudad.country];
  return partes.filter(Boolean).join(", ");
}

// Muestra un mensaje de error; si no hay conexión, lo dice claramente
function mostrarError(texto) {
  if (!navigator.onLine) {
    mensaje.textContent = "Sin conexión a internet. Inténtalo de nuevo.";
    return;
  }
  mensaje.textContent = texto;
}
// Escribe un número como en español: 10.2 → "10,2"
function numero(valor) {
  return valor.toLocaleString("es-ES");
}

// Nivel de riesgo del índice UV, según la escala de la OMS
function nivelUV(valor) {
  const indice = Math.round(valor);
  if (indice <= 2) return "Bajo";
  if (indice <= 5) return "Moderado";
  if (indice <= 7) return "Alto";
  if (indice <= 10) return "Muy alto";
  return "Extremo";
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
  escribir("#actual-viento", numero(actual.wind_speed_10m) + " km/h");
  escribir("#actual-humedad", actual.relative_humidity_2m + " %");
  document.documentElement.dataset.cielo = grupoCielo(actual.weather_code);
  document.documentElement.dataset.momento = actual.is_day ? "dia" : "noche";

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

// Fase lunar: la API da una fracción de 0 a 1 (0 = nueva, 0,5 = llena)
const fasesLuna = [
  "🌑 Luna nueva",
  "🌒 Creciente",
  "🌓 Cuarto creciente",
  "🌔 Gibosa creciente",
  "🌕 Luna llena",
  "🌖 Gibosa menguante",
  "🌗 Cuarto menguante",
  "🌘 Menguante",
];

function faseLunar(fraccion) {
  const posicion = Math.round(fraccion * 8) % 8;
  return fasesLuna[posicion];
}

// ¿Está activado el botón de esta fila opcional?
function botonActivo(nombreFila) {
  const selector = '#botones-extra [data-fila="' + nombreFila + '"]';
  const boton = document.querySelector(selector);
  return boton.getAttribute("aria-pressed") === "true";
}

// Crea un elemento HTML con su texto dentro
function crearElemento(etiqueta, texto) {
  const elemento = document.createElement(etiqueta);
  elemento.textContent = texto;
  return elemento;
}

// Crea un dato de la tarjeta: título y valor
function crearDato(titulo, valor, nombreFila) {
  const dato = document.createElement("div");
  dato.append(crearElemento("dt", titulo), crearElemento("dd", valor));

  // Los datos con nombre son los opcionales: se ven si su botón está activo
  if (nombreFila) {
    dato.dataset.fila = nombreFila;
    dato.hidden = !botonActivo(nombreFila);
  }
  return dato;
}

// Crea la tarjeta de un día. "i" es la posición del día (0 = hoy)
function crearTarjetaDia(diario, i) {
  const maxima = Math.round(diario.temperature_2m_max[i]) + " °C";
  const minima = Math.round(diario.temperature_2m_min[i]) + " °C";
  const sol = hora(diario.sunrise[i]) + " / " + hora(diario.sunset[i]);
  const viento = numero(diario.wind_speed_10m_max[i]) + " km/h";
  const valorUV = diario.uv_index_max[i];
  const uv = numero(valorUV) + " (" + nivelUV(valorUV) + ")";

  const datos = document.createElement("dl");
  datos.append(
    crearDato("Máxima", maxima),
    crearDato("Mínima", minima),
    crearDato("Prob. lluvia", diario.precipitation_probability_max[i] + " %"),
    crearDato("Viento máx.", viento, "viento"),
    crearDato("Índice UV", uv, "uv"),
    crearDato("Amanecer / atardecer", sol, "sol"),
    crearDato("Luna", faseLunar(diario.moon_phase[i]), "luna"),
  );

  const tarjeta = document.createElement("li");
  tarjeta.append(
    crearElemento("h3", nombreDia(diario.time[i], i)),
    crearElemento("p", estadosCielo[diario.weather_code[i]] || "—"),
    datos,
  );
  return tarjeta;
}

// Crea una tarjeta por cada día y muestra la sección
function mostrarPrevision(diario) {
  listaDias.innerHTML = "";

  diario.time.forEach(function (fecha, i) {
    listaDias.append(crearTarjetaDia(diario, i));
  });

  seccionPrevision.hidden = false;
}

// Qué pasa al elegir una ciudad de la lista
async function elegirCiudad(ciudad) {
  listaCoincidencias.innerHTML = "";
  mensaje.textContent = "Estamos buscando tu tiempo";

  const tiempo = await obtenerTiempo(ciudad);
  if (tiempo === null) {
    mostrarError("No se pudo obtener el tiempo. Inténtalo de nuevo.");
    return;
  }

  mensaje.textContent = "";
  mostrarTiempoActual(ciudad, tiempo);
  mostrarPrevision(tiempo.daily);
}
// Botones de filas opcionales: cada clic muestra u oculta su fila
const botonesExtra = document.querySelectorAll("#botones-extra button");

for (const boton of botonesExtra) {
  boton.addEventListener("click", function () {
    const activo = boton.getAttribute("aria-pressed") === "true";
    boton.setAttribute("aria-pressed", String(!activo));

    const selector = '[data-fila="' + boton.dataset.fila + '"]';
    for (const dato of listaDias.querySelectorAll(selector)) {
      dato.hidden = activo;
    }
  });
}

// Qué pasa cuando el usuario pulsa "Buscar" (o Enter)
formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const texto = campoCiudad.value.trim();
  listaCoincidencias.innerHTML = "";
  seccionActual.hidden = true;
  seccionPrevision.hidden = true;
  delete document.documentElement.dataset.cielo;
  delete document.documentElement.dataset.momento;
  mensaje.textContent = "Estamos buscando tu tiempo";

  const ciudades = await buscarCiudades(texto);

  if (ciudades === null) {
    mostrarError("Error en la búsqueda. Inténtalo de nuevo.");
    return;
  }
  if (ciudades.length === 0) {
    mensaje.textContent = "Ciudad no encontrada, busca de nuevo";
    return;
  }

  mensaje.textContent = "";
  mostrarCoincidencias(ciudades);
});
