/** Coordenadas obtidas do GPS real; null representa leitura indisponível. */
export type RoutePoint = {
  latitude: number;
  longitude: number;
  speedMetersPerSecond?: number | null;
  altitudeMeters: number | null;
  altitudeAccuracyMeters?: number | null;
  accuracyMeters: number | null;
  recordedAt: number;
  segment: number;
};

/** Leituras verticais independentes dos pontos usados no desenho da trilha. */
export type AltitudeSample = {
  altitudeMeters: number;
  altitudeAccuracyMeters: number | null;
  recordedAt: number;
  segment: number;
};

export type RouteDraft = {
  id: string;
  source?: 'gps' | 'manual';
  name?: string;
  status: 'recording' | 'paused' | 'review';
  startedAt: number;
  finishedAt: number | null;
  points: RoutePoint[];
  altitudeSamples?: AltitudeSample[];
  segmentNumber: number;
  elapsedBeforeMs: number;
  activeSince: number | null;
  lastActiveAt: number | null;
};

export type RecordedRoute = {
  source?: 'gps' | 'manual';
  id: string;
  name: string;
  startedAt: number;
  finishedAt: number;
  durationMs: number;
  distanceMeters: number;
  minAltitudeMeters: number | null;
  maxAltitudeMeters: number | null;
  points: RoutePoint[];
  altitudeSamples?: AltitudeSample[];
};
