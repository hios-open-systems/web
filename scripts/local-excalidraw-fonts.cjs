// Excalidraw 0.18 also registers its CDN fallback when a local asset path is set.
// Keep that fallback on our origin too, including for font export/subsetting.
module.exports = function localExcalidrawFonts(source) {
  const local = source.replace(
    /new URL\((\w+),\s*\w+\.ASSETS_FALLBACK_URL\)/g,
    'new URL($1, window.location.origin + "/vendor/excalidraw/")',
  );
  if (source.includes('ASSETS_FALLBACK_URL') && local === source) {
    throw new Error('Excalidraw font loading changed: review the local-only adapter before upgrading.');
  }
  return local;
};
