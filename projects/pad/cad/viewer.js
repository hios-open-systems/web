const root=document.getElementById("pad-packaging-study");
const svg=root.querySelector(".study-stage");
const byId=id=>root.querySelector("#pad-"+id);
const saved=window.openai?.widgetState?.modelContent;
const state={layout:1,angle:55,view:"iso",inside:false,clearance:false,selected:"display"};
function applySaved(value) {
  if (!value || typeof value!=="object") return;
  if (Number.isInteger(value.layout) && value.layout>=0 && value.layout<3) state.layout=value.layout;
  if (Number.isFinite(value.angle)) state.angle=Math.min(75,Math.max(0,value.angle));
  if (["iso","top","side"].includes(value.view)) state.view=value.view;
  for (const key of ["inside","clearance"]) if (typeof value[key]==="boolean") state[key]=value[key];
}
applySaved(saved);
function persist() {
  window.openai?.setWidgetState?.({modelContent:{...state,
    layoutName:study.scenes[state.layout].name},privateContent:null})?.catch(()=>{});
}
function fillParts() {
  const select=byId("part"), scene=study.scenes[state.layout];
  select.replaceChildren();
  for (const p of scene.parts.filter(p=>!p.id.endsWith("-body") && !p.id.endsWith("-wire"))) {
    const option=document.createElement("option");
    option.value=p.id; option.textContent=p.label; select.append(option);
  }
  select.value=state.selected;
}
function updateDetail(scene) {
  const p=scene.parts.find(item=>item.id===state.selected);
  if (!p) return;
  const spec=study.spec.envelopes[p.kind];
  const kind=p.reserve?"Espacio reservado":p.container?"Envolvente de diseño":"Modelo provisional";
  byId("detail").textContent=`${p.label} · ${p.size.join(" × ")} mm · ${kind}`+
    (spec?.status==="assumed"?" · Medir antes de fabricar.":"");
}
function updateMetrics(scene) {
  const [w,d,h]=scene.base, overall=worldBounds(scene,state.angle);
  const percent=100*(1-w*d/17600), real=100*(1-overall[0]*overall[1]/17600);
  byId("base").textContent=`Base ${w} × ${d} × ${h} mm`;
  byId("footprint").textContent=`${percent.toFixed(1)} % menos superficie de base`;
  byId("overall").textContent=`Con pantalla: ${overall.map(v=>v.toFixed(1)).join(" × ")} mm · `+
    `Huella total ${Math.abs(real).toFixed(1)} % ${real>=0?"menor":"mayor"} que 110 × 160`;
  byId("angle-value").textContent=`${state.angle}°`;
  byId("note").textContent=scene.note;
}
function syncControls() {
  byId("angle").value=state.angle; byId("view").value=state.view;
  byId("inside").checked=state.inside; byId("clearance").checked=state.clearance;
  byId("legend").hidden=!state.inside;
  root.querySelectorAll("[data-layout]").forEach(b=>
    b.setAttribute("aria-pressed",Number(b.dataset.layout)===state.layout?"true":"false"));
}
function draw() {
  const scene=study.scenes[state.layout], width=svg.clientWidth||680, height=svg.clientHeight||390;
  svg.setAttribute("viewBox",`0 0 ${width} ${height}`);
  svg.replaceChildren(svgElement("title",{},`${scene.name}, pantalla ${state.angle} grados`));
  const project=makeProjector(scene,state.angle,state.view,width,height);
  addReference(svg,scene,project);
  const parts=scene.parts.filter(p=>{
    if (p.reserve) return state.clearance;
    if (state.inside) return !p.top_label && !p.moving;
    return p.container || p.moving || p.top_label || p.category==="structure";
  });
  const faces=parts.flatMap(p=>partFaces(p,scene,state,project));
  paintFaces(svg,faces,state);
  paintScreen(svg,scene,state,project);
  paintLabels(svg,scene,state,project);
  paintAxis(svg,scene,state,project);
  updateMetrics(scene); updateDetail(scene); syncControls();
}
function changeLayout(index) {
  state.layout=index; state.angle=study.scenes[index].angle;
  state.selected="display"; fillParts(); draw(); persist();
}
root.querySelectorAll("[data-layout]").forEach(b=>
  b.addEventListener("click",()=>changeLayout(Number(b.dataset.layout))));
byId("angle").addEventListener("input",e=>{state.angle=Number(e.target.value);draw();});
byId("angle").addEventListener("change",persist);
byId("view").addEventListener("change",e=>{state.view=e.target.value;draw();persist();});
for (const key of ["inside","clearance"]) {
  byId(key).addEventListener("change",e=>{state[key]=e.target.checked;draw();persist();});
}
byId("part").addEventListener("change",e=>{state.selected=e.target.value;draw();persist();});
svg.addEventListener("click",e=>{
  const id=e.target.getAttribute("data-part");
  if (!id) return;
  const select=byId("part");
  if (![...select.options].some(o=>o.value===id)) return;
  state.selected=id; select.value=id; draw(); persist();
});
window.addEventListener("openai:set_globals",event=>{
  applySaved(event.detail?.globals?.widgetState?.modelContent);fillParts();draw();
});
fillParts();draw();
new ResizeObserver(draw).observe(svg);
