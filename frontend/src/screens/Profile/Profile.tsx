import React, { useState, useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { getLocalProfile, type LocalProfile } from '../../services/localProfile';
import { getSavedRoutes } from '../../features/gravacao/routeStorage';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { styles } from './styles';
export function Profile() {
  const router = useRouter();
  const [profile, setProfile] = useState<LocalProfile>({ name: 'Explorador', location: 'Leopoldina, MG', bio: '' });
  const [stats, setStats] = useState({ count: 0, km: '0' });
  const [error, setError] = useState('');
  useFocusEffect(useCallback(() => {
    let active = true;
    Promise.all([getLocalProfile(), getSavedRoutes()]).then(([local, routes]) => {
      if (!active) return;
      setProfile(local); setError('');
      setStats({ count: routes.length, km: (routes.filter(r => r.source !== 'manual').reduce((sum, r) => sum + r.distanceMeters, 0) / 1000).toFixed(1) });
    }).catch(() => { if (active) setError('Não foi possível ler os dados deste aparelho.'); });
    return () => { active = false; };
  }, []));
  return <View style={styles.container}><ScrollView>
    <View style={styles.header}>
      <View style={styles.avatarContainer}><Text style={styles.avatarText}>{profile.name.slice(0, 2).toUpperCase()}</Text></View>
      <Text style={styles.name}>{profile.name}</Text><Text style={styles.location}>{profile.location}</Text>
    </View>
    <View style={styles.statsContainer}>
      <View style={styles.statCard}><Text style={styles.statValue}>{stats.count}</Text><Text style={styles.statLabel}>Rotas salvas</Text></View>
      <View style={styles.statCard}><Text style={styles.statValue}>{stats.km} km</Text><Text style={styles.statLabel}>Gravados</Text></View>
    </View>
    <View style={styles.menuContainer}>
      <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/edit-profile')}><Text style={styles.menuItemText}>Editar perfil local</Text><Text style={styles.menuItemArrow}>›</Text></TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/suggest')}><Text style={styles.menuItemText}>Sugerir e gravar rota</Text><Text style={styles.menuItemArrow}>›</Text></TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/map')}><Text style={styles.menuItemText}>Ver minhas rotas no mapa</Text><Text style={styles.menuItemArrow}>›</Text></TouchableOpacity>
      <Text style={{ color: '#64748b', padding: 16, lineHeight: 21 }}>Perfil e rotas ficam neste aparelho. Não é necessário criar conta. Limpar os dados do navegador ou desinstalar o aplicativo pode apagar as gravações.</Text>
      {!!error && <Text style={{ color: '#a33428' }}>{error}</Text>}
    </View>
  </ScrollView></View>;
}
