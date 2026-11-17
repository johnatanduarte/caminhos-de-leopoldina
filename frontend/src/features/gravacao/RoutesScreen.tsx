import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert as NativeAlert, AppState, Pressable, ScrollView, StyleSheet, Text, TextInput,
  useWindowDimensions, View, Platform,
} from 'react-native';
import type { LatLng } from 'react-native-maps';
import TrailMap, { type TrailMapHandle } from './TrailMap';
import * as Location from './location';
import { useFocusEffect } from 'expo-router';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import type { RouteDraft, RecordedRoute, RoutePoint, AltitudeSample } from './types';
import {
  currentSpeedKmh, averageSpeedKmh, formatSpeed, canAcceptPoint, elapsedMs, formatDistance, formatDuration, routeMetrics, readableAltitude,
  trustedAltitude, smoothLiveAltitude, MAX_ALTITUDE_UNCERTAINTY_METERS,
} from './routeMath';
import {
  deleteSavedRoute, getDraft, getSavedRoutes, removeDraft, setDraft, upsertSavedRoute,
} from './routeStorage';

const Alert = { alert: (...args: Parameters<typeof NativeAlert.alert>) => {
  if (Platform.OS !== 'web') return NativeAlert.alert(...args);
  const [title, message, buttons] = args;
  if (buttons?.length) { if (window.confirm(`${title}\n${message ?? ''}`)) buttons.find(b => b.style !== 'cancel')?.onPress?.(); }
  else window.alert(`${title}\n${message ?? ''}`);
} };
const GREEN = '#17633e';
const INITIAL_REGION = { latitude: -21.531, longitude: -42.642, latitudeDelta: 0.045, longitudeDelta: 0.045 };
const position = (point: Pick<RoutePoint, 'latitude' | 'longitude'>): LatLng =>
  ({ latitude: point.latitude, longitude: point.longitude });

