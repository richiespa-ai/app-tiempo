# Tu app del tiempo

**Demo:** https://richiespa-ai.github.io/app-tiempo/

App para facilitar información del tiempo, tanto actual como los siguientes siete días.

## Tecnologías

- Vanilla JavaScript
- Vite
- HTML
- CSS
- Geocoding de Open-Meteo
- API de Open-Meteo
- Gitleaks
- GitHub Actions
- GitHub Pages
- Fuente Outfit alojada en el proyecto con Fontsource

## Funcionalidades

### Fase 1 (publicada)

- Búsqueda de ciudad por nombre, con lista de coincidencias para elegir.
- Tiempo actual: temperatura, sensación térmica, estado del cielo, viento y humedad.
- Previsión de 7 días en tarjetas: estado del cielo, máxima, mínima y probabilidad de lluvia.
- Botones para mostrar datos opcionales: viento, índice UV con su nivel de riesgo (escala de la OMS), amanecer y atardecer, y fase lunar.
- Fondo animado que cambia según el tiempo: sol, nubes, niebla, lluvia, nieve y tormenta.
- Día y noche según la hora local de la ciudad.
- Modo claro y oscuro según el dispositivo.
- Avisos claros: búsqueda en curso, ciudad no encontrada y sin conexión.

### Fase 2 (en curso)

Publicado:

- Recuerda la última ciudad consultada y la carga al abrir la app.
- "Mis ciudades": guardar hasta 6 ciudades favoritas y cambiar entre ellas con un clic. Se guardan en el propio navegador (localStorage), sin cuentas ni servidor.

Previsto:

- Ubicación automática.
- Autocompletado del campo de búsqueda.

### Fase 3 (prevista)

- (IA o automatización, por decidir)

## Cómo ejecutarla en local

```
git clone https://github.com/richiespa-ai/app-tiempo.git
cd app-tiempo
npm install
npm run dev
```

Abre http://localhost:5173/app-tiempo/ en el navegador.

## Calidad

- HTML validado sin errores ni avisos.
- Lighthouse en móvil, con accesibilidad 100.
- Probada en móvil real y con animaciones desactivadas.
