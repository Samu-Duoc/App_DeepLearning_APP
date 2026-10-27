import { File } from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { fetch } from "expo/fetch";
import jpeg from "jpeg-js";
import { PredictionResult } from "../models/prediction";

export const API_URL = "http://192.168.1.96:8000"; //cambiar a la IP que son solo los numeros y  mantener el :8000
export const PREVIEW_MODE = false;

type Pixel = [number, number, number];
type ImageMatrix = Pixel[][];

type ApiPredictionResponse = {
  personName?: unknown;
  confidence?: unknown;
  isRegistered?: unknown;
  message?: unknown;
  predictedClassName?: unknown;
  predictedConfidence?: unknown;
};

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export async function imageToMatrix128(uri: string): Promise<ImageMatrix> {
  const resized = await manipulateAsync(
    uri,
    [{ resize: { width: 128, height: 128 } }],
    { base64: true, compress: 1, format: SaveFormat.JPEG },
  );

  if (!resized.base64) {
    throw new Error("No se pudo obtener la imagen en Base64.");
  }

  const binary = Uint8Array.from(atob(resized.base64), (character) =>
    character.charCodeAt(0),
  );
  const decoded = jpeg.decode(binary, { useTArray: true });
  const matrix: ImageMatrix = [];

  for (let y = 0; y < 128; y += 1) {
    const row: Pixel[] = [];
    for (let x = 0; x < 128; x += 1) {
      const offset = (y * 128 + x) * 4;
      row.push([
        decoded.data[offset],
        decoded.data[offset + 1],
        decoded.data[offset + 2],
      ]);
    }
    matrix.push(row);
  }

  return matrix;
}

async function prepararFoto(uri: string): Promise<File> {
  const imagen = await manipulateAsync(uri, [{ resize: { width: 640 } }], {
    compress: 0.9,
    format: SaveFormat.JPEG,
  });

  return new File(imagen.uri);
}

export async function predictPerson(uri: string): Promise<PredictionResult> {
  if (PREVIEW_MODE) {
    await new Promise((r) => setTimeout(r, 600));
    return {
      success: true,
      personName: "Vista previa local",
      confidence: 100,
      isRegistered: true,
      message: "Modo visual activo: no se realizó ninguna conexión con la API.",
    };
  }

  const file = await prepararFoto(uri);
  const form = new FormData();
  form.append("archivo", file);

  const res = await fetch(`${API_URL}/predecir/`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Error del servidor: ${res.status}`);
  const respuesta = (await res.json()) as ApiPredictionResponse;
  return {
    success: true,
    personName: asString(respuesta.personName, "Persona no identificada"),
    confidence: asNumber(respuesta.confidence, 0),
    isRegistered: respuesta.isRegistered === true,
    message: asString(respuesta.message, "Respuesta recibida de la API."),
    predictedClassName:
      typeof respuesta.predictedClassName === "string"
        ? respuesta.predictedClassName
        : undefined,
    predictedConfidence:
      respuesta.predictedConfidence === undefined
        ? undefined
        : asNumber(respuesta.predictedConfidence, 0),
  };
}
