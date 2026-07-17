// ============================================================================
//  WebUi.cpp - ver WebUi.h. La pagina y el manifest viven como raw string
//  literals en PROGMEM; Net.cpp los sirve con send_P (sin copiar a RAM).
// ============================================================================
#include "WebUi.h"

namespace webui {

const char MANIFEST[] PROGMEM = R"JSON({
  "name": "HIOS PAD",
  "short_name": "PAD",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0c0f14",
  "theme_color": "#0c0f14",
  "icons": [
    { "src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230c0f14'/%3E%3Crect x='14' y='14' width='16' height='16' rx='3' fill='%231fe0e0'/%3E%3Crect x='34' y='14' width='16' height='16' rx='3' fill='%233ddc84'/%3E%3Crect x='14' y='34' width='16' height='16' rx='3' fill='%23ffb020'/%3E%3Crect x='34' y='34' width='16' height='16' rx='3' fill='%23eef'/%3E%3C/svg%3E",
      "sizes": "any", "type": "image/svg+xml" }
  ]
})JSON";

const char PAGE[] PROGMEM = R"HTML(<!doctype html>
<html lang=es>
<meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name=theme-color content="#0c0f14">
<meta name=apple-mobile-web-app-capable content=yes>
<meta name=apple-mobile-web-app-status-bar-style content=black-translucent>
<meta name=apple-mobile-web-app-title content="HIOS PAD">
<link rel=manifest href=/manifest.webmanifest>
<link rel=apple-touch-icon href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230c0f14'/%3E%3Crect x='14' y='14' width='16' height='16' rx='3' fill='%231fe0e0'/%3E%3Crect x='34' y='14' width='16' height='16' rx='3' fill='%233ddc84'/%3E%3Crect x='14' y='34' width='16' height='16' rx='3' fill='%23ffb020'/%3E%3Crect x='34' y='34' width='16' height='16' rx='3' fill='%23eef'/%3E%3C/svg%3E">
<title>HIOS PAD</title>
<style>
  :root{--bg:#0c0f14;--card:#151b24;--line:#243040;--fg:#eef;--dim:#8a93a0;--cy:#1fe0e0;--gn:#3ddc84;--rd:#ff5b6a;--yl:#ffb020}
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--fg);
       max-width:560px;margin:0 auto;padding:14px 14px 40px;-webkit-tap-highlight-color:transparent}
  header{display:flex;align-items:center;gap:8px;margin-bottom:12px}
  header h1{font-size:17px;margin:0;letter-spacing:.5px;white-space:nowrap}
  header h1 b{color:var(--cy)}
  .grow{flex:1}
  .dot{width:9px;height:9px;border-radius:50%;background:var(--dim);transition:background .3s}
  .dot.on{background:var(--gn);box-shadow:0 0 8px var(--gn)}
  .chips{display:flex;gap:6px}
  .chip{font-size:10px;font-weight:600;padding:3px 7px;border-radius:99px;border:1px solid var(--line);color:var(--dim)}
  .chip.on{color:var(--bg);background:var(--cy);border-color:var(--cy)}
  .icon-btn{background:var(--card);border:1px solid var(--line);color:var(--fg);border-radius:8px;
            width:32px;height:32px;font-size:15px;cursor:pointer;flex:none}
  .banner{background:var(--card);border:1px solid var(--line);border-left-width:5px;border-radius:12px;
          padding:12px 14px;margin-bottom:12px}
  .banner .lbl{font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:1px}
  .banner .nm{font-size:22px;font-weight:700;margin-top:2px}
  .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
  .stat{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:8px 10px;min-width:0}
  .stat .k{font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:.5px}
  .stat .v{font-size:15px;font-weight:600;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .stat .v.bad{color:var(--rd)} .stat .v.good{color:var(--gn)}
  .sect{font-size:12px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin:6px 2px 8px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .lay{display:flex;align-items:center;gap:9px;text-align:left;background:var(--card);border:1px solid var(--line);
       border-radius:11px;padding:11px 12px;color:var(--fg);font-size:14px;cursor:pointer;transition:border-color .15s}
  .lay:active{transform:scale(.98)}
  .lay .bar{width:5px;align-self:stretch;border-radius:3px;background:var(--line)}
  .lay.act{border-color:var(--cy);box-shadow:0 0 0 1px var(--cy) inset}
  .lay .now{margin-left:auto;color:var(--cy);font-size:12px}
  .pad{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:10px}
  .cap{position:relative;aspect-ratio:1/1;background:var(--card);border:1px solid var(--line);border-radius:10px;
       color:var(--fg);display:flex;align-items:flex-end;justify-content:center;padding:18px 3px 7px;cursor:pointer;overflow:hidden}
  .cap:active{transform:scale(.97)}
  .cap .num{position:absolute;top:4px;left:6px;font-size:10px;font-weight:600;color:var(--dim)}
  .cap .cl{font-size:11px;line-height:1.12;text-align:center;overflow:hidden;word-break:break-word;
           display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
  .cap.hit{border-color:var(--cy);box-shadow:0 0 0 2px var(--cy) inset}
  .cap.down{background:var(--cy);color:var(--bg);border-color:var(--cy)}
  .cap.down .num{color:var(--bg)}
  .enc{display:flex;align-items:center;gap:8px;margin-bottom:16px}
  .encbtn{width:60px;height:42px;font-size:20px;font-weight:600;background:var(--card);border:1px solid var(--line);
          border-radius:10px;color:var(--fg);cursor:pointer}
  .encbtn:active{border-color:var(--cy);box-shadow:0 0 0 1px var(--cy) inset}
  .enclbl{flex:1;text-align:center;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:11px;font-weight:600;font-size:14px}
  #tok{display:none;margin-bottom:12px;gap:6px}
  #tok input{flex:1;background:var(--card);border:1px solid var(--line);border-radius:8px;color:var(--fg);padding:9px}
  #msg{color:var(--yl);font-size:12px;min-height:16px;margin:2px 2px 10px}
  [hidden]{display:none!important}
  #editor .edrow{display:flex;align-items:center;gap:10px;margin-bottom:8px}
  #editor .edrow>span{width:64px;color:var(--dim);font-size:13px}
  #editor input,#editor select{flex:1;background:var(--card);border:1px solid var(--line);border-radius:8px;color:var(--fg);padding:9px;font-size:14px}
  #editor input[type=color]{padding:2px;height:38px;flex:0 0 54px}
  .edsub{font-size:12px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin:14px 2px 8px}
  #edLabels .lr{display:flex;align-items:center;gap:10px;margin-bottom:6px}
  #edLabels .lr>span{width:64px;color:var(--dim);font-size:13px}
  .ednote{font-size:12px;color:var(--dim);margin:14px 2px;line-height:1.45}
  .edbtns{display:flex;gap:8px}
  #editor button{border-radius:10px;padding:12px;font-size:14px;font-weight:600;border:1px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer}
  #editor .primary{flex:1;background:var(--cy);color:var(--bg);border-color:var(--cy)}
  #editor .danger{width:100%;margin-top:8px;color:var(--rd);border-color:#442}
</style>

<header>
  <span class=dot id=live></span>
  <h1>HIOS <b>PAD</b></h1>
  <span class=grow></span>
  <div class=chips><span class=chip id=cUSB>USB</span><span class=chip id=cBLE>BLE</span><span class=chip id=cWIFI>WiFi</span></div>
  <button class=icon-btn id=edit title=Editar>&#9998;</button>
  <button class=icon-btn id=gear title=Token>&#9881;</button>
</header>

<div id=tok><input id=tokIn type=password placeholder="Token (X-Pad-Token)"><button class=icon-btn id=tokSave>&#10003;</button></div>
<div id=msg></div>

<div id=control>
<div class=banner id=banner>
  <div class=lbl>Capa activa</div>
  <div class=nm id=layName>&mdash;</div>
</div>

<div class=stats>
  <div class=stat><div class=k>Mic</div><div class="v" id=sMic>&mdash;</div></div>
  <div class=stat><div class=k>Volumen</div><div class="v" id=sVol>&mdash;</div></div>
  <div class=stat><div class=k>Mouse</div><div class="v" id=sMouse>&mdash;</div></div>
  <div class=stat><div class=k>Encoder</div><div class="v" id=sEnc>&mdash;</div></div>
  <div class=stat><div class=k>CPU</div><div class="v" id=sCpu>&mdash;</div></div>
  <div class=stat><div class=k>GPU</div><div class="v" id=sGpu>&mdash;</div></div>
</div>

<div class=sect>Teclas &middot; toc&aacute; para disparar</div>
<div class=pad id=pad></div>
<div class=enc>
  <button class=encbtn id=encDn>&minus;</button>
  <div class=enclbl id=encLbl>Encoder</div>
  <button class=encbtn id=encUp>+</button>
</div>

<div class=sect>Capas &middot; toc&aacute; para saltar</div>
<div class=grid id=layers></div>
</div><!-- /#control -->

<div id=editor hidden>
  <div class=sect>Editar configuraci&oacute;n</div>
  <div class=edrow><span>Capa</span><select id=edLayer></select></div>
  <div class=edrow><span>Nombre</span><input id=edName maxlength=15></div>
  <div class=edrow><span>Color</span><input id=edColor type=color></div>
  <div class=edsub>Etiquetas de teclas</div>
  <div id=edLabels></div>
  <div class=ednote>Se editan nombre, color y etiquetas &mdash; las acciones se preservan. Guardar reinicia el pad (~5s) para aplicar.</div>
  <div class=edbtns>
    <button id=edSave class=primary>Guardar y reiniciar</button>
    <button id=edCancel>Cancelar</button>
  </div>
  <button id=edReset class=danger>Reset de f&aacute;brica</button>
</div>

<script>
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
let TOKEN=localStorage.getItem('padToken')||'';
const hdr=(o={})=>TOKEN?Object.assign({'X-Pad-Token':TOKEN},o):o;
const ENC=['Capa','Volumen','Scroll','Zoom','Pestañas'];
let CFG=null, layers=[], active=-1;

function rgb565(c){const r=(c>>11&31)*255/31|0,g=(c>>5&63)*255/63|0,b=(c&31)*255/31|0;return `rgb(${r},${g},${b})`;}
function msg(t){$('#msg').textContent=t||'';}

async function loadConfig(){
  try{
    const r=await fetch('/api/config',{headers:hdr()});
    if(r.status===401){msg('Token requerido → ⚙');return;}
    if(!r.ok){msg('config: '+r.status);return;}
    CFG=await r.json();
    layers=CFG.layers||[];
    renderLayers();
    msg('');
  }catch(e){msg('sin conexión con el pad');}
}

function renderLayers(){
  const g=$('#layers'); g.innerHTML='';
  layers.forEach((L,i)=>{
    const b=document.createElement('button');
    b.className='lay'; b.dataset.i=i;
    b.innerHTML=`<span class=bar style="background:${rgb565(L.color||0)}"></span>`+
                `<span>${(L.n||('Capa '+i)).replace(/</g,'&lt;')}</span><span class=now></span>`;
    b.onclick=()=>jump(i);
    g.appendChild(b);
  });
}

async function send(body,onOk){
  try{
    const r=await fetch('/api/cmd',{method:'POST',headers:hdr({'Content-Type':'application/json'}),body:JSON.stringify(body)});
    if(r.status===401){msg('Token requerido → ⚙');return;}
    msg(''); if(onOk)onOk();
  }catch(e){msg('no se pudo enviar');}
}
function jump(i){ send({layer:i},()=>setActive(i)); }     // optimista; el poll confirma
function fireBtn(i){                                       // dispara la tecla (mismo efecto que apretarla)
  const c=document.querySelector(`#pad .cap[data-i="${i}"]`);
  if(c){c.classList.add('hit'); setTimeout(()=>c.classList.remove('hit'),150);}
  send({btn:i});
}
function fireEnc(d){ send({enc:d}); }

// Pad virtual: replica el fisico (10 teclas en 2 filas x 5, numeradas 1..10).
function renderPad(){
  const p=$('#pad'); if(p.childElementCount)return;
  for(let i=0;i<10;i++){
    const b=document.createElement('button');
    b.className='cap'; b.dataset.i=i;
    b.innerHTML=`<span class=num>${i+1}</span><span class=cl></span>`;
    b.onclick=()=>fireBtn(i);
    p.appendChild(b);
  }
}
function paintPad(u){
  const labs=u.layer&&u.layer.labels;
  document.querySelectorAll('#pad .cap').forEach(c=>{
    const i=+c.dataset.i;
    if(labs)c.querySelector('.cl').textContent=labs[i]||'';
    c.classList.toggle('down',((u.b||0)>>i)&1);   // espejo: encendida si esta apretada en el pad fisico
  });
  $('#encLbl').textContent=(u.em>0?ENC[u.em]:null)||(labs&&labs[14])||'Encoder';   // em=0 -> label nativa de la capa
}

function setActive(i){
  if(active===i)return; active=i;
  $$('#layers .lay').forEach(b=>{
    const on=+b.dataset.i===i;
    b.classList.toggle('act',on);
    b.querySelector('.now').textContent=on?'●':'';
  });
}

function chip(id,on){const e=document.getElementById(id); if(e)e.classList.toggle('on',!!on);}

function paint(u){
  $('#live').classList.toggle('on',!!u.live);
  chip('cUSB',u.tp&1); chip('cBLE',u.tp&2); chip('cWIFI',u.tp&4);
  if(u.layer&&u.layer.n){$('#layName').textContent=u.layer.n; $('#banner').style.borderLeftColor=rgb565(u.layer.color||0);}
  setActive(u.lay);
  const mic=$('#sMic'); mic.textContent=u.mic?'MUTE':'abierto'; mic.className='v '+(u.mic?'bad':'good');
  $('#sVol').textContent=(u.vol==null?'—':u.vol+'%');
  $('#sMouse').textContent=u.mo?'ON':'off';
  $('#sEnc').textContent=ENC[u.em]||'—';
  $('#sCpu').textContent=(u.live&&u.cpuT>-1000)?u.cpuT+'°':'—';
  $('#sGpu').textContent=(u.live&&u.gpuT>-1000)?u.gpuT+'°':'—';
  paintPad(u);
}

async function poll(){
  try{
    const r=await fetch('/api/ui',{headers:hdr(),cache:'no-store'});
    if(r.ok){paint(await r.json());}
  }catch(e){$('#live').classList.remove('on');}
  setTimeout(poll,600);
}

// Token settings
$('#gear').onclick=()=>{const t=$('#tok'); t.style.display=t.style.display==='flex'?'none':'flex'; $('#tokIn').value=TOKEN;};
$('#tokSave').onclick=()=>{TOKEN=$('#tokIn').value.trim(); localStorage.setItem('padToken',TOKEN); $('#tok').style.display='none'; loadConfig();};
$('#encDn').onclick=()=>fireEnc(-1);
$('#encUp').onclick=()=>fireEnc(1);

// --- Editor de config: muta SOLO nombre/color/labels sobre el config cargado y
// hace POST del objeto completo -> preserva acciones/ALT/textos/macros verbatim. ---
const SLOTS=[...Array(10)].map((_,i)=>({id:i,n:'Tecla '+(i+1)})).concat([{id:14,n:'Encoder'}]);
let edIdx=0;
function hex565(c){const r=(c>>11&31)*255/31|0,g=(c>>5&63)*255/63|0,b=(c&31)*255/31|0;
  return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');}
function to565(hex){const n=parseInt(hex.slice(1),16),r=n>>16&255,g=n>>8&255,b=n&255;
  return ((r>>3)<<11)|((g>>2)<<5)|(b>>3);}

function openEditor(){
  if(!CFG||!CFG.layers){msg('config no cargada aún');return;}
  const sel=$('#edLayer'); sel.innerHTML='';
  CFG.layers.forEach((L,i)=>{const o=document.createElement('option');o.value=i;o.textContent=L.n||('Capa '+i);sel.appendChild(o);});
  edIdx=Math.min(active<0?0:active, CFG.layers.length-1); sel.value=edIdx;
  fillEditor(edIdx);
  $('#control').hidden=true; $('#editor').hidden=false;
}
function fillEditor(i){
  const L=CFG.layers[i]; if(!L)return;
  $('#edName').value=L.n||''; $('#edColor').value=hex565(L.color||0);
  const box=$('#edLabels'); box.innerHTML='';
  const binds=Array.isArray(L.binds)?L.binds:[];
  SLOTS.forEach(s=>{
    const b=binds.find(x=>x.id===s.id);
    const row=document.createElement('div'); row.className='lr';
    const inp=document.createElement('input'); inp.dataset.id=s.id; inp.maxLength=15; inp.value=(b&&b.label)||'';
    row.innerHTML=`<span>${s.n}</span>`; row.appendChild(inp); box.appendChild(row);
  });
}
function applyEditor(i){
  const L=CFG.layers[i]; if(!L)return;
  L.n=$('#edName').value; L.color=to565($('#edColor').value);
  if(!Array.isArray(L.binds))L.binds=[];
  $$('#edLabels input').forEach(inp=>{
    const id=+inp.dataset.id, lab=inp.value.trim();
    let b=L.binds.find(x=>x.id===id);
    if(lab){ if(b)b.label=lab; else L.binds.push({id,label:lab}); }
    else if(b){ delete b.label;                         // sin label: si el bind quedó vacío, lo saco
      if(b.press==null&&b.long==null&&b.cw==null&&b.ccw==null&&b.st==null) L.binds=L.binds.filter(x=>x!==b);
    }
  });
}
function closeEditor(reload){ $('#editor').hidden=true; $('#control').hidden=false; if(reload)loadConfig(); }
async function saveConfig(){
  applyEditor(edIdx);
  try{
    const r=await fetch('/api/config',{method:'POST',headers:hdr({'Content-Type':'application/json'}),body:JSON.stringify(CFG)});
    if(r.status===401){msg('Token requerido → ⚙');return;}
    if(!r.ok){msg('guardar: '+r.status);return;}
    msg('Guardado ✓ el pad se reinicia (~5s)…'); closeEditor(false);
  }catch(e){msg('no se pudo guardar');}
}
async function resetConfig(){
  if(!confirm('¿Volver a la config de fábrica? El pad se reinicia.'))return;
  try{
    const r=await fetch('/api/config/reset',{method:'POST',headers:hdr()});
    if(r.ok){msg('Reset ✓ el pad se reinicia…'); closeEditor(false);} else msg('reset: '+r.status);
  }catch(e){msg('no se pudo resetear');}
}
$('#edit').onclick=openEditor;
$('#edLayer').onchange=e=>{applyEditor(edIdx); edIdx=+e.target.value; fillEditor(edIdx);};
$('#edSave').onclick=saveConfig;
$('#edCancel').onclick=()=>closeEditor(true);
$('#edReset').onclick=resetConfig;

renderPad();
loadConfig();
poll();
</script>
</html>)HTML";

}  // namespace webui
