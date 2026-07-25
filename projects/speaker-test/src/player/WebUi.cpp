#include "WebUi.h"

namespace webui {

const char PAGE[] PROGMEM = R"HTML(<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0b0f14">
<link rel="manifest" href="/manifest.webmanifest">
<title>HIOS Chip Player</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin:0; background:#0b0f14; color:#e6edf3; font:15px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace; }
  .wrap { max-width:680px; margin:0 auto; padding:20px; }
  h1 { font-size:18px; margin:0 0 4px; }
  .sub { color:#8b98a5; font-size:13px; margin:0 0 18px; }
  textarea { width:100%; min-height:180px; background:#0f151c; color:#e6edf3;
    border:1px solid #2b3543; border-radius:8px; padding:10px; font:13px/1.4 ui-monospace,monospace; resize:vertical; }
  .row { display:flex; gap:10px; flex-wrap:wrap; margin:12px 0; }
  button, .file { flex:1; min-width:120px; padding:11px 14px; border-radius:8px; border:1px solid #2b3543;
    background:#182230; color:#e6edf3; font:inherit; cursor:pointer; text-align:center; }
  button.primary { background:#1f6feb; border-color:#1f6feb; font-weight:600; }
  button:active { transform:translateY(1px); }
  .file input { display:none; }
  #msg { min-height:20px; font-size:13px; margin:6px 0; }
  .ok { color:#3fb950; } .err { color:#f85149; }
  .status { margin-top:18px; border-top:1px solid #1c2530; padding-top:14px; font-size:13px; color:#8b98a5; }
  .status b { color:#e6edf3; }
  .grid { display:grid; grid-template-columns:auto 1fr; gap:2px 12px; }
</style>
</head>
<body>
<div class="wrap">
  <h1>HIOS Chip Player</h1>
  <p class="sub">Pega el codigo exportado del composer (o sube el .json) y suena en vivo.</p>

  <textarea id="song" placeholder='{ "v":2, "n":"...", "bpm":120, ... }'></textarea>

  <div class="row">
    <label class="file">Subir .json<input id="file" type="file" accept=".json,application/json"></label>
    <button class="primary" id="send">Enviar y reproducir</button>
  </div>
  <div class="row">
    <button id="play">Play</button>
    <button id="stop">Stop</button>
  </div>

  <div id="msg"></div>

  <div class="status">
    <div class="grid">
      <span>Estado</span><span><b id="s-play">—</b></span>
      <span>Cancion</span><span><b id="s-name">—</b></span>
      <span>BPM</span><span><b id="s-bpm">—</b></span>
      <span>Pistas / notas</span><span><b id="s-tn">—</b></span>
      <span>Voces</span><span><b id="s-voices">—</b></span>
      <span>Heap libre</span><span><b id="s-heap">—</b></span>
      <span>IP</span><span><b id="s-ip">—</b></span>
    </div>
  </div>
</div>

<script>
const $ = (id) => document.getElementById(id);
const msg = (t, ok) => { const m = $("msg"); m.textContent = t; m.className = ok ? "ok" : "err"; };

$("file").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  if (f) { $("song").value = await f.text(); msg("Archivo cargado: " + f.name, true); }
});

$("send").addEventListener("click", async () => {
  const body = $("song").value.trim();
  if (!body) { msg("Pega o sube una cancion primero", false); return; }
  try {
    const r = await fetch("/api/song", { method:"POST", headers:{"Content-Type":"application/json"}, body });
    const j = await r.json();
    if (j.ok) msg(`OK: ${j.tracks} pistas, ${j.notes} notas${j.dropped?`, ${j.dropped} descartadas`:""}`, true);
    else msg("Error: " + (j.err||"cancion invalida"), false);
  } catch (err) { msg("Fallo de red: " + err, false); }
});

const cmd = async (path) => { try { await fetch(path, {method:"POST"}); } catch(e){} };
$("play").addEventListener("click", () => cmd("/api/play"));
$("stop").addEventListener("click", () => cmd("/api/stop"));

async function poll() {
  try {
    const j = await (await fetch("/api/status")).json();
    $("s-play").textContent = j.playing ? "reproduciendo" : "detenido";
    $("s-name").textContent = j.name || "—";
    $("s-bpm").textContent = j.bpm;
    $("s-tn").textContent = j.tracks + " / " + j.notes;
    $("s-voices").textContent = j.voices;
    $("s-heap").textContent = (j.heap/1024).toFixed(1) + " KB";
    $("s-ip").textContent = j.ip || "—";
  } catch (e) {}
}
setInterval(poll, 1200); poll();
</script>
</body>
</html>)HTML";

const char MANIFEST[] PROGMEM = R"JSON({
  "name": "HIOS Chip Player",
  "short_name": "ChipPlayer",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0b0f14",
  "theme_color": "#0b0f14"
})JSON";

}  // namespace webui
