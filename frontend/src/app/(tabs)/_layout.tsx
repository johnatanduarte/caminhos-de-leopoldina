import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  // Adapta a barra inferior ao espaço ocupado pelo sistema.
  const insets = useSafeAreaInsets();
  const bottom = Math.max(8, insets.bottom);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1b5e3b",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          height: 54 + bottom,
          paddingBottom: bottom,
          paddingTop: 10,
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Início",
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Mapa",
          tabBarIcon: ({ color }) => (
            <Feather name="map" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="suggest"
        options={{
          title: "Sugerir",
          tabBarIcon: ({ color }) => (
            <Feather name="camera" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
