import "./style.css";

const url =
  "https://api.open-meteo.com/v1/forecast?latitude=40.4168&longitude=-3.7038&current=temperature_2m,weather_code";

async function obtenerTiempo() {
  const respuesta = await fetch(url);
  console.log("Código de estado:", respuesta.status);
  if (!respuesta.ok) {
    const error = await respuesta.json();
    console.error("Error de la API:", error.reason);
    return;
  }

  const datos = await respuesta.json();
  console.log("Temperatura:", datos.current.temperature_2m);
}

obtenerTiempo();
