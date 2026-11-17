import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { styles } from './styles';
import { api } from '../../services/api';

interface TourGuide {
  id: string;
  cadastur_number: string;
  name: string;
  neighborhood: string;
  segment: string;
}

interface Accommodation {
  id: string;
  name: string;
  address: string;
  rating_info: string;
}

export function LocalServices() {
  const [activeTab, setActiveTab] = useState<'guides' | 'accommodations'>('guides');
  const [guides, setGuides] = useState<TourGuide[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [guidesRes, accommodationsRes] = await Promise.all([
          api.get('/tour-guides'),
          api.get('/accommodations'),
        ]);
        setGuides(guidesRes.data);
        setAccommodations(accommodationsRes.data);
      } catch (error) {
        console.error('Erro ao carregar guias e hospedagens:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Turismo Local</Text>
        <Text style={styles.headerSubtitle}>
          Guias credenciados no Cadastur e rede hoteleira de Leopoldina
        </Text>
      </View>

      {/* Seletor entre Guias e Hospedagem */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'guides' && styles.tabButtonActive]}
          onPress={() => setActiveTab('guides')}
        >
          <Text style={[styles.tabText, activeTab === 'guides' && styles.tabTextActive]}>
            Guias de Turismo ({guides.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'accommodations' && styles.tabButtonActive]}
          onPress={() => setActiveTab('accommodations')}
        >
          <Text style={[styles.tabText, activeTab === 'accommodations' && styles.tabTextActive]}>
            Hospedagem ({accommodations.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1b5e3b" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'guides' ? (
            guides.length > 0 ? (
              guides.map((guide) => (
                <View key={guide.id} style={styles.card}>
                  <View style={styles.guideRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{getInitials(guide.name)}</Text>
                    </View>

                    <View style={styles.guideInfo}>
                      <Text style={styles.cardTitle}>{guide.name}</Text>

                      <View style={styles.badgeRow}>
                        <View style={styles.segmentBadge}>
                          <Text style={styles.segmentBadgeText}>{guide.segment}</Text>
                        </View>
                        <View style={styles.cadasturBadge}>
                          <Text style={styles.cadasturText}>
                            {'Cadastur: ' + guide.cadastur_number}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.detailText}>
                        {'Bairro / Localidade: ' + guide.neighborhood}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Nenhum guia de turismo cadastrado.</Text>
            )
          ) : accommodations.length > 0 ? (
            accommodations.map((item) => {
              const isAverage = item.rating_info.toLowerCase().includes('médias');

              return (
                <View key={item.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.detailText}>{item.address}</Text>

                  <View style={styles.ratingBox}>
                    <View
                      style={[
                        styles.ratingBadge,
                        isAverage && styles.ratingBadgeNeutral,
                      ]}
                    >
                      <Text
                        style={[
                          styles.ratingText,
                          isAverage && styles.ratingTextNeutral,
                        ]}
                      >
                        {item.rating_info}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>Nenhum local de hospedagem cadastrado.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

export default LocalServices;