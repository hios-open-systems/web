// Public sample data following DefaultConfig.cpp (real layers, glyphs, ALT bindings, texts, and macros).
export const demoLayers = [
  { n: 'Edicion', color: 0x07ff, group: 0, labels: ['Copiar', 'Pegar', 'Deshacer', 'Rehacer', 'Email', 'Cortar', 'Sel.todo', 'Buscar', 'Guardar', 'Reemplazar'], em: 2 },
  { n: 'Multimedia', color: 0xf81f, group: 1, labels: ['Anterior', 'Play', 'Siguiente', 'Mute', 'Stop', '', '', '', '', ''], em: 1 },
  { n: 'Dev', color: 0x07e0, group: 0, labels: ['Terminal', 'Paleta', 'Comentar', 'Run', 'Build', 'Guardar', 'Ir a archivo', 'Simbolo', 'Formatear', 'Renombrar'], em: 3 },
  { n: 'Launcher', color: 0xfd20, group: 1, labels: ['App 1', 'App 2', 'App 3', 'App 4', 'Escritorio', 'Cambiar', 'Maximizar', 'Minimizar', '', ''], em: 0 },
  { n: 'Luces', color: 0xffe0, group: 1, labels: ['On/Off', 'Cuarto', 'Calido', 'Frio', 'Off', 'Luz', 'Luz', 'Luz', 'Luz', 'Luz'], em: 1 },
  { n: 'Macros', color: 0xf800, group: 0, labels: ['Terminal', 'Capturar', 'Esc <-', 'Esc ->', 'Bloquear', 'Lupa', '', '', '', ''], em: 4 },
  { n: 'Meet', color: 0x07e8, group: 3, labels: ['Mic', 'Camara', 'Mano', 'Pantalla', 'Colgar', 'Chat', 'Particip', 'Grilla', 'Subtitulos', 'Reaccion'], em: 1 },
  { n: 'Chrome', color: 0x5d9f, group: 2, labels: ['Atras', 'Adelante', 'Recargar', 'Nueva tab', 'Marcadores', 'Cerrar tab', 'Reabrir', 'Buscar', 'Historial', 'Incognito'], em: 4 },
];

export const demoConfig = {
  layers: demoLayers.map((layer, index) => ({
    n: layer.n,
    color: layer.color,
    group: layer.group,
    binds: layer.labels.map((label, id) => buildSampleBind(index, id, label)),
  })),
  texts: [
    'usuario@ejemplo.com',
    'Hola, te escribo por...',
    'git status\n',
  ],
  macros: [
    {
      name: 'Abrir terminal',
      steps: [
        { op: 'press', mods: 8, key: 114 },
        { op: 'delay', ms: 180 },
        { op: 'text', text: 'wt' },
        { op: 'tap', key: 176 },
      ],
    },
  ],
  alt: { alt1: 'Launcher', alt2: 'Macros', linger: 600 },
};

function buildSampleBind(layer, id, label) {
  if (layer === 0) {
    if (id === 4) {
      return { id, label, press: { t: 'text', id: 0 } };
    }
    const keys = ['c', 'v', 'z', 'y', '', 'x', 'a', 'f', 's', 'h'];
    const ch = keys[id] ? keys[id].charCodeAt(0) : 0;
    return {
      id,
      label,
      press: {
        win: { t: 'key', mods: 1, k: [ch] },
        linux: { t: 'key', mods: id === 3 ? 3 : 1, k: [id === 3 ? 'z'.charCodeAt(0) : ch] },
      },
    };
  }
  if (layer === 1 && id < 5) {
    return { id, label, press: { t: 'media', u: [6, 4, 5, 3, 7][id] } };
  }
  return { id, label, press: { t: 'none' } };
}

export const demoFrame = {
  lay: 0,
  b: 0,
  tp: 5,
  bat: 86,
  os: 'Windows',
  mic: false,
  vol: 58,
  em: demoLayers[0].em,
  wiz: true,
  sx: 0,
  sy: 0,
  sclk: false,
  comp: true,
  layer: { ...demoLayers[0], count: 16 },
};
