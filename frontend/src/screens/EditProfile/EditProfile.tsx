import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles';
import { api } from '../../services/api';

export function EditProfile() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('Leopoldina, MG');
  const [bio, setBio] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const userJson = await AsyncStorage.getItem('@user');
        if (userJson) {
          const parsed = JSON.parse(userJson);
          setUserId(parsed.id || '');
          setName(parsed.name || '');
          setLocation(parsed.location || 'Leopoldina, MG');
          setBio(parsed.bio || '');
        }
      } catch (error) {
        console.error('Erro ao carregar dados do perfil:', error);
      }
    }
    loadCurrentUser();
  }, []);

  const handleSave = async () => {
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('O nome completo não pode ficar vazio.');
      return;
    }

    if (!userId) {
      setErrorMessage('Sessão inválida. Faça login novamente.');
      return;
    }

    setSaving(true);

    try {
      const response = await api.put('/users/' + userId, {
        name: name.trim(),
        location: location.trim() || 'Leopoldina, MG',
        bio: bio.trim(),
      });

      await AsyncStorage.setItem('@user', JSON.stringify(response.data));
      router.back();
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      const msg =
        error.response?.data?.error ||
        'Não foi possível salvar as alterações. Verifique o servidor.';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.formContainer}>
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome Completo</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errorMessage) setErrorMessage('');
            }}
            placeholder="Seu nome completo"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Localização</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Ex: Leopoldina, MG"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Biografia</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Fale sobre as suas aventuras em trilhas..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar Alterações</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

export default EditProfile;