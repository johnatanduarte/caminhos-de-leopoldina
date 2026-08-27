import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity 
} from 'react-native';
import { styles } from './styles';

const MOCK_TRAILS = [
  {
    id: '1',
    title: 'Rota de Piacatuba',
    distance: '12 km',
    difficulty: 'Moderado',
    duration: '3h 30m',
  },
  {
    id: '2',
    title: 'Trilha do Morro do Cruzeiro',
    distance: '5 km',
    difficulty: 'Difícil',
    duration: '2h 00m',
  },
  {
    id: '3',
    title: 'Caminho das Fazendas Históricas',
    distance: '25 km',
    difficulty: 'Fácil (Bicicleta)',
    duration: '4h 00m',
  }
];

export function Home() {
  const [search, setSearch] = useState('');

  // Lógica de filtro automático sensível a maiúsculas/minúsculas
  const filteredTrails = MOCK_TRAILS.filter((trail) => 
    trail.title.toLowerCase().includes(search.toLowerCase())
  );

  const renderTrailCard = ({ item }: { item: typeof MOCK_TRAILS[0] }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={styles.cardImagePlaceholder}>
        <Text style={{ color: '#64748b' }}>[ Imagem da Trilha ]</Text>
      </View>
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
        <Text style={styles.greeting}>Olá, Explorador</Text>
        <Text style={styles.title}>Encontre sua próxima aventura</Text>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar trilhas ou lugares..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch} // Atualiza o texto instantaneamente
          />
        </View>
      </View>

      <FlatList
        data={filteredTrails} // Agora consome a lista já filtrada
        keyExtractor={(item) => item.id}
        renderItem={renderTrailCard}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Trilhas em Destaque</Text>}
        showsVerticalScrollIndicator={false}
        // Mensagem amigável caso a pesquisa não encontre nada
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#6b7280' }}>
            Nenhuma trilha encontrada para "{search}".
          </Text>
        }
      />
    </View>
  );
}