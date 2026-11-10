import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles';
import { api } from '../../services/api';
import { ConfirmModal } from '../../components/ConfirmModal/ConfirmModal';

interface UserData {
  id: string;
  name: string;
  email: string;
}

export function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);

  // Estados dos modais
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      try {
        const userJson = await AsyncStorage.getItem('@user');
        if (userJson) {
          setUser(JSON.parse(userJson));
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    }
    loadUserData();
  }, []);

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await AsyncStorage.removeItem('@user');
      setIsLogoutModalOpen(false);
      router.replace('/');
    } catch (error) {
      console.error('Erro ao realizar logout:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (!user?.id) return;
    setDeletingAccount(true);

    try {
      await api.delete(`/users/${user.id}`);
      await AsyncStorage.removeItem('@user');
      setIsDeleteAccountModalOpen(false);
      router.replace('/');
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
    } finally {
      setDeletingAccount(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'JD';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cabeçalho do Perfil */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </View>
          <Text style={styles.name}>{user?.name || 'Explorador'}</Text>
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
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => router.push('/edit-profile')}
          >
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
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={() => setIsLogoutModalOpen(true)}
          >
            <Text style={styles.logoutText}>Sair da Conta</Text>
          </TouchableOpacity>

          {/* Botão de Excluir Conta */}
          <TouchableOpacity 
            style={styles.deleteAccountButton} 
            onPress={() => setIsDeleteAccountModalOpen(true)}
          >
            <Text style={styles.deleteAccountText}>Excluir Minha Conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de Confirmação de Logout */}
      <ConfirmModal
        visible={isLogoutModalOpen}
        title="Sair da Conta"
        message="Tem certeza que deseja encerrar sua sessão no aplicativo?"
        confirmText="Sair"
        cancelText="Cancelar"
        type="warning"
        loading={loggingOut}
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />

      {/* Modal de Confirmação de Exclusão de Conta */}
      <ConfirmModal
        visible={isDeleteAccountModalOpen}
        title="Excluir Conta"
        message="Esta ação é permanente e apagará a sua conta e todas as suas rotas cadastradas. Deseja continuar?"
        confirmText="Excluir Minha Conta"
        cancelText="Cancelar"
        type="danger"
        loading={deletingAccount}
        onConfirm={handleConfirmDeleteAccount}
        onCancel={() => setIsDeleteAccountModalOpen(false)}
      />
    </View>
  );
}