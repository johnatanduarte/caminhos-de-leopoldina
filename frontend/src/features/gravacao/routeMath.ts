import type { RoutePoint, AltitudeSample } from './types';

const EARTH_RADIUS = 6371000;
const rad = (degrees: number) => degrees * Math.PI / 180;

export function distanceMeters(a: Pick<RoutePoint, 'latitude' | 'longitude'>, b: Pick<RoutePoint, 'latitude' | 'longitude'>): number {
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Considera a incerteza horizontal, o intervalo entre amostras e mudanças de segmento. */
export function canAcceptPoint(previous: RoutePoint | undefined, next: RoutePoint): boolean {
  if (!Number.isFinite(next.latitude) || !Number.isFinite(next.longitude) ||
      Math.abs(next.latitude) > 90 || Math.abs(next.longitude) > 180 || !Number.isFinite(next.recordedAt)) return false;
  if (next.accuracyMeters !== null && (!Number.isFinite(next.accuracyMeters) || next.accuracyMeters < 0 || next.accuracyMeters > 35)) return false;
  if (!previous) return true;
  if (next.recordedAt <= previous.recordedAt) return false;
  if (next.segment !== previous.segment) return true;
  const dt = (next.recordedAt - previous.recordedAt) / 1000;
  const meters = distanceMeters(previous, next);
  const uncertainty = ((previous.accuracyMeters ?? 15) + (next.accuracyMeters ?? 15)) * 0.33;
  if (meters < Math.max(5, Math.min(18, uncertainty))) return false;
  // Trilhas a pé e bicicleta. Evita saltos de localização impossíveis (>90 km/h).
  return meters / dt <= 25;
}

// Critério prudente para extremos da trilha: precisão vertical positiva e <= 50 m.
// No iOS, precisão vertical zero ou negativa indica leitura inválida.
export const MAX_ALTITUDE_UNCERTAINTY_METERS = 50;

type AltitudeReading = Pick<RoutePoint, 'altitudeMeters' | 'altitudeAccuracyMeters' | 'recordedAt' | 'segment'>;

export function readableAltitude(reading: Pick<RoutePoint, 'altitudeMeters' | 'altitudeAccuracyMeters'>): number | null {
  const value = reading.altitudeMeters;
  if (value == null || !Number.isFinite(value) || value < -500 || value > 9000) return null;
  const uncertainty = reading.altitudeAccuracyMeters;
  if (uncertainty != null && (!Number.isFinite(uncertainty) || uncertainty <= 0)) return null;
  return value;
}

/** Altitude considerada apropriada para calcular mínimo/máximo (sempre aproximados). */
export function trustedAltitude(reading: Pick<RoutePoint, 'altitudeMeters' | 'altitudeAccuracyMeters'>): number | null {
  const alt = readableAltitude(reading);
  const uncertainty = reading.altitudeAccuracyMeters;
  return alt != null && uncertainty != null && uncertainty <= MAX_ALTITUDE_UNCERTAINTY_METERS ? alt : null;
}

function median(items: number[]): number {
  const values = [...items].sort((a, b) => a - b);
  const midpoint = Math.floor(values.length / 2);
  return values.length % 2 ? values[midpoint] : (values[midpoint - 1] + values[midpoint]) / 2;
}

/**
 * Suaviza leituras verticais independentes do deslocamento. O mínimo e máximo só
 * mudam depois de >=3 leituras verticais confiáveis, para atenuar picos isolados.
 */
export function altitudeMetrics(samples: AltitudeReading[]) {
  let minAltitudeMeters: number | null = null;
  let maxAltitudeMeters: number | null = null;
  let trustedCount = 0;
  let lastWindow: { value: number; recordedAt: number; segment: number }[] = [];
  for (const sample of samples) {
    const alt = trustedAltitude(sample);
    if (alt === null || !Number.isFinite(sample.recordedAt)) continue;
    trustedCount++;
    const previous = lastWindow[lastWindow.length - 1];
    if (previous && (sample.segment !== previous.segment || sample.recordedAt <= previous.recordedAt ||
        sample.recordedAt - previous.recordedAt > 30000)) lastWindow = [];
    lastWindow.push({ value: alt, recordedAt: sample.recordedAt, segment: sample.segment });
    if (lastWindow.length > 5) lastWindow.shift();
    if (lastWindow.length < 3) continue;
    const filtered = median(lastWindow.map(item => item.value));
    minAltitudeMeters = minAltitudeMeters == null ? filtered : Math.min(minAltitudeMeters, filtered);
    maxAltitudeMeters = maxAltitudeMeters == null ? filtered : Math.max(maxAltitudeMeters, filtered);
  }
  return { minAltitudeMeters, maxAltitudeMeters, trustedAltitudeCount: trustedCount };
}

/** Altitude recente suavizada para apresentação, se houver >= 3 leituras úteis. */
export function smoothLiveAltitude(samples: AltitudeReading[], latest: AltitudeReading): number | null {
  const alt = readableAltitude(latest);
  if (alt === null) return null;
  if (trustedAltitude(latest) === null) return alt; // Mostra a leitura, mas com aviso de incerteza na tela.
  const recent = samples.filter(sample =>
    sample.segment === latest.segment &&
    latest.recordedAt - sample.recordedAt >= 0 &&
    latest.recordedAt - sample.recordedAt <= 15000 && trustedAltitude(sample) !== null,
  ).slice(-5).map(sample => sample.altitudeMeters as number);
  if (recent.length < 3) return alt;
  return median(recent);
}

export function routeMetrics(points: RoutePoint[], altitudeSamples?: AltitudeSample[]) {
  let distanceMetersTotal = 0;
  for (let index = 1; index < points.length; index++) {
    if (points[index].segment === points[index - 1].segment) {
      distanceMetersTotal += distanceMeters(points[index - 1], points[index]);
    }
  }
  return { distanceMeters: distanceMetersTotal, ...altitudeMetrics(altitudeSamples ?? points) };
}

export function elapsedMs(draft: { elapsedBeforeMs: number; status: string; activeSince: number | null }, at: number) {
  return draft.elapsedBeforeMs + (draft.status === 'recording' && draft.activeSince !== null ? Math.max(0, at - draft.activeSince) : 0);
}

export function formatDuration(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds % 3600 / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
export function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;
}

/** Velocidade aproximada em km/h; null indica leitura ausente ou pouco confiável. */
export function currentSpeedKmh(previous: RoutePoint | null, next: RoutePoint, at: number): number | null {
  if (!Number.isFinite(next.recordedAt) || at - next.recordedAt > 15000 || next.recordedAt > at + 1000 ||
      next.accuracyMeters == null || !Number.isFinite(next.accuracyMeters) || next.accuracyMeters < 0 || next.accuracyMeters > 35 ||
      !Number.isFinite(next.latitude) || Math.abs(next.latitude) > 90 || !Number.isFinite(next.longitude) || Math.abs(next.longitude) > 180) return null;
  const speed = next.speedMetersPerSecond;
  if (speed != null && Number.isFinite(speed) && speed >= 0 && speed <= 25) return speed * 3.6;
  if (!previous || previous.segment !== next.segment || previous.accuracyMeters == null ||
      !Number.isFinite(previous.accuracyMeters) || previous.accuracyMeters < 0 || previous.accuracyMeters > 35) return null;
  const seconds = (next.recordedAt - previous.recordedAt) / 1000;
  if (seconds < 1 || seconds > 20) return null;
  const meters = distanceMeters(previous, next);
  if (!Number.isFinite(meters) || meters / seconds > 25) return null;
  const noise = Math.max(3, Math.min(10, (previous.accuracyMeters + next.accuracyMeters) * .25));
  return meters < noise ? 0 : meters / seconds * 3.6;
}
export function averageSpeedKmh(distance: number, durationMs: number): number | null {
  return Number.isFinite(distance) && distance >= 0 && Number.isFinite(durationMs) && durationMs > 0 ? distance / durationMs * 3600 : null;
}
export function formatSpeed(kmh: number | null): string {
  return kmh == null || !Number.isFinite(kmh) ? '—' : `${kmh.toFixed(1).replace('.', ',')} km/h`;
}
