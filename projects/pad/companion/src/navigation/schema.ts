export const NAVIGATION_SCHEMA_VERSION = 2;

type JsonObject = Record<string, unknown>;

type GestureName = 'tap' | 'long' | 'double' | 'alt1Tap' | 'alt2Tap' | 'rotateCw' | 'rotateCcw';
type ViewKind = 'cards' | 'monitor' | 'settings' | 'wifi' | 'game' | 'webContent';

// Limite fisico del pad: 10 botones (slots 0..9) por View.
export const MAX_SLOTS = 10;
// Limite de payload del firmware para POST /api/config (Net.cpp).
export const PAD_CONFIG_LIMIT = 49152;

interface LegacyBinding extends JsonObject {
  id?: unknown;
  label?: unknown;
  press?: unknown;
  long?: unknown;
  cw?: unknown;
  ccw?: unknown;
  st?: unknown;
}

interface LegacyLayer extends JsonObject {
  n?: unknown;
  color?: unknown;
  group?: unknown;
  binds?: unknown;
}

interface EditablePadConfig extends JsonObject {
  layers?: unknown;
  navigation?: unknown;
  views?: unknown;
}

export interface NavigationSection {
  id: string;
  label: string;
  icon: string;
  color: string;
  views: string[];
}

export interface NavigationModel {
  version: number;
  generated: boolean;
  homeView: string;
  alt: {
    alt1View: string;
    alt2View: string;
    lingerMs: number;
  };
  sections: NavigationSection[];
}

export interface NavigationCard {
  slot: number;
  label: string;
  state: string;
  gestures: Partial<Record<GestureName, unknown>>;
}

export interface NavigationView {
  id: string;
  label: string;
  section: string;
  kind: ViewKind;
  color: number;
  cards: NavigationCard[];
  encoder?: {
    label: string;
    cw?: unknown;
    ccw?: unknown;
  };
}

const SECTION_DEFS = [
  { id: 'work', label: 'Trabajo', icon: 'briefcase', color: 'cyan' },
  { id: 'multimedia', label: 'Multimedia', icon: 'play', color: 'magenta' },
  { id: 'calls', label: 'Llamadas', icon: 'video', color: 'rose' },
  { id: 'lights', label: 'Luces', icon: 'lightbulb', color: 'yellow' },
  { id: 'monitor', label: 'Monitor', icon: 'activity', color: 'green' },
  { id: 'system', label: 'Sistema', icon: 'settings', color: 'violet' },
] as const;

const SECTION_BY_LAYER = new Map<string, string>([
  ['Edicion', 'work'],
  ['Dev', 'work'],
  ['Apps', 'work'],
  ['Navegador', 'work'],
  ['Launcher', 'work'],
  ['Macros', 'work'],
  ['Multimedia', 'multimedia'],
  ['YouTube', 'multimedia'],
  ['Netflix', 'multimedia'],
  ['Spotify', 'multimedia'],
  ['Disney+', 'multimedia'],
  ['Paramount', 'multimedia'],
  ['Meet', 'calls'],
  ['Slack', 'calls'],
  ['Zoom', 'calls'],
  ['Teams', 'calls'],
  ['RGB', 'lights'],
  ['WiZ', 'lights'],
  ['General', 'monitor'],
  ['Red', 'monitor'],
  ['Nucleos', 'monitor'],
  ['Disco', 'monitor'],
]);

const MONITOR_LAYERS = new Set(['General', 'Red', 'Nucleos', 'Disco']);

