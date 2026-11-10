import React, { useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router"; // <-- Adicionado useFocusEffect
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from "react-native";
import { styles } from "./styles";
import { api } from "../../services/api";

interface Trail {
  id: string;
  title: string;
  type: string;
  difficulty: string;
  distance_km: number;
  duration_mins: number;
  elevation_m: number;
  history: string;
  image_url: string | null;
}

export function Home() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);

  // NOVO: Busca os dados toda vez que a tela entra em foco
  useFocusEffect(
    useCallback(() => {
      async function loadTrails() {
        try {
          const response = await api.get('/trails');
          setTrails(response.data);
        } catch (error) {
          console.error("Erro ao carregar trilhas:", error);
        } finally {
          setLoading(false);
        }
      }
      loadTrails();
    }, [])
  );

  const filteredTrails = trails.filter((trail) =>
    trail.title.toLowerCase().includes(search.toLowerCase()),
  );

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm' : ''}`;
  };

  const renderTrailCard = ({ item }: { item: Trail }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => router.push(`/trail/${item.id}` as any)}
    >
      {item.image_url ? (
        <Image 
          source={{ uri: item.image_url }} 
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
          {item.distance_km} km • {formatDuration(item.duration_mins)}
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
        <View style={styles.headerTopRow}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>Olá, Explorador</Text>
            <Text style={styles.title}>Encontre sua próxima aventura</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => router.push("/profile")}>
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

      {/* Alterado para só mostrar o ActivityIndicator no carregamento inicial */}
      {loading && trails.length === 0 ? (
        <ActivityIndicator size="large" color="#1b5e3b" style={{ marginTop: 50 }} />
      ) : (
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
              Nenhuma trilha encontrada.
            </Text>
          }
        />
      )}
    </View>
  );
}