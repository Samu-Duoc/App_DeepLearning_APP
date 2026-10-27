# Aplicación móvil de reconocimiento facial

## Descripción

Esta aplicación móvil permite capturar o seleccionar una fotografía, enviarla
a una API de reconocimiento facial y mostrar el resultado entregado por el
servidor.

La aplicación forma parte de un proyecto de Deep Learning en el que el modelo
de clasificación se utiliza desde una API para identificar personas
disponibles en el sistema.

## Tecnologías utilizadas

- React Native
- Expo SDK 58
- TypeScript
- Expo Router
- `expo-camera` para capturar fotografías
- `expo-image-picker` para seleccionar fotografías desde la galería
- `expo-image-manipulator` para preparar las imágenes
- `expo/fetch` y `FormData` para la comunicación HTTP
- API desarrollada con FastAPI

## Requisitos

- Node.js y npm instalados.
- Dependencias definidas en `package.json`.
- Acceso a la API de reconocimiento facial.
- Expo Go o un emulador compatible con la aplicación.
- Permiso de cámara en el dispositivo cuando se utilice la captura.

## Instalación inicial

Desde la carpeta de la aplicación, ejecuta:

```powershell
npm install
```

Este comando instala las dependencias definidas por el proyecto. No es
necesario repetirlo en cada ejecución si las dependencias no cambiaron.

## Configuración de la API

La dirección del servidor se configura en:

`src/services/api.ts`

La configuración actual es:

```ts
export const API_URL = "http://192.168.1.175:8000";
```

La app agrega el endpoint `/predecir/`, por lo que la dirección completa es:

```text
http://192.168.1.175:8000/predecir/
```

Si se cambia de red o de computador, se reemplaza únicamente la IP por la
dirección IP local del computador donde se ejecuta la API y se conserva el
puerto `8000`. La API debe iniciarse con:

```powershell
uvicorn api:app --host 0.0.0.0 --port 8000
```

Si se utiliza una conexión local por Wi-Fi, el celular y el computador deben
estar conectados a una red que permita la comunicación entre ambos.

## Ejecutar la aplicación

Desde la carpeta de la aplicación, ejecuta:

```powershell
npx expo start
```

Para reiniciar la caché de Expo, puedes utilizar:

```powershell
npx expo start -c
```

Sigue las instrucciones que muestra Expo para abrir la aplicación en Expo Go,
un emulador Android o el entorno compatible disponible.

## Funcionamiento general

El flujo de la aplicación es el siguiente:

1. El usuario elige **Cámara** o **Galería**.
2. Con **Cámara**, la aplicación solicita permiso, abre la cámara frontal y
   permite tomar la fotografía.
3. Con **Galería**, la aplicación abre el selector de imágenes; si el usuario
   cancela, no se realiza ninguna solicitud.
4. La imagen se muestra en el visor y se prepara antes del envío.
5. La aplicación envía la imagen a la API mediante una solicitud HTTP.
6. La API procesa la fotografía y devuelve el resultado.
7. La aplicación presenta el nombre, la confianza y el mensaje recibidos.

## Comunicación con la API

La aplicación consume el endpoint:

`POST /predecir/`

La imagen se envía utilizando `multipart/form-data` en el campo `archivo`.
Antes de crear el formulario, `src/services/api.ts` redimensiona la imagen a
640 píxeles de ancho y la guarda como JPEG con compresión `0.9`.

La solicitud tiene esta forma:

```text
POST http://192.168.1.175:8000/predecir/
Content-Type: multipart/form-data
archivo=<archivo JPEG>
```

La API recibe el archivo, lo convierte a RGB, detecta y recorta el rostro, y
realiza el procesamiento final a **128 × 128 × 3** antes de clasificarlo. La
aplicación no envía actualmente la matriz de píxeles al endpoint
`/predecir-matriz/`; el flujo vigente envía un archivo JPEG a `/predecir/`.

## Resultado del reconocimiento

La aplicación utiliza los campos `personName`, `confidence`, `isRegistered`,
`message`, `predictedClassName` y `predictedConfidence` de la respuesta de la
API.

Cuando la persona está registrada, muestra el nombre identificado, el mensaje
de confirmación y la confianza.

Cuando `isRegistered` es `false`, la aplicación muestra un resultado no
confirmado. Si la API entrega una clase posible, muestra
`Posiblemente: <nombre>` junto con el mensaje:

`Predicción no confirmada: la persona no está registrada.`

Si no existe una predicción útil, muestra `Persona no identificada`. Mientras
se espera la respuesta, presenta un indicador de procesamiento.

## Manejo de errores

La pantalla muestra mensajes cuando ocurre alguno de estos casos:

- No se concede el permiso de cámara.
- No se puede capturar la fotografía.
- El usuario cancela la selección de una imagen.
- La respuesta HTTP de la API no es exitosa.
- Ocurre un error durante la preparación o el envío de la imagen.

La API también puede informar que no se detectó un rostro. En ese caso, la
respuesta indica `isRegistered: false` y la app presenta el resultado como
persona no identificada o no registrada.

## Preparación de la imagen

La aplicación prepara la fotografía como JPEG con un ancho de 640 píxeles
antes de enviarla. La transformación final que utiliza el modelo se realiza en
la API:

1. La API abre el JPEG y lo convierte a RGB.
2. Detecta el rostro y aplica el recorte correspondiente.
3. Redimensiona el recorte a **128 × 128 píxeles**.
4. Utiliza los tres canales de color **R, G y B**.
5. Convierte la imagen a tensor, normaliza sus valores y la entrega al modelo.

Por lo tanto, la aplicación prepara y envía el archivo, mientras que la API
realiza la entrada final `128 × 128 × 3` usada para la clasificación.

## Estructura del proyecto

```text
src/
  app/
    index.tsx             Pantalla inicial
    _layout.tsx           Layout y encabezado de Expo Router
  screens/
    RecognitionScreen.tsx Cámara, galería, estados y resultado
  services/
    api.ts                URL, preparación de imagen y solicitud HTTP
  models/
    prediction.ts         Tipo del resultado de predicción
  components/             Componentes reutilizables y de tema
  hooks/                  Hooks de tema y esquema de color
assets/                   Iconos, imágenes y recursos de Expo
app.json                  Configuración de Expo y plugins
package.json              Dependencias y scripts del proyecto
```

## Consideraciones

- La API debe estar iniciada para realizar reconocimientos.
- La URL configurada debe corresponder al computador que ejecuta la API.
- El celular debe poder comunicarse con el computador por la red.
- No se debe utilizar `localhost` en el celular para referirse al computador.
- La aplicación depende de la respuesta de la API para mostrar el resultado.

## Flujo completo del sistema

**Usuario → cámara o galería → preparación JPEG en la aplicación → solicitud
HTTP multipart → API FastAPI → conversión RGB y detección de rostro →
redimensionamiento 128×128×3 → modelo de clasificación → respuesta JSON →
resultado en pantalla.**