export function ensureNavigationMetadata<T extends EditablePadConfig>(edit: T): T {
  if (isNavigationReady(edit)) return edit;

  const layers = legacyLayers(edit.layers);
  if (layers.length === 0) return edit;

  const usedIds = new Set<string>();
  const layerIds = new Map<string, string>();
  for (const layer of layers) {
    const name = layerName(layer);
    layerIds.set(name, uniqueId(slugify(name), usedIds));
  }

  const views = layers.map((layer) => viewFromLayer(layer, layerIds));
  const sections = SECTION_DEFS.map((section) => ({
    ...section,
    views: views.filter((view) => view.section === section.id).map((view) => view.id),
  })).filter((section) => section.views.length > 0);

  const alt = altObject(edit);
  const homeView = views[0]?.id ?? '';
  const navigation: NavigationModel = {
    version: NAVIGATION_SCHEMA_VERSION,
    generated: true,
    homeView,
    alt: {
      alt1View: layerIds.get(stringValue(alt.alt1, 'Launcher')) ?? 'launcher',
      alt2View: layerIds.get(stringValue(alt.alt2, 'Macros')) ?? 'macros',
      lingerMs: numberValue(alt.linger, 600),
    },
    sections,
  };

  return { ...edit, navigation, views };
}

function isNavigationReady(edit: EditablePadConfig): boolean {
  const navigation = objectValue(edit.navigation);
  const views = Array.isArray(edit.views) ? edit.views : [];
  const customNavigation = navigation.generated !== true;
  return customNavigation && numberValue(navigation.version, 0) >= NAVIGATION_SCHEMA_VERSION && views.length > 0;
}

function viewFromLayer(layer: LegacyLayer, layerIds: Map<string, string>): NavigationView {
  const label = layerName(layer);
  const id = layerIds.get(label) ?? slugify(label);
  const binds = legacyBindings(layer.binds);
  const encoder = binds.find((bind) => bind.id === 14);
  return {
    id,
    label,
    section: SECTION_BY_LAYER.get(label) ?? sectionFromGroup(layer.group),
    kind: MONITOR_LAYERS.has(label) ? 'monitor' : 'cards',
    color: numberValue(layer.color, 0xffff),
    cards: binds.filter((bind) => inputId(bind) >= 0 && inputId(bind) <= 9).map(cardFromBinding),
    ...(encoder ? { encoder: encoderFromBinding(encoder) } : {}),
  };
}

function cardFromBinding(bind: LegacyBinding): NavigationCard {
  const gestures: Partial<Record<GestureName, unknown>> = {};
  if (hasAction(bind.press)) gestures.tap = bind.press;
  if (hasAction(bind.long)) gestures.long = bind.long;
  return {
    slot: inputId(bind),
    label: stringValue(bind.label, ''),
    state: bind.st === undefined ? 'none' : String(bind.st),
    gestures,
  };
}

function encoderFromBinding(bind: LegacyBinding): NavigationView['encoder'] {
  return {
    label: stringValue(bind.label, ''),
    ...(hasAction(bind.cw) ? { cw: bind.cw } : {}),
    ...(hasAction(bind.ccw) ? { ccw: bind.ccw } : {}),
  };
}

function sectionFromGroup(group: unknown): string {
  const n = numberValue(group, 0);
  if (n === 1) return 'multimedia';
  if (n === 2) return 'work';
  if (n === 3) return 'calls';
  if (n === 4) return 'system';
  return 'work';
}

function legacyLayers(value: unknown): LegacyLayer[] {
  return Array.isArray(value) ? value.filter(isObject) : [];
}

function legacyBindings(value: unknown): LegacyBinding[] {
  return Array.isArray(value) ? value.filter(isObject) : [];
}

function layerName(layer: LegacyLayer): string {
  return stringValue(layer.n, 'View');
}

function inputId(bind: LegacyBinding): number {
  return numberValue(bind.id, -1);
}

function altObject(edit: EditablePadConfig): JsonObject {
  return objectValue(edit.alt);
}

function objectValue(value: unknown): JsonObject {
  return isObject(value) ? value : {};
}

