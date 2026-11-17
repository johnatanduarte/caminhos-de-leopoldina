import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';

interface FieldErrors {
  title?: string;
  distance?: string;
  duration?: string;
  elevation?: string;
  history?: string;
}

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

  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const clearError = (field: keyof FieldErrors) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (apiError) setApiError('');
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const validate = (): boolean => {
    const newErrors: FieldErrors = {};

    if (!title.trim()) {
      newErrors.title = 'O título da trilha está em branco.';
    }

    if (!distance.trim()) {
      newErrors.distance = 'A distância está em branco.';
    } else if (isNaN(Number(distance.replace(',', '.')))) {
      newErrors.distance = 'Informe um número válido (ex: 5.5).';
    }

    if (!duration.trim()) {
      newErrors.duration = 'A duração estimada está em branco.';
    } else if (isNaN(Number(duration))) {
      newErrors.duration = 'Informe os minutos em números (ex: 120).';
    }

    if (!elevation.trim()) {
      newErrors.elevation = 'A altimetria está em branco.';
    } else if (isNaN(Number(elevation))) {
      newErrors.elevation = 'Informe a elevação em números (ex: 450).';
    }

    if (!history.trim()) {
      newErrors.history = 'A história e detalhes estão em branco.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setApiError('');

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('type', type);
      formData.append('difficulty', difficulty);
      formData.append('distance_km', distance.trim());
      formData.append('duration_mins', duration.trim());
      formData.append('elevation_m', elevation.trim());
      formData.append('history', history.trim());

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

      setTitle('');
      setDistance('');
      setDuration('');
      setElevation('');
      setHistory('');
      setImage(null);
      setErrors({});
      router.replace('/home');
    } catch (error) {
      console.error(error);
      setApiError('Falha ao salvar a trilha no banco de dados.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sugerir Nova Rota</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Título da Trilha</Text>
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            clearError('title');
          }}
          placeholder="Ex: Morro do Cruzeiro"
        />
        {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}

        <Text style={styles.label}>Foto da Trilha (Opcional)</Text>
        <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
          <Text style={styles.imagePickerText}>
            {image ? 'Trocar Imagem' : 'Escolher Imagem na Galeria'}
          </Text>
        </TouchableOpacity>
        {image && <Image source={{ uri: image }} style={styles.previewImage} />}

        <Text style={styles.label}>Tipo de Trilha</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.toggleBtn, type === 'trekking' && styles.activeBtn]}
            onPress={() => setType('trekking')}
          >
            <Text style={[styles.toggleText, type === 'trekking' && styles.activeText]}>
              Trekking
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, type === 'cycling' && styles.activeBtn]}
            onPress={() => setType('cycling')}
          >
            <Text style={[styles.toggleText, type === 'cycling' && styles.activeText]}>
              Cycling
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Dificuldade</Text>
        <View style={styles.row}>
          {['Fácil', 'Moderado', 'Difícil'].map((lvl) => (
            <TouchableOpacity
              key={lvl}
              style={[styles.toggleBtn, difficulty === lvl && styles.activeBtn]}
              onPress={() => setDifficulty(lvl as any)}
            >
              <Text style={[styles.toggleText, difficulty === lvl && styles.activeText]}>
                {lvl}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Distância (em KM)</Text>
        <TextInput
          style={[styles.input, errors.distance && styles.inputError]}
          value={distance}
          onChangeText={(text) => {
            setDistance(text);
            clearError('distance');
          }}
          keyboardType="numeric"
          placeholder="Ex: 5.5"
        />
        {errors.distance ? <Text style={styles.errorText}>{errors.distance}</Text> : null}

        <Text style={styles.label}>Duração Estimada (em Minutos)</Text>
        <TextInput
          style={[styles.input, errors.duration && styles.inputError]}
          value={duration}
          onChangeText={(text) => {
            setDuration(text);
            clearError('duration');
          }}
          keyboardType="numeric"
          placeholder="Ex: 120"
        />
        {errors.duration ? <Text style={styles.errorText}>{errors.duration}</Text> : null}

        <Text style={styles.label}>Altimetria (Elevação em Metros)</Text>
        <TextInput
          style={[styles.input, errors.elevation && styles.inputError]}
          value={elevation}
          onChangeText={(text) => {
            setElevation(text);
            clearError('elevation');
          }}
          keyboardType="numeric"
          placeholder="Ex: 450"
        />
        {errors.elevation ? <Text style={styles.errorText}>{errors.elevation}</Text> : null}

        <Text style={styles.label}>História e Detalhes</Text>
        <TextInput
          style={[styles.input, { height: 100 }, errors.history && styles.inputError]}
          value={history}
          onChangeText={(text) => {
            setHistory(text);
            clearError('history');
          }}
          multiline
          textAlignVertical="top"
          placeholder="Conte os detalhes da rota..."
        />
        {errors.history ? <Text style={styles.errorText}>{errors.history}</Text> : null}

        {apiError ? (
          <View style={styles.apiErrorBox}>
            <Text style={styles.apiErrorText}>{apiError}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Salvar Rota</Text>
          )}
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
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#dc2626',
    borderWidth: 1.5,
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
  },
  apiErrorBox: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  apiErrorText: {
    color: '#dc2626',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  row: { flexDirection: 'row', gap: 10 },
  toggleBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  activeBtn: { backgroundColor: '#1b5e3b', borderColor: '#1b5e3b' },
  toggleText: { color: '#374151', fontWeight: 'bold' },
  activeText: { color: '#fff' },
  submitBtn: {
    backgroundColor: '#1b5e3b',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  imagePickerBtn: {
    backgroundColor: '#e5e7eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
  },
  imagePickerText: { color: '#374151', fontWeight: 'bold' },
  previewImage: { width: '100%', height: 200, borderRadius: 8, marginTop: 12 },
});