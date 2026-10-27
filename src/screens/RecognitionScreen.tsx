import { MaterialIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { PredictionResult } from "../models/prediction";
import { PREVIEW_MODE, predictPerson } from "../services/api";

const NAVY = "#002B49";
const YELLOW = "#FFC72C";

export default function RecognitionScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const pickImage = async (source: "camera" | "gallery") => {
    try {
      if (source === "camera") {
        const permission = cameraPermission?.granted
          ? cameraPermission
          : await requestCameraPermission();
        if (!permission.granted) {
          setError("Se necesita permiso de cámara.");
          return;
        }
        setCameraOpen(true);
        setError(null);
        return;
      }

      setCameraOpen(false);
      let res: ImagePicker.ImagePickerResult;
      res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.9,
      });
      if (res.canceled) {
        setCameraOpen(false);
        return;
      }

      const uri = res.assets[0].uri;
      setCameraOpen(false);
      setImageUri(uri);
      setResult(null);
      setError(null);
      await identify(uri);
    } catch (e: any) {
      setError(`Error al capturar la imagen: ${e?.message ?? e}`);
    }
  };

  const takePhoto = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.9 });
      if (!photo?.uri) {
        throw new Error("No se pudo capturar la foto.");
      }
      setCameraOpen(false);
      setImageUri(photo.uri);
      setResult(null);
      setError(null);
      await identify(photo.uri);
    } catch (e: any) {
      setError(`Error al capturar la imagen: ${e?.message ?? e}`);
    }
  };

  const identify = async (uri: string) => {
    setLoading(true);
    setError(null);
    try {
      setResult(await predictPerson(uri));
    } catch (e: any) {
      setError(String(e?.message ?? e).replace("Exception: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const ok = result?.isRegistered;
  const predictedName =
    result?.predictedClassName?.trim() || undefined;
  const possibleMatch = !ok && predictedName;
  const displayedName = ok
    ? result?.personName ?? "Persona no identificada"
    : possibleMatch
      ? `Posiblemente: ${predictedName}`
      : "Persona no identificada";
  const displayedConfidence = possibleMatch
    ? result?.predictedConfidence ?? result?.confidence ?? 0
    : result?.confidence ?? 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 20 }}>
      {/* Visor de imagen */}
      <View style={[styles.card, styles.viewer]}>
        {cameraOpen ? (
          <CameraView ref={cameraRef} style={styles.cameraPreview} facing="front" />
        ) : imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <MaterialIcons name="face" size={70} color={NAVY} />
            <Text style={styles.placeholderText}>
              Toma una foto a una persona de DUOC UC
            </Text>
          </View>
        )}
      </View>
      {cameraOpen && (
        <Pressable
          style={[styles.captureButton, loading && styles.disabled]}
          disabled={loading}
          onPress={takePhoto}
        >
          <MaterialIcons name="camera" size={24} color="#FFF" />
          <Text style={styles.captureButtonText}>Tomar foto</Text>
        </Pressable>
      )}

      {/* Botones */}
      <View style={styles.row}>
        <Pressable
          style={[styles.btn, styles.btnYellow, loading && styles.disabled]}
          disabled={loading}
          onPress={() => pickImage("camera")}
        >
          <MaterialIcons name="camera-alt" size={22} color={NAVY} />
          <Text style={styles.btnText}>Cámara</Text>
        </Pressable>
        <View style={{ width: 12 }} />
        <Pressable
          style={[styles.btn, styles.btnOutline, loading && styles.disabled]}
          disabled={loading}
          onPress={() => pickImage("gallery")}
        >
          <MaterialIcons name="photo-library" size={22} color={NAVY} />
          <Text style={styles.btnText}>Galería</Text>
        </Pressable>
      </View>

      {/* Procesando */}
      {loading && (
        <View style={[styles.card, styles.loadingCard]}>
          <ActivityIndicator size="large" color={NAVY} />
          <Text style={styles.loadingText}>
            {PREVIEW_MODE
              ? "Preparando vista previa local..."
              : "Procesando imagen e identificando en API..."}
          </Text>
        </View>
      )}

      {/* Error */}
      {error && (
        <View style={styles.errorBox}>
          <MaterialIcons name="error-outline" size={24} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Resultado */}
      {result && !loading && (
        <View
          style={[
            styles.card,
            styles.resultCard,
            { backgroundColor: ok ? "#E8F5E9" : "#FFF3E0" },
          ]}
        >
          {PREVIEW_MODE ? (
            <View style={styles.previewStatus}>
              <View style={styles.previewSquare} />
              <Text style={styles.previewStatusText}>Modo visual activo</Text>
            </View>
          ) : (
            <>
              <MaterialIcons
                name={ok ? "verified-user" : "person-off"}
                size={48}
                color={ok ? "#388E3C" : "#EF6C00"}
              />
              <Text
                style={[
                  styles.resultName,
                  { color: ok ? "#1B5E20" : "#E65100" },
                ]}
              >
                {displayedName}
              </Text>
              <Text style={styles.resultMsg}>
                {ok
                  ? result.message
                  : possibleMatch
                    ? "Predicción no confirmada: la persona no está registrada."
                    : "No se obtuvo una predicción útil."}
              </Text>
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  Confianza: {displayedConfidence.toFixed(1)}%
                </Text>
              </View>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8F9FA" },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  viewer: { height: 260, backgroundColor: "#EEEEEE", overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  cameraPreview: { width: "100%", height: "100%" },
  captureButton: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: NAVY,
  },
  captureButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  placeholderText: {
    marginTop: 12,
    color: "#757575",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  row: { flexDirection: "row", marginTop: 20 },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  btnYellow: { backgroundColor: YELLOW },
  btnOutline: { borderWidth: 2, borderColor: NAVY },
  btnText: { color: NAVY, fontWeight: "bold", fontSize: 15 },
  disabled: { opacity: 0.5 },
  loadingCard: {
    marginTop: 24,
    padding: 20,
    alignItems: "center",
    borderRadius: 4,
  },
  loadingText: { marginTop: 14, fontSize: 13, fontWeight: "500" },
  errorBox: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFEBEE",
    borderWidth: 1,
    borderColor: "#E57373",
  },
  errorText: { flex: 1, color: "#F44336", fontSize: 13 },
  resultCard: {
    marginTop: 24,
    padding: 20,
    alignItems: "center",
    elevation: 5,
  },
  previewStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  previewSquare: {
    width: 16,
    height: 16,
    borderRadius: 3,
    backgroundColor: "#388E3C",
  },
  previewStatusText: {
    color: "#1B5E20",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultName: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  resultMsg: {
    marginTop: 6,
    fontSize: 13,
    color: "#212121",
    textAlign: "center",
  },
  chip: {
    marginTop: 8,
    backgroundColor: "#FFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CCC",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontSize: 14 },
});
