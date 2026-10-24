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
  // Guard the shared image sink: native file pickers, drops and PNG/SVG scene
  // metadata bypass onPaste. Reject links before assigning Image.src.
  let guarded = 0;
  const output = local.replace(/\bnew Image(?:\(\))?;[\s\S]{0,250}?\b(\w+)\.src\s*=\s*(\w+)/g, (match, image, value) => {
    guarded++;
    return match.replace(new RegExp(image + '\\.src\\s*=\\s*' + value + '$'),
      image + '.src = ((url) => { if (typeof url !== "string" || !(/^data:image\\/(?:png|jpeg|gif|webp|avif|svg\\+xml|bmp|x-icon)(?:;|,)/i.test(url) || url.startsWith("blob:" + window.location.origin + "/"))) throw new Error("Linked images are disabled; import an embedded image."); return url; })(' + value + ')');
  });
  if (/\bnew Image\b/.test(local) && guarded !== (local.match(/\bnew Image\b/g) || []).length) {
    throw new Error('Excalidraw image loading changed: review the local-only adapter before upgrading.');
  }
  return output;
};
