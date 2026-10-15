// Public sample data, not a device export. Labels follow DefaultConfig.cpp.
export const demoLayers = [
  { n: 'Edicion', color: 0x07ff, labels: ['Copiar', 'Pegar', 'Deshacer', 'Rehacer', 'Email', 'Cortar', 'Sel.todo', 'Buscar', 'Guardar', 'Reemplazar'], em: 2 },
  { n: 'Multimedia', color: 0xf81f, labels: ['Anterior', 'Play', 'Siguiente', 'Mute', 'Stop', '', '', '', '', ''], em: 1 },
  { n: 'Dev', color: 0x07e0, labels: ['Terminal', 'Paleta', 'Comentar', 'Run', 'Build', 'Guardar', 'Ir a archivo', 'Simbolo', 'Formatear', 'Renombrar'], em: 3 },
];

export const demoConfig = {
  layers: demoLayers.map((layer, index) => ({
    n: layer.n, color: layer.color, group: index === 1 ? 1 : 0,
    binds: layer.labels.map((label, id) => ({
      id, label, press: sampleAction(index, id),
    })),
  })),
  texts: ['Texto de ejemplo'], macros: [],
  alt: { alt1: '', alt2: '', lingerMs: 600 },
};

function sampleAction(layer, key) {
  if (layer === 0) {
    if (key === 4) return { t: 'text', id: 0 };
    return { t: 'key', mods: key === 3 ? 3 : 1, k: ['c', 'v', 'z', 'z', '', 'x', 'a', 'f', 's', 'h'][key].charCodeAt(0) };
  }
  if (layer === 1 && key < 5) return { t: 'media', u: [6, 4, 5, 3, 7][key] };
  return { t: 'none' };
}

export const demoFrame = {
  lay: 0, b: 0, tp: 5, bat: 255, os: 'Windows', mic: false, vol: 42,
  em: demoLayers[0].em, layer: { ...demoLayers[0], count: demoLayers.length },
};
