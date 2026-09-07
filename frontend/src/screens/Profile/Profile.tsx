import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from './styles';

export function Profile() {
  const router = useRouter();

  const handleLogout = () => {
    // Redireciona para a tela inicial (Login) limpando o histórico de navegação
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Cabeçalho do Perfil */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
          <Text style={styles.name}>Johnatan Duarte Franco</Text>
          <Text style={styles.location}>Leopoldina, MG</Text>
        </View>

        {/* Estatísticas Flutuantes */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Trilhas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>45 km</Text>
            <Text style={styles.statLabel}>Percorridos</Text>
          </View>
        </View>

        {/* Lista de Opções */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Editar Perfil</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Minhas Sugestões de Trilhas</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Configurações e Privacidade</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Sobre o App</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          {/* Botão de Sair */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}