import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image
} from "react-native";
import { styles } from "./styles";

const MOCK_TRAILS = [
  {
    id: "1",
    title: "Rota de Piacatuba",
    distance: "12 km",
    difficulty: "Moderado",
    duration: "3h 30m",
    image: require("../../../assets/piedade.jpeg"),
  },
  {
    id: "2",
    title: "Trilha do Morro do Cruzeiro",
    distance: "5 km",
    difficulty: "Difícil",
    duration: "2h 00m",
    image: require("../../../assets/cruzeiro2.jpeg"),
  },
  {
    id: "3",
    title: "Caminho das Fazendas Históricas",
    distance: "25 km",
    difficulty: "Fácil (Bicicleta)",
    duration: "4h 00m",
  },
];

export function Home() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  
  const filteredTrails = MOCK_TRAILS.filter((trail) =>
    trail.title.toLowerCase().includes(search.toLowerCase()),
  );

  const renderTrailCard = ({ item }: { item: (typeof MOCK_TRAILS)[0] }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => router.push(`/trail/${item.id}` as any)}
    >
      {item.image ? (
        <Image 
          source={item.image} 
          style={{ width: '100%', height: 150, borderTopLeftRadius: 12, borderTopRightRadius: 12 }} 
          resizeMode="cover" 
        />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <Text style={{ color: "#64748b" }}>[ Imagem da Trilha ]</Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDetails}>
          {item.distance} • {item.duration}
        </Text>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{item.difficulty.toUpperCase()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Usando os estilos corretos do styles.ts para arrumar o Avatar */}
        <View style={styles.headerTopRow}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>Olá, Explorador</Text>
            <Text style={styles.title}>Encontre sua próxima aventura</Text>
          </View>

          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push("/profile")}
          >
            <Text style={{ color: "#1b5e3b", fontWeight: "bold" }}>JD</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar trilhas ou lugares..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch} 
          />
        </View>
      </View>

      <FlatList
        data={filteredTrails} 
        keyExtractor={(item) => item.id}
        renderItem={renderTrailCard}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>Explorar sugestões de rotas</Text>
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20, color: "#6b7280" }}>
            Nenhuma trilha encontrada para "{search}".
          </Text>
        }
      />
    </View>
  );
}