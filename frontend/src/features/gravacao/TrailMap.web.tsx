import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { HTML } from './mapHtml';
import type { Props, TrailMapHandle } from './TrailMap';
const TrailMap = forwardRef<TrailMapHandle, Props>(function TrailMap(props, ref) {
  const frame = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);
  const latest = useRef(props); latest.current = props;
  const pending = useRef<Record<string, unknown> | null>(null);
  const send = useCallback((command: Record<string, unknown>) => {
    if (ready.current) frame.current?.contentWindow?.postMessage({ channel: 'caminhos-command', command }, '*');
  }, []);
  const sync = useCallback(() => {
    const p = latest.current;
    send({ type: 'data', segments: p.segments, current: p.current, showPosition: p.showUserLocation });
    send({ type: 'mode', value: p.satellite ? 'satellite' : 'standard' });
    send({ type: 'editing', value: p.editable });
  }, [send]);
  useEffect(() => { sync(); }, [props.segments, props.current, props.showUserLocation, props.satellite, props.editable, sync]);
  useEffect(() => {
    const receive = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || e.data?.channel !== 'caminhos-map') return;
      const p = latest.current;
      switch (e.data.type) {
        case 'ready': ready.current = true; sync();
          send(pending.current ?? { type: 'center', latitude: p.initialRegion.latitude, longitude: p.initialRegion.longitude });
          p.onMapReady(); break;
        case 'drag': p.onPanDrag(); break;
        case 'point': if (p.editable && Number.isFinite(e.data.detail?.latitude) && Number.isFinite(e.data.detail?.longitude)) p.onPoint?.(e.data.detail); break;
        case 'tilesError': case 'error': p.onMapError(String(e.data.detail)); break;
      }
    };
    window.addEventListener('message', receive);
    return () => { window.removeEventListener('message', receive); ready.current = false; };
  }, [send, sync]);
  useImperativeHandle(ref, () => ({
    animateToRegion: region => { pending.current = { type: 'center', latitude: region.latitude, longitude: region.longitude, zoom: region.latitudeDelta <= .007 ? 16 : 14 }; send(pending.current); },
    fitToCoordinates: coords => { pending.current = { type: 'fit', coords }; send(pending.current); },
  }), [send]);
  return React.createElement('iframe', { ref: frame, title: 'Mapa interativo de rotas de Leopoldina', srcDoc: HTML,
    onLoad: () => frame.current?.contentWindow?.postMessage({ channel: 'caminhos-command', command: { type: 'ping' } }, '*'),
    sandbox: 'allow-scripts', style: { width: '100%', height: '100%', border: 0, display: 'block' } });
});
export default TrailMap;
