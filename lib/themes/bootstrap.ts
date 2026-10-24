import { THEME_STORAGE_KEY } from './config';
import { SKINS, SKIN_STORAGE_KEY } from './skins';

// Runs in <head> before the first paint, independently of React and auth.
// Keep validation aligned with readThemeConfig; stored values are untrusted.
// Each preference is isolated so corrupt/blocked storage cannot reset the rest.
export const THEME_BOOTSTRAP_SCRIPT = `
(function () {
  var root = document.documentElement;
  try {
    var mode = localStorage.getItem('theme');
    if (mode === 'light' || mode === 'dark') root.setAttribute('data-theme', mode);
  } catch (e) {}
  try {
    var skin = localStorage.getItem(${JSON.stringify(SKIN_STORAGE_KEY)});
    if (${JSON.stringify(SKINS.map((skin) => skin.id))}.indexOf(skin) !== -1) {
      root.setAttribute('data-skin', skin);
    }
  } catch (e) {}
  try {
    var config = JSON.parse(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}));
    if (!config || config.version !== 1 || typeof config.accent !== 'string') return;
    var accent = config.accent.trim().toLowerCase();
    if (!/^#([0-9a-f]{6}|[0-9a-f]{3})$/.test(accent)) return;
    if (accent.length === 4) {
      accent = '#' + accent.slice(1).split('').map(function (ch) { return ch + ch; }).join('');
    }
    root.style.setProperty('--accent', accent);
  } catch (e) {}
})();`;
