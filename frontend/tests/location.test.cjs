const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(file, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '../src/features/gravacao', file), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(js, { exports, ...globals });
  return exports;
}
test('localização web acompanha movimento, preserva altitude ausente e libera observador', async () => {
  let receive, options, removed;
  const geo = { watchPosition: (ok, _error, config) => { receive = ok; options = config; return 42; }, clearWatch: id => { removed = id; } };
  const location = load('location.web.ts', { window: { isSecureContext: true }, navigator: { geolocation: geo } });
  const points = [];
  const subscription = await location.watchPositionAsync({}, p => points.push(p));
  for (const latitude of [-21.531, -21.5309]) receive({ timestamp: Date.now(), coords: { latitude, longitude: -42.642, accuracy: 8, altitude: null, altitudeAccuracy: null, heading: null, speed: null } });
  assert.equal(points.length, 2); assert.equal(points[0].coords.altitude, null);
  assert.equal(options.enableHighAccuracy, true); assert.equal(options.maximumAge, 0);
  subscription.remove(); assert.equal(removed, 42);
});
test('HTTP inseguro e permissão negada retornam orientação sem inventar posição', async () => {
  const insecure = load('location.web.ts', { window: { isSecureContext: false }, navigator: {} });
  await assert.rejects(insecure.getCurrentPositionAsync(), /HTTPS/);
  const blocked = load('location.web.ts', { window: { isSecureContext: true }, navigator: { geolocation: { getCurrentPosition: (_ok, error) => error({ code: 1 }) } } });
  await assert.rejects(blocked.getCurrentPositionAsync(), /bloqueada/);
});
test('localização indisponível ou timeout retorna mensagem e permite alternativa manual', async () => {
  for (const code of [2, 3]) {
    const location = load('location.web.ts', { window: { isSecureContext: true }, navigator: { geolocation: { getCurrentPosition: (_ok, error) => error({ code }) } } });
    await assert.rejects(location.getCurrentPositionAsync(), /desenhe no mapa/);
  }
});
test('precisão baixa e saltos são rejeitados; pausa não soma trecho entre segmentos', () => {
  const math = load('routeMath.ts');
  const a = { latitude: -21.531, longitude: -42.642, recordedAt: 10000, segment: 0, altitudeMeters: null, accuracyMeters: 8 };
  const b = { ...a, latitude: -21.5309, recordedAt: 20000 };
  assert.equal(math.canAcceptPoint(a, b), true);
  assert.equal(math.canAcceptPoint(a, { ...b, accuracyMeters: 100 }), false);
  assert.equal(math.canAcceptPoint(a, { ...b, latitude: -20 }), false);
  assert.equal(math.routeMetrics([a, { ...b, segment: 1 }]).distanceMeters, 0);
  assert.equal(math.elapsedMs({ status: 'paused', elapsedBeforeMs: 5000, activeSince: null }, 999999), 5000);
});
test('mapa web desenha percurso e só aceita cliques quando edição está habilitada', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/features/gravacao/mapHtml.ts'), 'utf8');
  const script = source.match(/<script>([\s\S]*?)<\/script>/)[1];
  const nodes = new Map(); const events = {}; const messages = [];
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, { style: {}, clientWidth: 800, clientHeight: 400, innerHTML: '',
      addEventListener: (type, callback) => { events[id + ':' + type] = callback; },
      getBoundingClientRect: () => ({ left: 0, top: 0 }), appendChild: () => {}, setAttribute: () => {}, remove: () => {} });
    return nodes.get(id);
  };
  const parent = { postMessage: m => messages.push(m) };
  const window = { parent, addEventListener: (type, callback) => { events['window:' + type] = callback; } };
  vm.runInNewContext(script, { window, document: { getElementById: node, createElement: () => ({ style: {}, remove: () => {} }) }, Math, Number });
  assert.ok(messages.some(m => m.type === 'ready'));
  const command = c => events['window:message']({ source: parent, data: { channel: 'caminhos-command', command: c } });
  const click = () => { events['map:mousedown']({ target: { tagName: 'DIV' }, clientX: 400, clientY: 200 }); events['map:click']({ target: { tagName: 'DIV' }, clientX: 400, clientY: 200 }); };
  click(); assert.equal(messages.filter(m => m.type === 'point').length, 0);
  command({ type: 'editing', value: true }); click();
  const point = messages.find(m => m.type === 'point').detail;
  assert.ok(Math.abs(point.latitude + 21.531) < .00001);
  assert.ok(Math.abs(point.longitude + 42.642) < .00001);
  command({ type: 'data', segments: [[point, { latitude: -21.53, longitude: -42.64 }]] });
  assert.match(node('route').innerHTML, /stroke="#137543"/);
  assert.match(node('route').innerHTML, /L/);
});
test('velocidade usa sensor ou deslocamento e média considera o tempo ativo', () => {
  const math = load('routeMath.ts');
  const a = { latitude: -21.531, longitude: -42.642, recordedAt: 10000, segment: 0, accuracyMeters: 8 };
  const b = { ...a, latitude: -21.5309, recordedAt: 20000 };
  assert.equal(math.currentSpeedKmh(a, { ...b, speedMetersPerSecond: 2 }, 20000), 7.2);
  assert.equal(math.currentSpeedKmh(a, { ...b, speedMetersPerSecond: 0 }, 20000), 0);
  assert.ok(Math.abs(math.currentSpeedKmh(a, b, 20000) - 4) < .1);
  assert.equal(math.averageSpeedKmh(1000, 600000), 6);
  assert.equal(math.averageSpeedKmh(1000, 0), null);
  assert.equal(math.formatSpeed(7.2), '7,2 km/h');
});
test('velocidade não inventa valores para leituras inválidas ou entre pausas', () => {
  const math = load('routeMath.ts');
  const a = { latitude: -21.531, longitude: -42.642, recordedAt: 10000, segment: 0, accuracyMeters: 8 };
  const b = { ...a, latitude: -21.5309, recordedAt: 20000 };
  assert.equal(math.currentSpeedKmh(a, b, 40000), null);
  assert.equal(math.currentSpeedKmh(a, { ...b, accuracyMeters: 80 }, 20000), null);
  assert.equal(math.currentSpeedKmh(a, { ...b, segment: 1 }, 20000), null);
  assert.equal(math.currentSpeedKmh(null, { ...b, speedMetersPerSecond: -1 }, 20000), null);
});
function localStorageMock() {
  const data = new Map();
  const storage = { getItem: async key => data.get(key) ?? null, setItem: async (key, value) => { data.set(key, value); }, removeItem: async key => { data.delete(key); } };
  const open = () => load('routeStorage.ts', { require: name => {
    assert.equal(name, '@react-native-async-storage/async-storage');
    return { __esModule: true, default: storage };
  } });
  return { data, open };
}
test('rotas persistem após reabrir; editar mantém ID único e excluir remove só a escolhida', async () => {
  const { open } = localStorageMock(); const first = open();
  await first.upsertSavedRoute({ id: 'a', name: 'Trilha', points: [] });
  const reopened = open(); assert.equal((await reopened.getSavedRoutes())[0].name, 'Trilha');
  await reopened.upsertSavedRoute({ id: 'a', name: 'Trilha alterada', points: [] });
  await reopened.upsertSavedRoute({ id: 'b', name: 'Outra', points: [] });
  assert.equal((await reopened.getSavedRoutes()).length, 2);
  const remaining = await reopened.deleteSavedRoute('b');
  assert.equal(remaining.length, 1); assert.equal(remaining[0].name, 'Trilha alterada');
});
test('salvamentos concorrentes, rascunhos e dados corrompidos não causam perda silenciosa', async () => {
  const { data, open } = localStorageMock(); const store = open();
  await Promise.all(['a', 'b'].map(id => store.upsertSavedRoute({ id, points: [] })));
  assert.equal((await store.getSavedRoutes()).length, 2);
  await store.setDraft({ id: 'draft', points: [], status: 'paused' });
  assert.equal((await open().getDraft()).id, 'draft');
  await store.removeDraft(); assert.equal(await store.getDraft(), null);
  data.set('@caminhos/routes/v1', '{invalid');
  await assert.rejects(store.upsertSavedRoute({ id: 'c', points: [] }));
  assert.equal(data.get('@caminhos/routes/v1'), '{invalid');
});
