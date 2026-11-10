import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { styles } from './styles';
import { api } from '../../services/api';
import { ConfirmModal } from '../../components/ConfirmModal/ConfirmModal';

const { width } = Dimensions.get('window');

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
  audio_url: string | null;
  user_id: string | null;
}

export function TrailDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [trail, setTrail] = useState<Trail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Estado do Modal Personalizado de Exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Estados do Modal de Edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDistance, setEditDistance] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editElevation, setEditElevation] = useState('');
  const [editHistory, setEditHistory] = useState('');
  const [editDifficulty, setEditDifficulty] = useState<string>('Fácil');
  const [editImage, setEditImage] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const userJson = await AsyncStorage.getItem('@user');
        if (userJson) {
          const user = JSON.parse(userJson);
          setCurrentUserId(user.id);
        }

        const response = await api.get(`/trails/${id}`);
        setTrail(response.data);
      } catch (error) {
        console.error("Erro ao buscar detalhes da trilha:", error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id]);

  const openEditModal = () => {
    if (!trail) return;
    setEditTitle(trail.title);
    setEditDistance(String(trail.distance_km));
    setEditDuration(String(trail.duration_mins));
    setEditElevation(String(trail.elevation_m));
    setEditHistory(trail.history);
    setEditDifficulty(trail.difficulty);
    setEditImage(null);
    setIsEditModalOpen(true);
  };

  const pickEditImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      setEditImage(result.assets[0].uri);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle || !editDistance || !editDuration || !editElevation || !editHistory) {
      return;
    }

    setSavingEdit(true);

    try {
      const formData = new FormData();
      formData.append('title', editTitle);
      formData.append('difficulty', editDifficulty);
      formData.append('distance_km', editDistance);
      formData.append('duration_mins', editDuration);
      formData.append('elevation_m', editElevation);
      formData.append('history', editHistory);
      if (currentUserId) {
        formData.append('user_id', currentUserId);
      }

      if (editImage) {
        const res = await fetch(editImage);
        const blob = await res.blob();
        formData.append('image', blob, 'photo.jpg');
      }

      const response = await api.put(`/trails/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setTrail(response.data);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar edição:", error);
    } finally {
      setSavingEdit(false);
    }
  };

  // Função disparada quando o usuário clica em "Excluir" DENTRO do ConfirmModal
  const executeDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/trails/${id}`, {
        data: { user_id: currentUserId }
      });
      setIsDeleteModalOpen(false);
      router.replace('/home');
    } catch (error) {
      console.error("Erro ao excluir rota:", error);
      setIsDeleteModalOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm' : ''}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1b5e3b" />
      </View>
    );
  }

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

  const isOwner = currentUserId && trail.user_id === currentUserId;
  const images = trail.image_url ? [{ uri: trail.image_url }] : [];

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>

        {isOwner && (
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={openEditModal} style={styles.editButton}>
              <Text style={styles.editButtonText}>Editar Rota</Text>
            </TouchableOpacity>

            {/* ABRE O CONFIRM MODAL PERSONALIZADO */}
            <TouchableOpacity onPress={() => setIsDeleteModalOpen(true)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Excluir Rota</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {images.length > 0 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={true} style={{ height: 250 }}>
            {images.map((imgSource, index) => (
              <Image key={index} source={imgSource} style={{ width: width, height: 250 }} resizeMode="cover" />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.headerImagePlaceholder}>
            <Text style={{ color: '#ffffff', opacity: 0.5 }}>[ Imagem de Capa ]</Text>
          </View>
        )}

        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{trail.title}</Text>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{trail.difficulty.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Distância</Text>
              <Text style={styles.statValue}>{trail.distance_km} km</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Duração</Text>
              <Text style={styles.statValue}>{formatDuration(trail.duration_mins)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Altimetria</Text>
              <Text style={styles.statValue}>{trail.elevation_m}m</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>História e Memória</Text>
          <Text style={styles.description}>{trail.history}</Text>
        </View>
      </ScrollView>

      {/* MODAL REUTILIZÁVEL DE CONFIRMAÇÃO */}
      <ConfirmModal
        visible={isDeleteModalOpen}
        title="Excluir Rota"
        message="Tem certeza que deseja excluir esta rota permanentemente? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        loading={deleting}
        onConfirm={executeDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      {/* MODAL DE EDIÇÃO */}
      <Modal visible={isEditModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Editar Rota</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>Título</Text>
              <TextInput style={styles.modalInput} value={editTitle} onChangeText={setEditTitle} />

              <Text style={styles.modalLabel}>Dificuldade</Text>
              <View style={styles.modalRow}>
                {['Fácil', 'Moderado', 'Difícil'].map((lvl) => (
                  <TouchableOpacity
                    key={lvl}
                    style={[styles.modalToggleBtn, editDifficulty === lvl && styles.modalActiveBtn]}
                    onPress={() => setEditDifficulty(lvl)}
                  >
                    <Text style={[styles.modalToggleText, editDifficulty === lvl && styles.modalActiveText]}>{lvl}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Distância (KM)</Text>
              <TextInput style={styles.modalInput} value={editDistance} onChangeText={setEditDistance} keyboardType="numeric" />

              <Text style={styles.modalLabel}>Duração (Minutos)</Text>
              <TextInput style={styles.modalInput} value={editDuration} onChangeText={setEditDuration} keyboardType="numeric" />

              <Text style={styles.modalLabel}>Altimetria (Metros)</Text>
              <TextInput style={styles.modalInput} value={editElevation} onChangeText={setEditElevation} keyboardType="numeric" />

              <Text style={styles.modalLabel}>História</Text>
              <TextInput
                style={[styles.modalInput, { height: 80 }]}
                value={editHistory}
                onChangeText={setEditHistory}
                multiline
              />

              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickEditImage}>
                <Text style={styles.imagePickerText}>{editImage ? "Nova Imagem Selecionada" : "Alterar Foto de Capa"}</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsEditModalOpen(false)}
                disabled={savingEdit}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Salvar Alterações</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}