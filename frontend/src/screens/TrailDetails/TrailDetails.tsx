import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { styles } from './styles';

// Banco de dados falso temporário para simular os detalhes
const MOCK_TRAIL_DETAILS: Record<string, any> = {
  '1': {
    title: 'Rota de Piacatuba',
    difficulty: 'Moderado',
    distance: '12 km',
    duration: '3h 30m',
    elevation: '320m',
    history: 'Um dos distritos mais antigos da região, conhecido por sua arquitetura colonial e pelo tradicional festival de viola. O percurso passa por antigas fazendas de café e áreas de forte preservação ambiental.',
  },
  '2': {
    title: 'Trilha do Morro do Cruzeiro',
    difficulty: 'Difícil',
    distance: '5 km',
    duration: '2h 00m',
    elevation: '450m',
    history: 'Uma subida íngreme que recompensa os exploradores com a vista panorâmica mais impressionante de Leopoldina. Caminho tradicional de peregrinação e apreciação da topografia local.',
  },
  '3': {
    title: 'Caminho das Fazendas Históricas',
    difficulty: 'Fácil',
    distance: '25 km',
    duration: '4h 00m',
    elevation: '150m',
    history: 'Rota ideal para ciclistas. Um mergulho no passado econômico da região, margeando propriedades seculares que definiram a cultura e a história do município no século XIX.',
  }
};

export function TrailDetails() {
  const router = useRouter();
  // Captura o ID da trilha que veio da Home
  const { id } = useLocalSearchParams<{ id: string }>(); 
  
  const trail = MOCK_TRAIL_DETAILS[id ?? '1'];

  if (!trail) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Trilha não encontrada.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#1b5e3b' }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Botão de voltar flutuante */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Voltar</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Placeholder para a foto da trilha */}
        <View style={styles.headerImagePlaceholder}>
          <Text style={{ color: '#ffffff', opacity: 0.5 }}>[ Imagem de Capa ]</Text>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{trail.title}</Text>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{trail.difficulty.toUpperCase()}</Text>
            </View>
          </View>

          {/* Cartão de Informações Técnicas */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Distância</Text>
              <Text style={styles.statValue}>{trail.distance}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Duração</Text>
              <Text style={styles.statValue}>{trail.duration}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Altimetria</Text>
              <Text style={styles.statValue}>{trail.elevation}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>História e Memória</Text>
          <Text style={styles.description}>{trail.history}</Text>

          {/* Cartão do Guia de Áudio */}
          <View style={styles.audioCard}>
            <View style={styles.audioTextContainer}>
              <Text style={styles.audioTitle}>Guia de Áudio</Text>
              <Text style={styles.audioSubtitle}>Narração sobre a história local</Text>
            </View>
            <TouchableOpacity style={styles.playButton}>
              <Text style={styles.playButtonText}>▶ Ouvir</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}