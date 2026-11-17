import { HTML } from './mapHtml';
/**
 * Mapa da gravação: Apple Maps nativo no iOS; OpenStreetMap no Android.
 * O Android usa uma WebView com renderização própria de tiles porque o Expo Go
 * SDK 57 pode exibir a superfície preta do Google Maps mesmo com GPS ativo.
 * Somente a VISUALIZAÇÃO muda: a coleta de pontos segue no expo-location.
 */
import React, {
  forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef,
} from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, type LatLng, type Region } from 'react-native-maps';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { RoutePoint } from './types';

export type TrailMapHandle = {
  animateToRegion: (region: Region, duration?: number) => void;
  fitToCoordinates: (coords: LatLng[], options?: { edgePadding?: { top: number; right: number; bottom: number; left: number }; animated?: boolean }) => void;
};

export type Props = {
  editable?: boolean;
  onPoint?: (point: LatLng) => void;
  initialRegion: Region;
  segments: LatLng[][];
  points: RoutePoint[];
  current: LatLng | null;
  showUserLocation: boolean;
  satellite: boolean;
  onMapReady: () => void;
  onPanDrag: () => void;
  onMapError: (message: string) => void;
};

// JS do mapa fica embutido: não depende de CDN de bibliotecas, apenas da
// conexão para carregar os mosaicos do OSM/Esri visualizados pelo usuário.


const WEB_SOURCE = { html: HTML, baseUrl: 'https://localhost/' };

const TrailMap = forwardRef<TrailMapHandle, Props>(function TrailMap({
  initialRegion, segments, points, current, showUserLocation, satellite,
  onMapReady, onPanDrag, onMapError,
}, ref) {
  const nativeRef = useRef<MapView>(null);
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);
  const pendingCommand = useRef<Record<string, unknown> | null>(null);
  const isAndroid = Platform.OS === 'android';

  const send = useCallback((command: Record<string, unknown>) => {
    if (!readyRef.current || !webRef.current) return;
    // JSON.stringify evita montar JavaScript com valores não escapados.
    webRef.current.injectJavaScript(`window.__routeMapCommand(${JSON.stringify(command)}); true;`);
  }, []);

  const serialSegments = useMemo(() => segments.map(s => s.map(p => ({ latitude: p.latitude, longitude: p.longitude }))), [segments]);

  useEffect(() => {
    if (!isAndroid) return;
    send({ type: 'data', segments: serialSegments, current, showPosition: showUserLocation });
  }, [serialSegments, current, showUserLocation, isAndroid, send]);

  useEffect(() => { if (isAndroid) send({ type: 'mode', value: satellite ? 'satellite' : 'standard' }); }, [isAndroid, satellite, send]);

  useImperativeHandle(ref, () => ({
    animateToRegion: region => {
      if (isAndroid) {
        const command = { type: 'center', latitude: region.latitude, longitude: region.longitude, zoom: region.latitudeDelta <= 0.007 ? 16 : 14 };
        pendingCommand.current = command;
        send(command);
      } else nativeRef.current?.animateToRegion(region, 450);
    },
    fitToCoordinates: (coords, options) => {
      if (isAndroid) {
        const command = { type: 'fit', coords };
        pendingCommand.current = command;
        send(command);
      } else nativeRef.current?.fitToCoordinates(coords, options);
    },
  }), [isAndroid, send]);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as { type: string; detail?: string };
      if (message.type === 'ready') {
        readyRef.current = true;
        send({ type: 'data', segments: serialSegments, current, showPosition: showUserLocation });
        send({ type: 'mode', value: satellite ? 'satellite' : 'standard' });
        if (pendingCommand.current) send(pendingCommand.current);
        onMapReady();
      } else if (message.type === 'drag') onPanDrag();
      else if (message.type === 'tilesError' || message.type === 'error') onMapError(message.detail || 'Falha ao carregar os mapas.');
    } catch { onMapError('Falha ao interpretar uma resposta do mapa.'); }
  }, [serialSegments, current, showUserLocation, satellite, onMapReady, onPanDrag, onMapError, send]);

  if (isAndroid) {
    return <View style={styles.fill}>
      <WebView
        ref={webRef}
        style={styles.fill}
        source={WEB_SOURCE}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        applicationNameForUserAgent="CaminhosDeLeopoldina/1.0"
        onMessage={handleMessage}
        onError={event => onMapError('Não foi possível abrir o mapa: ' + event.nativeEvent.description)}
        scrollEnabled={false}
        setSupportMultipleWindows={false}
      />
    </View>;
  }

  return <MapView
    ref={nativeRef} style={styles.fill} mapType={satellite ? 'satellite' : 'standard'}
    initialRegion={initialRegion} showsCompass showsScale showsUserLocation={showUserLocation}
    onMapReady={onMapReady} onPanDrag={onPanDrag}
  >
    {segments.map((segment, index) => segment.length > 1
      ? <Polyline key={`segment-${index}`} coordinates={segment} strokeColor="#157047" strokeWidth={5} /> : null)}
    {points.length > 0 && <Marker coordinate={points[0]} title="Início da trilha" pinColor="green" />}
    {points.length > 1 && <Marker coordinate={points[points.length - 1]} title="Último ponto gravado" pinColor="red" />}
  </MapView>;
});

export default TrailMap;
const styles = StyleSheet.create({ fill: { width: '100%', height: '100%', flex: 1, backgroundColor: '#e3ece5' } });
