import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';

export default function SuggestRoute() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'trekking' | 'cycling'>('trekking');
  const [difficulty, setDifficulty] = useState<'Fácil' | 'Moderado' | 'Difícil'>('Fácil');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [elevation, setElevation] = useState('');
  const [history, setHistory] = useState('');
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title || !distance || !duration || !elevation || !history) {
      return Alert.alert("Erro", "Preencha todos os campos obrigatórios.");
    }

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('type', type);
      formData.append('difficulty', difficulty);
      formData.append('distance_km', distance);
      formData.append('duration_mins', duration);
      formData.append('elevation_m', elevation);
      formData.append('history', history);

      // Pega o ID do usuário logado e anexa à requisição
      const userJson = await AsyncStorage.getItem('@user');
      if (userJson) {
        const user = JSON.parse(userJson);
        formData.append('user_id', user.id);
      }

      if (image) {
        if (Platform.OS === 'web') {
          const res = await fetch(image);
          const blob = await res.blob();
          formData.append('image', blob, 'photo.jpg');
        } else {
          formData.append('image', {
            uri: image,
            name: 'photo.jpg',
            type: 'image/jpeg',
          } as any);
        }
      }

      await api.post('/trails', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert("Sucesso!", "Trilha criada com sucesso!");

      setTitle('');
      setDistance('');
      setDuration('');
      setElevation('');
      setHistory('');
      setImage(null);
      router.replace('/home');
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao salvar a trilha no banco de dados.");
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sugerir Nova Rota</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Título da Trilha</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Ex: Morro do Cruzeiro" />

        <Text style={styles.label}>Foto da Trilha (Opcional)</Text>
        <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
          <Text style={styles.imagePickerText}>{image ? "Trocar Imagem" : "Escolher Imagem na Galeria"}</Text>
        </TouchableOpacity>
        {image && <Image source={{ uri: image }} style={styles.previewImage} />}

        <Text style={styles.label}>Tipo de Trilha</Text>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.toggleBtn, type === 'trekking' && styles.activeBtn]} onPress={() => setType('trekking')}>
            <Text style={[styles.toggleText, type === 'trekking' && styles.activeText]}>Trekking</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, type === 'cycling' && styles.activeBtn]} onPress={() => setType('cycling')}>
            <Text style={[styles.toggleText, type === 'cycling' && styles.activeText]}>Cycling</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Dificuldade</Text>
        <View style={styles.row}>
          {['Fácil', 'Moderado', 'Difícil'].map((lvl) => (
            <TouchableOpacity key={lvl} style={[styles.toggleBtn, difficulty === lvl && styles.activeBtn]} onPress={() => setDifficulty(lvl as any)}>
              <Text style={[styles.toggleText, difficulty === lvl && styles.activeText]}>{lvl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Distância (em KM)</Text>
        <TextInput style={styles.input} value={distance} onChangeText={setDistance} keyboardType="numeric" placeholder="Ex: 5.5" />

        <Text style={styles.label}>Duração Estimada (em Minutos)</Text>
        <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="numeric" placeholder="Ex: 120" />

        <Text style={styles.label}>Altimetria (Elevação em Metros)</Text>
        <TextInput style={styles.input} value={elevation} onChangeText={setElevation} keyboardType="numeric" placeholder="Ex: 450" />

        <Text style={styles.label}>História e Detalhes</Text>
        <TextInput style={[styles.input, { height: 100 }]} value={history} onChangeText={setHistory} multiline textAlignVertical="top" placeholder="Conte os detalhes da rota..." />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>Salvar Rota</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { backgroundColor: '#1a3d2b', padding: 24, paddingTop: 60 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  form: { padding: 20, paddingBottom: 50 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16 },
  row: { flexDirection: 'row', gap: 10 },
  toggleBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff', alignItems: 'center' },
  activeBtn: { backgroundColor: '#1b5e3b', borderColor: '#1b5e3b' },
  toggleText: { color: '#374151', fontWeight: 'bold' },
  activeText: { color: '#fff' },
  submitBtn: { backgroundColor: '#1b5e3b', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 30 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  imagePickerBtn: { backgroundColor: '#e5e7eb', padding: 16, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'dashed' },
  imagePickerText: { color: '#374151', fontWeight: 'bold' },
  previewImage: { width: '100%', height: 200, borderRadius: 8, marginTop: 12 },
});