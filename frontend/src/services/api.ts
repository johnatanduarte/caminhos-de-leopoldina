import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseUrl = () => {
  // Se for Web, acessa direto o localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }

  // No celular, o hostUri contém "IP_DA_MAQUINA:PORTA_DO_EXPO" (ex: "200.18.141.54:8081")
  const hostUri = Constants.expoConfig?.hostUri;

  if (hostUri) {
    const ip = hostUri.split(':')[0]; // Extrai apenas o IP dinamicamente
    return `http://${ip}:3000`;
  }

  return 'http://localhost:3000';
};

export const api = axios.create({
  baseURL: getBaseUrl(),
});