import type { LocationObject, LocationSubscription } from 'expo-location';
export type { LocationObject, LocationSubscription } from 'expo-location';
export const Accuracy = { High: 4, BestForNavigation: 6 };
function geolocation() {
  if (!window.isSecureContext) throw new Error('Abra em HTTPS ou localhost para usar a localização. Você também pode desenhar a rota no mapa.');
  if (!navigator.geolocation) throw new Error('Este navegador não oferece localização. Use Desenhar no mapa.');
  return navigator.geolocation;
}
const options: PositionOptions = { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 };
function convert(p: GeolocationPosition): LocationObject {
  return { timestamp: p.timestamp, coords: { latitude: p.coords.latitude, longitude: p.coords.longitude,
    accuracy: p.coords.accuracy, altitude: p.coords.altitude, altitudeAccuracy: p.coords.altitudeAccuracy,
    heading: p.coords.heading, speed: p.coords.speed } };
}
function message(e: GeolocationPositionError) {
  return e.code === 1 ? 'Localização bloqueada. Permita o acesso nas configurações do navegador ou desenhe no mapa.' :
    e.code === 2 ? 'Localização indisponível neste computador. Tente perto de uma janela ou desenhe no mapa.' :
    'A localização demorou para responder. Verifique o serviço de localização do computador ou desenhe no mapa.';
}
export async function getForegroundPermissionsAsync() {
  try { const result = await navigator.permissions.query({ name: 'geolocation' }); return { granted: result.state === 'granted' }; }
  catch { return { granted: false }; }
}
export async function getCurrentPositionAsync(_options?: unknown): Promise<LocationObject> {
  const geo = geolocation();
  return new Promise((resolve, reject) => geo.getCurrentPosition(p => resolve(convert(p)), e => reject(new Error(message(e))), options));
}
export async function requestForegroundPermissionsAsync() {
  if ((await getForegroundPermissionsAsync()).granted) { geolocation(); return { granted: true }; }
  await getCurrentPositionAsync(); return { granted: true };
}
export async function getLastKnownPositionAsync(_options?: unknown): Promise<LocationObject | null> { return null; }
export async function watchPositionAsync(_options: unknown, callback: (p: LocationObject) => void, error?: (s: string) => void): Promise<LocationSubscription> {
  const geo = geolocation();
  const id = geo.watchPosition(p => callback(convert(p)), e => error?.(message(e)), options);
  return { remove: () => geo.clearWatch(id) };
}
