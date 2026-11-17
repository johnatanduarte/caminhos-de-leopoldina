import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RecordedRoute, RouteDraft } from './types';
const DRAFT_KEY = '@caminhos/draft/v1';
const ROUTES_KEY = '@caminhos/routes/v1';
let mutations: Promise<unknown> = Promise.resolve();
function serial<T>(operation: () => Promise<T>): Promise<T> {
  const result = mutations.catch(() => undefined).then(operation);
  mutations = result;
  return result;
}
export async function getDraft(): Promise<RouteDraft | null> {
  const raw = await AsyncStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  const draft: RouteDraft = JSON.parse(raw);
  if (!draft || !Array.isArray(draft.points) || !draft.id) throw new Error('Rascunho local inválido.');
  return draft;
}
export async function setDraft(draft: RouteDraft) { await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); }
export async function removeDraft() { await AsyncStorage.removeItem(DRAFT_KEY); }
export async function getSavedRoutes(): Promise<RecordedRoute[]> {
  const raw = await AsyncStorage.getItem(ROUTES_KEY);
  if (!raw) return [];
  const routes: unknown = JSON.parse(raw);
  if (!Array.isArray(routes) || routes.some(r => !r || !r.id || !Array.isArray(r.points))) throw new Error('Lista de rotas local inválida.');
  return routes as RecordedRoute[];
}
export function upsertSavedRoute(route: RecordedRoute): Promise<RecordedRoute[]> {
  return serial(async () => {
    const routes = await getSavedRoutes();
    const next = [route, ...routes.filter(r => r.id !== route.id)];
    await AsyncStorage.setItem(ROUTES_KEY, JSON.stringify(next));
    return next;
  });
}
export function deleteSavedRoute(id: string): Promise<RecordedRoute[]> {
  return serial(async () => {
    const next = (await getSavedRoutes()).filter(r => r.id !== id);
    await AsyncStorage.setItem(ROUTES_KEY, JSON.stringify(next));
    return next;
  });
}