function asPoint(location: Location.LocationObject, segment: number): RoutePoint {
  const { coords } = location;
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    altitudeMeters: coords.altitude != null && Number.isFinite(coords.altitude) ? coords.altitude : null,
    altitudeAccuracyMeters: coords.altitudeAccuracy ?? null,
    accuracyMeters: coords.accuracy ?? null,
    speedMetersPerSecond: coords.speed ?? null,
    recordedAt: location.timestamp || Date.now(),
    segment,
  };
}
function Action({ label, icon, onPress, secondary = false, disabled = false }: {
  label: string; icon?: React.ComponentProps<typeof Feather>['name']; onPress: () => void;
  secondary?: boolean; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
    style={[styles.action, secondary && styles.actionOutline, disabled && styles.disabled]}>
    {icon ? <Feather name={icon} color={secondary ? GREEN : 'white'} size={17} /> : null}
    <Text style={[styles.actionLabel, secondary && styles.actionOutlineLabel]}>{label}</Text>
  </Pressable>;
}
function Metric({ title, value, extra }: { title: string; value: string; extra?: string }) {
  return <View style={styles.metric}>
    <Text style={styles.metricTitle}>{title}</Text>
    <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    {extra ? <Text style={styles.metricExtra}>{extra}</Text> : null}
  </View>;
}

/** Mapa com gravação local em primeiro plano e desenho manual na web. */
export default function RoutesScreen({ mode = 'suggest' }: { mode?: 'suggest' | 'browse' }) {
  const creating = mode === 'suggest';
  const router = useRouter();
  const { height } = useWindowDimensions();
  const mapHeight = Math.max(290, Math.min(490, height * 0.43));
  const mapRef = useRef<TrailMapHandle>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const draftRef = useRef<RouteDraft | null>(null);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());
  const mountedRef = useRef(true);
  const gpsGeneration = useRef(0);
  const attemptRef = useRef(false);
  const followRef = useRef(true);
  const previousFixRef = useRef<RoutePoint | null>(null);
  const speedWindowRef = useRef<RoutePoint[]>([]);
  const [liveSpeed, setLiveSpeed] = useState<number | null>(null);
  const saveRef = useRef(false);
  const [draft, setDraftState] = useState<RouteDraft | null>(null);
  const [routes, setRoutes] = useState<RecordedRoute[]>([]);
  const [selected, setSelected] = useState<RecordedRoute | null>(null);
  const [name, setName] = useState('');
  const [now, setNow] = useState(Date.now());
  const [lastFix, setLastFix] = useState<RoutePoint | null>(null);
  const [permission, setPermission] = useState(false);
  const [locating, setLocating] = useState(false);
  const [starting, setStarting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [satellite, setSatellite] = useState(false);
  const [follow, setFollow] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  const updateDraft = useCallback((next: RouteDraft | null) => {
    draftRef.current = next;
    if (mountedRef.current) setDraftState(next);
    if (next) {
      // Serialização das gravações evita que atualizações antigas sobrescrevam as recentes.
      writeQueue.current = writeQueue.current.catch(() => undefined).then(() => setDraft(next));
      void writeQueue.current.catch(() => {
        if (mountedRef.current) setError('Não foi possível armazenar o percurso. Verifique o espaço no dispositivo.');
      });
    }
  }, []);

  const stopWatch = useCallback(() => {
    gpsGeneration.current++;
    watchRef.current?.remove();
    watchRef.current = null;
  }, []);

  const pause = useCallback(() => {
    stopWatch();
    const current = draftRef.current;
    if (!current || current.status !== 'recording') return;
    const at = Date.now();
    updateDraft({ ...current, status: 'paused', elapsedBeforeMs: elapsedMs(current, at),
      activeSince: null, lastActiveAt: at });
  }, [stopWatch, updateDraft]);

  const moveTo = useCallback((point: LatLng, delta = 0.008) => {
    mapRef.current?.animateToRegion({ ...point, latitudeDelta: delta, longitudeDelta: delta }, 500);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let active = true;
    (async () => {
      try {
        const [stored, permissionState] = await Promise.all([
          creating ? getDraft() : Promise.resolve(null), Location.getForegroundPermissionsAsync(),
        ]);
        if (!active) return;
        setPermission(permissionState.granted);
        if (stored) {
          // Ao reiniciar, pausa a gravação e recupera os pontos sem contar o tempo em segundo plano.
          const latestTime = stored.lastActiveAt ?? stored.activeSince ?? stored.startedAt;
          const recovered: RouteDraft = stored.status === 'recording' ? {
            ...stored, status: 'paused', activeSince: null,
            elapsedBeforeMs: stored.elapsedBeforeMs + Math.max(0, latestTime - (stored.activeSince ?? latestTime)),
          } : stored;
          updateDraft({ ...recovered, altitudeSamples: recovered.altitudeSamples ?? [] });
          setName(recovered.name ?? '');
          setNotice(recovered.source === 'manual' ? 'Desenho anterior recuperado.' : 'Gravação anterior recuperada.');
        }
        if (permissionState.granted) {
          const last = await Location.getLastKnownPositionAsync({ maxAge: 120000 });
          if (active && last) {
            setLastFix(asPoint(last, 0));
            moveTo(last.coords, 0.01);
          }
        }
      } catch (e) {
        if (active) setError('Não foi possível recuperar o rascunho: ' + String(e));
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; mountedRef.current = false; stopWatch(); };
  }, [creating, moveTo, stopWatch, updateDraft]);

  useFocusEffect(useCallback(() => {
    let active = true;
    setSelected(null);
    setRoutes([]);
    getSavedRoutes().then(saved => { if (active) setRoutes(saved); })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Não foi possível carregar as rotas.'); });
    return () => { active = false; pause(); stopWatch(); };
  }, [creating, pause, stopWatch]));

  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      if (state === 'background' && draftRef.current?.status === 'recording') {
        pause();
        setNotice('Gravação pausada ao sair do aplicativo. Abra e toque em Continuar.');
      }
    });
    return () => listener.remove();
  }, [pause]);

  useEffect(() => {
    const timer = setInterval(() => {
      const at = Date.now();
      setNow(at);
      const d = draftRef.current;
      if (Platform.OS === 'web' && d?.status === 'recording' && d.lastActiveAt && at - d.lastActiveAt > 30000) {
        stopWatch();
        updateDraft({ ...d, status: 'paused', elapsedBeforeMs: elapsedMs(d, d.lastActiveAt), activeSince: null });
        setNotice('Gravação pausada após suspensão do computador. Toque em Continuar.');
        return;
      }
      // Mantém o tempo recuperável mesmo que o app seja interrompido inesperadamente.
      if (d?.status === 'recording' && at - (d.lastActiveAt ?? 0) >= 5000) {
        updateDraft({ ...d, lastActiveAt: at });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [stopWatch, updateDraft]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const hidden = () => {
      if (document.hidden && draftRef.current?.status === 'recording') {
        pause(); setNotice('Gravação pausada ao ocultar a página. Toque em Continuar para retomar.');
      }
    };
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', pause);
    return () => { document.removeEventListener('visibilitychange', hidden); window.removeEventListener('pagehide', pause); };
  }, [pause]);

  const centerOnMe = useCallback(async () => {
    setLocating(true);
    setError('');
    try {
      const access = await Location.requestForegroundPermissionsAsync();
      if (!mountedRef.current) return;
      setPermission(access.granted);
      if (!access.granted) {
        setError('Permita acesso à localização nas configurações do aparelho para centralizar o mapa.');
        return;
      }
      const sample = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      if (!mountedRef.current) return;
      const point = asPoint(sample, 0);
      setLastFix(point);
      moveTo(point, 0.006);
      followRef.current = true;
      setFollow(true);
    } catch (e) { if (mountedRef.current) setError('Não consegui obter sua posição: ' + String(e)); }
    finally { if (mountedRef.current) setLocating(false); }
  }, [moveTo]);

  const startGps = useCallback(async () => {
    if (attemptRef.current || watchRef.current) return;
    const original = draftRef.current;
    if (!original || original.status !== 'paused' || original.source === 'manual') return;
    attemptRef.current = true;
    setStarting(true);
    setError('');
    setNotice('');
    previousFixRef.current = null;
    speedWindowRef.current = [];
    setLiveSpeed(null);
    const generation = ++gpsGeneration.current;
    try {
      const access = await Location.requestForegroundPermissionsAsync();
      if (!mountedRef.current || generation !== gpsGeneration.current) return;
      setPermission(access.granted);
      if (!access.granted) {
        setError('Autorize a localização precisa para gravar uma trilha.');
        return;
      }
      const current = draftRef.current;
      if (!current || current.status !== 'paused') return;
      const at = Date.now();
      updateDraft({ ...current, status: 'recording', activeSince: at, lastActiveAt: at,
        segmentNumber: current.points.length ? current.segmentNumber + 1 : 0 });
      followRef.current = true;
      setFollow(true);

      const handleLocation = (sample: Location.LocationObject) => {
        if (!mountedRef.current || generation !== gpsGeneration.current) return;
        const draftNow = draftRef.current;
        if (!draftNow || draftNow.status !== 'recording') return;
        const raw = asPoint(sample, draftNow.segmentNumber);
        if (Date.now() - raw.recordedAt > 15000 || raw.recordedAt < draftNow.startedAt) return;
        if (previousFixRef.current && raw.recordedAt <= previousFixRef.current.recordedAt) return;
        speedWindowRef.current = speedWindowRef.current.filter(p => raw.recordedAt - p.recordedAt <= 6000 && p.segment === raw.segment);
        setLiveSpeed(currentSpeedKmh(speedWindowRef.current[0] ?? null, raw, Date.now()));
        speedWindowRef.current.push(raw);
        previousFixRef.current = raw;
        setLastFix(raw); // A leitura visível independe de gravar um novo ponto horizontal.
        if (followRef.current) moveTo(raw, 0.006);
        const last = draftNow.points[draftNow.points.length - 1];
        const point = last && last.segment === raw.segment && raw.recordedAt - last.recordedAt > 60000
          ? { ...raw, segment: raw.segment + 1 } : raw;
        const acceptedPoint = canAcceptPoint(last, point);
        const segment = acceptedPoint ? point.segment : draftNow.segmentNumber;
        const lastSample = draftNow.altitudeSamples?.[draftNow.altitudeSamples.length - 1];
        // Grava altitude mesmo sem movimento horizontal. A altitude é um fluxo separado.
        const alt = readableAltitude(raw);
        const fresh = !lastSample || (raw.recordedAt > lastSample.recordedAt && raw.recordedAt - lastSample.recordedAt >= 1500);
        const altitudeSample: AltitudeSample | null = alt != null && fresh ? {
          altitudeMeters: alt,
          altitudeAccuracyMeters: raw.altitudeAccuracyMeters ?? null,
          recordedAt: raw.recordedAt,
          segment,
        } : null;
        if (!acceptedPoint && !altitudeSample) return;
        updateDraft({ ...draftNow,
          points: acceptedPoint ? [...draftNow.points, point] : draftNow.points,
          altitudeSamples: altitudeSample ? [...(draftNow.altitudeSamples ?? []), altitudeSample] : (draftNow.altitudeSamples ?? []),
          segmentNumber: segment,
          lastActiveAt: Date.now(),
        });
      };
      const watcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 0, timeInterval: 1000 },
        handleLocation,
        reason => { if (mountedRef.current && generation === gpsGeneration.current) { pause(); setError('Localização: ' + reason); } },
      );
      if (!mountedRef.current || generation !== gpsGeneration.current || draftRef.current?.status !== 'recording') {
        watcher.remove();
        return;
      }
      watchRef.current = watcher;
      // Alguns aparelhos demoram para receber a primeira leitura do observador.
      // Um ponto recente pode ser mostrado enquanto aguardamos o GPS, sem inventar o percurso.
      const known = await Location.getLastKnownPositionAsync({ maxAge: 10000, requiredAccuracy: 35 }).catch(() => null);
      if (known && generation === gpsGeneration.current) handleLocation(known);
    } catch (e) {
      if (generation === gpsGeneration.current) {
        pause();
        setError('Falha ao iniciar o GPS: ' + (e instanceof Error ? e.message : String(e)));
      }
    } finally {
      attemptRef.current = false;
      if (mountedRef.current) setStarting(false);
    }
  }, [moveTo, pause, updateDraft]);

  const startNew = (source: 'gps' | 'manual' = 'gps') => {
    if (loading || starting || draftRef.current) return;
    const at = Date.now();
    const newDraft: RouteDraft = {
      source,
      id: `rota-${at}-${Math.random().toString(36).slice(2, 9)}`, status: 'paused',
      startedAt: at, finishedAt: null, points: [], altitudeSamples: [], segmentNumber: 0,
      elapsedBeforeMs: 0, activeSince: null, lastActiveAt: null,
    };
    setSelected(null);
    setName('');
    setError(''); setNotice('');
    updateDraft(newDraft);
    if (source === 'gps') void startGps();
  };

  const finish = () => {
    pause();
    const current = draftRef.current;
    if (!current) return;
    if (current.points.length < 2) {
      setError('Ainda não há pontos suficientes para finalizar. Caminhe em área aberta até o GPS registrar pelo menos dois pontos.');
      return;
    }
    setError('');
    updateDraft({ ...current, status: 'review', activeSince: null, finishedAt: Date.now() });
  };

  const save = async () => {
    const current = draftRef.current;
    const trimmed = name.trim();
    if (!current || current.status !== 'review' || !current.finishedAt || saveRef.current) return;
    if (trimmed.length < 3 || trimmed.length > 80) {
      setError('Digite um nome para a rota com 3 a 80 caracteres.');
      return;
    }
    saveRef.current = true;
    setLoading(true);
    setError('');
    const stats = routeMetrics(current.points, current.altitudeSamples);
    const record: RecordedRoute = {
      id: current.id, name: trimmed, startedAt: current.startedAt, finishedAt: current.finishedAt,
      source: current.source ?? 'gps',
      durationMs: current.elapsedBeforeMs, points: current.points, altitudeSamples: current.altitudeSamples ?? [], ...stats,
    };
    try {
      await writeQueue.current;
      const next = await upsertSavedRoute(record);
      await removeDraft();
      draftRef.current = null;
      setDraftState(null);
      setRoutes(next);
      setSelected(record);
      setName('');
      setNotice('Rota salva neste aparelho. Você pode abri-la novamente na aba Mapa.');
    } catch (e) { setError((e instanceof Error ? e.message : 'Falha ao salvar.') + ' O rascunho foi mantido para tentar novamente.'); }
    finally { saveRef.current = false; setLoading(false); }
  };

  const discard = () => Alert.alert('Descartar esta gravação?', 'O trajeto ainda não salvo será apagado.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Descartar', style: 'destructive', onPress: () => {
      setLoading(true);
      pause();
      void (async () => {
        try {
          await writeQueue.current;
          await removeDraft();
          draftRef.current = null;
          setDraftState(null);
          setName('');
          setError('');
        } catch { setError('Não foi possível apagar o rascunho.'); }
        finally { setLoading(false); }
      })();
    } },
  ]);

  const eraseSaved = (route: RecordedRoute) => Alert.alert('Excluir trilha?', `Excluir "${route.name}" deste aparelho?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: () => {
      void (async () => {
        try {
          const updated = await deleteSavedRoute(route.id);
          setRoutes(updated);
          if (selected?.id === route.id) setSelected(null);
        } catch { setError('Não foi possível excluir a trilha.'); }
      })();
    } },
  ]);

  const focusRoute = (points: RoutePoint[]) => {
    if (!points.length) return;
    if (points.length === 1) moveTo(points[0], 0.006);
    else mapRef.current?.fitToCoordinates(points.map(position), {
      edgePadding: { top: 65, right: 45, bottom: 65, left: 45 }, animated: true,
    });
  };

  const points = draft?.points ?? selected?.points ?? [];
  const segments: LatLng[][] = [];
  let previousSegment: number | undefined;
  for (const point of points) {
    if (point.segment !== previousSegment) {
      segments.push([]);
      previousSegment = point.segment;
    }
    segments[segments.length - 1].push(position(point));
  }
  const metrics = draft ? routeMetrics(points, draft.altitudeSamples) : selected;
  const duration = draft ? elapsedMs(draft, now) : (selected?.durationMs ?? 0);
  const altitudeSamples = draft?.altitudeSamples ?? [];
  const liveAltitude = lastFix ? smoothLiveAltitude(altitudeSamples, lastFix) : null;
  const liveAltitudeIsTrusted = lastFix ? trustedAltitude(lastFix) != null : false;
  const altitudeCount = draft ? (metrics && 'trustedAltitudeCount' in metrics ? metrics.trustedAltitudeCount : 0) : null;
  const age = lastFix ? Math.max(0, Math.floor((now - lastFix.recordedAt) / 1000)) : null;
  const accuracy = lastFix?.accuracyMeters;
  const quality = !permission ? 'Sem permissão' : age === null ? 'Aguardando GPS' : age > 20 ? 'Sinal antigo' :
    accuracy == null ? 'GPS disponível' : accuracy <= 15 ? 'GPS bom' : accuracy <= 35 ? 'GPS razoável' : 'GPS impreciso';

  return <View style={styles.page}>
    <View style={styles.header}>
      <View><Text style={styles.heading}>{creating ? 'Sugerir nova rota' : 'Mapa de trilhas'}</Text><Text style={styles.subtitle}>Caminhos de Leopoldina</Text></View>
      <View style={styles.quality}><View style={[styles.dot, { backgroundColor: age !== null && age <= 20 && permission ? '#26985b' : '#e5a03a' }]} />
        <Text style={styles.qualityText}>{draft?.source === 'manual' ? 'Desenho manual' : quality}</Text></View>
    </View>
    <View style={[styles.mapContainer, { height: mapHeight }]}>
      <TrailMap ref={mapRef} initialRegion={INITIAL_REGION} segments={segments} points={points}
        current={lastFix ? position(lastFix) : null} showUserLocation={permission}
        editable={!loading && creating && draft?.source === 'manual' && draft.status !== 'review'}
        onPoint={point => {
          const d = draftRef.current;
          if (!d || d.source !== 'manual' || d.status === 'review') return;
          if (d.points.length >= 50000) { setError('Limite de pontos atingido. Finalize a rota.'); return; }
          updateDraft({ ...d, points: [...d.points, { ...point, recordedAt: Date.now(), segment: 0,
            altitudeMeters: null, altitudeAccuracyMeters: null, accuracyMeters: null }] });
        }}
        satellite={satellite} onMapReady={() => setMapReady(true)}
        onMapError={message => { setError(message); setMapReady(true); }}
        onPanDrag={() => { followRef.current = false; setFollow(false); }} />
      <View style={styles.mapTools}>
        <Pressable accessibilityRole="button" onPress={() => setSatellite(value => !value)} style={styles.tool}>
          <Feather name="layers" color={GREEN} size={19} /><Text style={styles.toolLabel}>{satellite ? 'Padrão' : 'Satélite'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={locating} onPress={() => void centerOnMe()} style={styles.tool}>
          {locating ? <ActivityIndicator size="small" color={GREEN} /> : <Feather name="crosshair" color={GREEN} size={19} />}
          <Text style={styles.toolLabel}>Minha posição</Text>
        </Pressable>
        {points.length > 0 && <Pressable accessibilityRole="button" onPress={() => {
          followRef.current = false; setFollow(false); focusRoute(points);
        }} style={styles.tool}><Feather name="maximize" color={GREEN} size={19} /><Text style={styles.toolLabel}>Ver percurso</Text></Pressable>}
        {draft?.status === 'recording' && !follow && <Pressable accessibilityRole="button" onPress={() => {
          followRef.current = true; setFollow(true);
          if (lastFix) moveTo(lastFix, 0.006);
        }} style={styles.tool}><Feather name="navigation" color={GREEN} size={19} /><Text style={styles.toolLabel}>Seguir GPS</Text></Pressable>}
      </View>
      {!mapReady && <View pointerEvents="none" style={styles.mapLoading}><ActivityIndicator color={GREEN} /><Text style={styles.mapLoadingText}>Carregando mapa...</Text></View>}
      <View pointerEvents="none" style={styles.mapBottom}>
        <Text style={styles.mapBottomText}>{draft?.status === 'recording' ? '● GRAVANDO TRAJETO' : draft?.status === 'paused' ? (draft.source === 'manual' ? 'MARQUE OS PONTOS NO MAPA' : 'II PAUSADO') :
          draft?.status === 'review' ? '✓ PRONTO PARA SALVAR' : 'Mapa interativo • Leopoldina/MG'}</Text>
      </View>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      {!!error && <View style={styles.error}><Feather name="alert-circle" color="#9b3328" size={17} /><Text style={styles.errorText}>{error}</Text></View>}
      {!!notice && <Text style={styles.notice}>{notice}</Text>}
      <View style={styles.row}>
        <Metric title="TEMPO DO PERCURSO" value={(draft?.source ?? selected?.source) === 'manual' ? 'Não medido' : formatDuration(duration)} />
        <Metric title="DISTÂNCIA" value={formatDistance(metrics?.distanceMeters ?? 0)} />
      </View>
      <View style={styles.row}>
        <Metric title="VELOCIDADE ATUAL" value={draft?.source !== 'manual' && draft?.status === 'recording' && age !== null && age <= 15 ? formatSpeed(liveSpeed) : '—'} extra="Aproximada · localização do aparelho" />
        <Metric title="VELOCIDADE MÉDIA" value={(draft?.source ?? selected?.source) === 'manual' ? '—' : formatSpeed(averageSpeedKmh(metrics?.distanceMeters ?? 0, duration))} extra="Distância ÷ tempo ativo" />
      </View>
      <View style={styles.row}>
        <Metric title="ALTITUDE ATUAL" value={liveAltitude == null || age === null || age > 20 ? '—' : `${liveAltitudeIsTrusted ? '' : '≈'}${Math.round(liveAltitude)} m`}
          extra={age !== null && age <= 20 ? (
            lastFix?.altitudeAccuracyMeters == null ? 'Precisão vertical não informada' :
            lastFix.altitudeAccuracyMeters <= 0 ? 'Altitude inválida pelo GPS' :
            `Precisão vertical ±${Math.round(lastFix.altitudeAccuracyMeters)} m${lastFix.altitudeAccuracyMeters > MAX_ALTITUDE_UNCERTAINTY_METERS ? ' (baixa)' : ''}`
          ) : 'Aguardando altitude recente'} />
        <Metric title="ALTITUDE MÍNIMA" value={metrics?.minAltitudeMeters == null ? '—' : `≈${Math.round(metrics.minAltitudeMeters)} m`} />
        <Metric title="ALTITUDE MÁXIMA" value={metrics?.maxAltitudeMeters == null ? '—' : `≈${Math.round(metrics.maxAltitudeMeters)} m`} />
      </View>
      <Text style={styles.gpsInfo}>GPS: {lastFix ? `${age ?? 0}s desde a leitura · precisão horizontal ${accuracy == null ? 'indisponível' : `±${Math.round(accuracy)} m`}` : 'Aguardando a primeira leitura'} · {points.length} pontos no mapa{draft ? ` · ${altitudeSamples.length} leituras verticais (${altitudeCount ?? 0} confiáveis)` : ''}</Text>
      {draft && draft.source !== 'manual' && metrics?.minAltitudeMeters == null && <Text style={styles.altitudeHint}>Para calcular mínima e máxima, aguarde pelo menos 3 leituras de altitude com precisão vertical de até ±{MAX_ALTITUDE_UNCERTAINTY_METERS} m. Permita Localização Precisa e teste ao ar livre.</Text>}
      {draft?.status === 'recording' && <Text style={styles.recording}>● Gravação ativa — mantenha o aplicativo em primeiro plano.</Text>}
      {draft?.status === 'paused' && draft.source !== 'manual' && <Text style={styles.paused}>Gravação pausada — o tempo não está contando.</Text>}
      {!draft && creating && <View style={styles.row}>
        <Action label={loading ? 'Carregando...' : 'Gravar meu percurso'} icon="play-circle" disabled={loading || starting} onPress={() => startNew('gps')} />
        {Platform.OS === 'web' && <Action label="Desenhar no mapa" icon="edit-3" secondary disabled={loading || starting} onPress={() => startNew('manual')} />}
      </View>}
      {!creating && <Action label="Sugerir nova rota" icon="plus-circle" onPress={() => router.push('/(tabs)/suggest')} />}
      {draft?.source === 'manual' && draft.status !== 'review' && <View style={styles.saveCard}>
        <Text style={styles.hint}>Clique no mapa para adicionar os pontos na ordem do caminho. Arraste para mover o mapa. A distância é a soma das linhas entre os pontos; tempo e altitude não são medidos.</Text>
        <View style={styles.row}>
          <Action label="Desfazer ponto" icon="corner-up-left" secondary disabled={!draft.points.length} onPress={() => {
            const d = draftRef.current; if (d) updateDraft({ ...d, points: d.points.slice(0, -1) });
          }} />
          <Action label="Finalizar desenho" icon="check-circle" disabled={draft.points.length < 2} onPress={finish} />
        </View>
      </View>}
      {draft?.status === 'recording' && <View style={styles.row}>
        <Action label="Pausar" icon="pause" secondary onPress={pause} />
        <Action label="Finalizar" icon="check-circle" onPress={finish} />
      </View>}
      {draft?.status === 'paused' && draft.source !== 'manual' && <View style={styles.row}>
        <Action label={starting ? 'Iniciando GPS...' : 'Continuar'} icon="play" disabled={starting} onPress={() => void startGps()} />
        <Action label="Finalizar" icon="check-circle" disabled={starting} secondary onPress={finish} />
      </View>}
      {draft?.status === 'review' && <View style={styles.saveCard}>
        <Text style={styles.saveTitle}>Salvar percurso</Text>
        <Text style={styles.hint}>Confira o percurso e escolha um nome. A rota fica salva neste aparelho.</Text>
        <TextInput style={styles.input} placeholder="Nome da trilha (ex.: Trilha do Cruzeiro)" placeholderTextColor="#809388"
          editable={!loading} value={name} onChangeText={value => { setName(value); const d = draftRef.current; if (d) updateDraft({ ...d, name: value }); }} maxLength={80} autoCapitalize="sentences" />
        <Action label={loading ? 'Salvando...' : 'Salvar rota'} icon="save" disabled={loading} onPress={() => void save()} />
      </View>}
      {draft && <Action label="Descartar gravação" icon="trash-2" disabled={starting || loading} secondary onPress={discard} />}
      <Text style={styles.warning}>{Platform.OS === 'web'
        ? 'No notebook ou desktop, permita a localização e mantenha a página visível e o computador acordado durante o deslocamento. Use HTTPS ou localhost. Leituras com erro acima de 35 m não entram no percurso; se a localização não for precisa, use Desenhar no mapa. A altitude pode não estar disponível.'
        : 'Altitude medida pelo GPS: valores aproximados. Mantenha o aplicativo aberto; ao bloquear a tela ou trocar de app, a gravação é pausada. O mapa precisa de internet.'}</Text>
      <Text style={styles.listTitle}>{creating ? 'Minhas rotas salvas' : 'Rotas deste aparelho'} ({routes.length})</Text>
      {!routes.length && <Text style={styles.empty}>As trilhas finalizadas aparecerão aqui com o nome, distância, tempo e traçado.</Text>}
      {routes.map(route => <View key={route.id} style={styles.savedRow}>
        <Pressable style={{ flex: 1 }} accessibilityRole="button" onPress={() => {
          if (draft) { setError('Finalize ou descarte o percurso atual para abrir outra trilha.'); return; }
          setSelected(route);
          requestAnimationFrame(() => focusRoute(route.points));
        }}>
          <Text style={styles.savedName}>{route.name}</Text>
          <Text style={styles.savedDescription}>{formatDistance(route.distanceMeters)} · {route.source === 'manual' ? 'Desenhada no mapa' : `${formatDuration(route.durationMs)} · Média ${formatSpeed(averageSpeedKmh(route.distanceMeters, route.durationMs))}`} · Salva neste aparelho</Text>
          <Text style={styles.savedDate}>{new Date(route.finishedAt).toLocaleDateString('pt-BR')} · Toque para ver o trajeto</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Excluir ${route.name}`} onPress={() => eraseSaved(route)} style={styles.delete}>
          <Feather name="trash-2" size={19} color="#96564d" />
        </Pressable>
      </View>)}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 18, backgroundColor: '#1a3d2b', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { fontSize: 21, fontWeight: '800', color: '#ffffff' },
  subtitle: { fontSize: 12, color: '#d1d5db', marginTop: 1 },
  quality: { backgroundColor: '#ecf4ed', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 }, qualityText: { fontSize: 11, color: '#365944', fontWeight: '600' },
  mapContainer: { width: '100%', backgroundColor: '#dce6e2', position: 'relative', overflow: 'hidden' },
  map: { width: '100%', height: '100%' },
  mapTools: { position: 'absolute', right: 12, top: 12, alignItems: 'flex-end', gap: 8 },
  tool: { backgroundColor: 'white', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 7, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  toolLabel: { fontWeight: '700', fontSize: 12, color: GREEN },
  mapLoading: { position: 'absolute', top: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 7, padding: 8, backgroundColor: '#f6faf6', borderRadius: 8 },
  mapLoadingText: { fontSize: 12, color: GREEN },
  mapBottom: { position: 'absolute', bottom: 10, left: 10, backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 7 },
  mapBottomText: { fontSize: 11, fontWeight: '700', color: GREEN },
  content: { padding: 16, gap: 10, paddingBottom: 38, width: '100%', maxWidth: 1100, alignSelf: 'center' },
  row: { flexDirection: 'row', gap: 8 },
  metric: { flex: 1, minWidth: 0, backgroundColor: 'white', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 9, borderWidth: 1, borderColor: '#e5eae5' },
  metricTitle: { fontSize: 9, fontWeight: '700', color: '#667f70' },
  metricValue: { color: '#18422b', fontWeight: '800', fontSize: 19, marginTop: 4 },
  metricExtra: { color: '#7f9187', fontSize: 10, marginTop: 2 },
  gpsInfo: { color: '#5d7765', fontSize: 11 },
  altitudeHint: { color: '#806129', backgroundColor: '#fff6de', borderRadius: 8, padding: 8, fontSize: 11, lineHeight: 16 },
  recording: { fontWeight: '700', color: '#b33527', fontSize: 13 },
  paused: { fontWeight: '700', color: '#9a641e', fontSize: 13 },
  action: { flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', minHeight: 47, borderRadius: 9, backgroundColor: GREEN, paddingHorizontal: 12, paddingVertical: 11 },
  actionLabel: { color: 'white', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  actionOutline: { backgroundColor: 'white', borderColor: GREEN, borderWidth: 1 },
  actionOutlineLabel: { color: GREEN }, disabled: { opacity: 0.45 },
  saveCard: { padding: 12, backgroundColor: 'white', borderRadius: 11, gap: 10 },
  saveTitle: { color: '#1c4832', fontSize: 16, fontWeight: '800' },
  hint: { color: '#627c6f', fontSize: 12 },
  input: { color: '#183d2a', borderWidth: 1, borderColor: '#c5d4c8', backgroundColor: '#f9fcf9', borderRadius: 9, minHeight: 48, padding: 11, fontSize: 14 },
  warning: { color: '#687b70', fontSize: 11, lineHeight: 17 },
  error: { backgroundColor: '#fff0ec', borderRadius: 8, padding: 10, flexDirection: 'row', gap: 7, alignItems: 'center' },
  errorText: { color: '#9b3328', flex: 1, fontSize: 12 },
  notice: { backgroundColor: '#e8f2f9', color: '#315d7c', borderRadius: 7, padding: 9, fontSize: 12 },
  listTitle: { color: '#1d4632', fontWeight: '800', fontSize: 16, marginTop: 4 },
  empty: { color: '#7a8c80', fontSize: 12, paddingBottom: 5 },
  savedRow: { flexDirection: 'row', padding: 12, borderRadius: 10, backgroundColor: 'white', alignItems: 'center', borderWidth: 1, borderColor: '#e6ece6' },
  savedName: { color: '#244a33', fontWeight: '800', fontSize: 14 },
  savedDescription: { color: '#4b6f54', marginTop: 4, fontSize: 12 },
  savedDate: { color: '#7c9385', marginTop: 3, fontSize: 11 },
  delete: { padding: 10 },
});
