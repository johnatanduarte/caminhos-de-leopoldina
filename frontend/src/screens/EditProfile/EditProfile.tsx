import { getLocalProfile, saveLocalProfile } from '../../services/localProfile';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './styles';

export function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('Explorador');
  const [location, setLocation] = useState('Leopoldina, MG');
  const [bio, setBio] = useState('');

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    getLocalProfile().then(p => { if (active) { setName(p.name); setLocation(p.location); setBio(p.bio); } })
      .catch(() => { if (active) setError('Não foi possível ler o perfil local.'); });
    return () => { active = false; };
  }, []);
  const handleSave = async () => {
    if (busy) return;
    if (!name.trim()) { setError('Digite seu nome.'); return; }
    setBusy(true); setError('');
    try { await saveLocalProfile({ name: name.trim(), location: location.trim(), bio: bio.trim() }); router.back(); }
    catch { setError('Não foi possível salvar neste aparelho.'); }
    finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.formContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome Completo</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Localização</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
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
          />
        </View>

        {!!error && <Text style={{ color: '#a33428' }}>{error}</Text>}
        <TouchableOpacity disabled={busy} style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Guardar Alterações</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}