function isObject(value: unknown): value is JsonObject {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function hasAction(value: unknown): boolean {
  const action = objectValue(value);
  return stringValue(action.t, 'none') !== 'none';
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function slugify(label: string): string {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'view';
}

function uniqueId(base: string, used: Set<string>): string {
  let id = base;
  let suffix = 2;
  while (used.has(id)) id = `${base}-${suffix++}`;
  used.add(id);
  return id;
}

// --- Edicion / validacion del modelo de navegacion --------------------------
// Una vez que el usuario toca la pestana Navegacion, marcamos el modelo como
// editable (generated:false) para que ensureNavigationMetadata deje de
// regenerarlo desde el keymap y respete lo que el usuario armo.
export function markNavigationEditable<T extends EditablePadConfig>(edit: T): T {
  const withMeta = ensureNavigationMetadata(edit);
  const navigation = objectValue(withMeta.navigation) as unknown as NavigationModel;
  if (navigation.generated === false) return withMeta;
  return { ...withMeta, navigation: { ...navigation, generated: false } };
}

export interface ValidationIssue {
  level: 'error' | 'warn';
  msg: string;
}

// Validacion companion-side antes de guardar/empujar. Las reglas reflejan los
// limites del firmware: IDs unicos, referencias vivas, slots 0..9 sin duplicar
// y ALT/Home apuntando a Views existentes. No falla si la nav todavia no existe
// (config plana legacy): en ese caso no hay nada que validar.
export function validateNavigation(edit: EditablePadConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const navigation = objectValue(edit.navigation) as unknown as Partial<NavigationModel>;
  const views = Array.isArray(edit.views) ? (edit.views as unknown as NavigationView[]) : [];
  if (!navigation.sections && views.length === 0) return issues;   // legacy plano: nada que validar

  const viewIds = new Set<string>();
  for (const view of views) {
    const id = String(view.id ?? '');
    if (!id) { issues.push({ level: 'error', msg: 'Hay una View sin id.' }); continue; }
    if (viewIds.has(id)) issues.push({ level: 'error', msg: `View id duplicado: "${id}".` });
    viewIds.add(id);

    const slots = new Set<number>();
    for (const card of view.cards ?? []) {
      const slot = Number(card.slot);
      if (!Number.isInteger(slot) || slot < 0 || slot >= MAX_SLOTS)
        issues.push({ level: 'error', msg: `View "${id}": slot fuera de rango (0..${MAX_SLOTS - 1}): ${card.slot}.` });
      else if (slots.has(slot))
        issues.push({ level: 'error', msg: `View "${id}": slot ${slot} duplicado.` });
      slots.add(slot);
    }
  }

  const sectionIds = new Set<string>();
  for (const section of navigation.sections ?? []) {
    const id = String(section.id ?? '');
    if (!id) { issues.push({ level: 'error', msg: 'Hay una seccion sin id.' }); continue; }
    if (sectionIds.has(id)) issues.push({ level: 'error', msg: `Seccion id duplicado: "${id}".` });
    sectionIds.add(id);
    for (const ref of section.views ?? [])
      if (!viewIds.has(ref)) issues.push({ level: 'error', msg: `Seccion "${id}" referencia una View inexistente: "${ref}".` });
    if ((section.views ?? []).length > MAX_SLOTS)
      issues.push({ level: 'warn', msg: `Seccion "${id}" tiene mas de ${MAX_SLOTS} Views; el overview solo muestra ${MAX_SLOTS}.` });
  }

  const home = String(navigation.homeView ?? '');
  if (home && !viewIds.has(home)) issues.push({ level: 'error', msg: `homeView apunta a una View inexistente: "${home}".` });
  const alt1 = String(navigation.alt?.alt1View ?? '');
  const alt2 = String(navigation.alt?.alt2View ?? '');
  if (alt1 && !viewIds.has(alt1)) issues.push({ level: 'warn', msg: `alt1View apunta a una View inexistente: "${alt1}".` });
  if (alt2 && !viewIds.has(alt2)) issues.push({ level: 'warn', msg: `alt2View apunta a una View inexistente: "${alt2}".` });

  return issues;
}
