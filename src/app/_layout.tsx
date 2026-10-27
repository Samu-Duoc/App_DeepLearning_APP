import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          title: "DUOC UC - Reconocimiento Facial",
          headerStyle: { backgroundColor: "#002B49" },
          headerTintColor: "#FFFFFF",
          headerTitleAlign: "center",
          headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
        }}
      />
    </>
  );
}
