import AsyncStorage from '@react-native-async-storage/async-storage';
export type LocalProfile = { name: string; location: string; bio: string };
const KEY = '@caminhos/profile/local/v1';
export async function getLocalProfile(): Promise<LocalProfile> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : { name: 'Explorador', location: 'Leopoldina, MG', bio: '' };
}
export async function saveLocalProfile(profile: LocalProfile) { await AsyncStorage.setItem(KEY, JSON.stringify(profile)); }
