const faceIndices = [[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]];
const categoryColor = {
  structure:"var(--muted)", display:"var(--secondary)", controls:"var(--muted)",
  power:"var(--viz-series-2)", electronics:"var(--viz-series-1)",
  audio:"var(--viz-series-3)", clearance:"var(--viz-series-4)"
};
const svgNS = "http://www.w3.org/2000/svg";
function svgElement(tag, attributes, text) {
  const node = document.createElementNS(svgNS,tag);
  Object.entries(attributes).forEach(([k,v]) => node.setAttribute(k,String(v)));
  if (text !== undefined) node.textContent = text;
  return node;
}
function vertexCloud(part, scene, angle) {
  const a=angle*Math.PI/180, vertices=[];
  for (const x of [-1,1]) for (const y of [-1,1]) for (const z of [-1,1]) {
    let q=part.center.map((v,i)=>v+[x,y,z][i]*part.size[i]/2);
    if (part.moving) {
      const [px,py,pz]=scene.pivot, [u,v,w]=q;
      q=[px+u,py+v*Math.cos(a)-w*Math.sin(a),pz+v*Math.sin(a)+w*Math.cos(a)];
    }
    vertices.push(q);
  }
  return vertices;
}
function projectRaw([x,y,z], view) {
  if (view==="top") return [x,-y,z];
  if (view==="side") return [y,-z,x];
  return [0.86*x+0.51*y,0.26*x-0.44*y-0.86*z,0.44*x-0.74*y+0.52*z];
}
function displayPoint(point, scene, angle) {
  const [x,y,z]=point, a=angle*Math.PI/180, [px,py,pz]=scene.pivot;
  return [px+x,py+y*Math.cos(a)-z*Math.sin(a),pz+y*Math.sin(a)+z*Math.cos(a)];
}
function worldBounds(scene, angle) {
  const vv=scene.parts.filter(p=>!p.reserve).flatMap(p=>vertexCloud(p,scene,angle));
  return [0,1,2].map(i=>Math.max(...vv.map(v=>v[i]))-Math.min(...vv.map(v=>v[i])));
}
function makeProjector(scene, angle, view, width, height) {
  const boundsParts=[...scene.parts.filter(p=>!p.reserve),
    {size:[110,160,1],center:[scene.base[0]/2,scene.base[1]/2,0]}];
  const points=boundsParts.flatMap(p=>vertexCloud(p,scene,angle)).map(v=>projectRaw(v,view));
  const min=[0,1].map(i=>Math.min(...points.map(p=>p[i])));
  const max=[0,1].map(i=>Math.max(...points.map(p=>p[i])));
  const scale=Math.min((width-60)/(max[0]-min[0]),(height-55)/(max[1]-min[1]));
  return point => {
    const [x,y,depth]=projectRaw(point,view);
    return [(x-(min[0]+max[0])/2)*scale+width/2,
            (y-(min[1]+max[1])/2)*scale+height/2, depth];
  };
}
function addReference(svg, scene, project) {
  const [w,d]=scene.base, x=(w-110)/2,y=(d-160)/2;
  const points=[[x,y,0],[x+110,y,0],[x+110,y+160,0],[x,y+160,0]].map(project);
  svg.append(svgElement("polygon",{points:points.map(p=>p.slice(0,2).join(",")).join(" "),
    fill:"none",stroke:"var(--muted-foreground)","stroke-width":1,"stroke-dasharray":"4 4"}));
}
function partFaces(part, scene, state, project) {
  if (part.shape==="cylinder") return cylinderFaces(part,project);
  const vv=vertexCloud(part,scene,state.angle).map(project);
  return faceIndices.map((indices,index)=>({
    part, index, points:indices.map(i=>vv[i]),
    depth:indices.reduce((sum,i)=>sum+vv[i][2],0)/4
  }));
}
function cylinderFaces(part, project) {
  const [x,y,z]=part.center, r=part.size[0]/2, h=part.size[2]/2;
  const ring=dz=>Array.from({length:24},(_,i)=>{
    const a=i*Math.PI/12;
    return project([x+r*Math.cos(a),y+r*Math.sin(a),z+dz]);
  });
  const bottom=ring(-h), top=ring(h);
  const polygons=[bottom,top,...bottom.map((p,i)=>[p,bottom[(i+1)%24],top[(i+1)%24],top[i]])];
  return polygons.map((points,index)=>({part,index,points,
    depth:points.reduce((s,p)=>s+p[2],0)/points.length}));
}
function paintFaces(svg, faces, state) {
  faces.sort((a,b)=>a.depth-b.depth);
  for (const {part,index,points} of faces) {
    const container=part.container, selected=part.id===state.selected;
    const opacity=part.reserve?0.12:container?(state.inside?0.035:1):1;
    const shade=96-(index%6)*1.5;
    const surface=part.category==="controls"?"var(--card)":categoryColor[part.category];
    const fill=`color-mix(in srgb, ${surface} ${shade}%, var(--foreground))`;
    const shape=svgElement("polygon",{points:points.map(p=>p.slice(0,2).join(",")).join(" "),
      fill,
      "fill-opacity":opacity,stroke:selected?"var(--viz-series-1)":"var(--border)",
      "stroke-width":selected?1.5:0.7,"data-part":part.id});
    svg.append(shape);
  }
}
function paintLabels(svg, scene, state, project) {
  if (state.view==="side") return;
  for (const part of scene.parts.filter(p=>p.top_label)) {
    if (state.inside) continue;
    const point=[...part.center]; point[2]+=part.size[2]/2+0.5;
    const p=project(point);
    svg.append(svgElement("text",{x:p[0],y:p[1]+3,"text-anchor":"middle",
      "class":"text-small","pointer-events":"none"},part.top_label.replace("ALT","A")));
  }
}
function paintScreen(svg, scene, state, project) {
  if (state.inside) return;
  const panel=scene.parts.find(p=>p.id==="display");
  const [sw,sh]=study.spec.envelopes.active_screen.size;
  const x=sw/2,y=(panel.size[1]-sh)/2,z=panel.size[2]/2+0.15;
  const corners=[[-x,y,z],[x,y,z],[x,y+sh,z],[-x,y+sh,z]];
  const points=corners.map(p=>project(displayPoint(p,scene,state.angle)));
  svg.append(svgElement("polygon",{points:points.map(p=>p.slice(0,2).join(",")).join(" "),
    fill:"var(--viz-series-1)","fill-opacity":0.6,stroke:"var(--border)","stroke-width":1}));
  if (state.view!=="side") {
    const center=project(displayPoint([0,panel.size[1]/2,z+0.15],scene,state.angle));
    svg.append(svgElement("text",{x:center[0],y:center[1],"text-anchor":"middle",
      class:"text-small"},"HIOS PAD"));
  }
}
function paintAxis(svg, scene, state, project) {
  if (state.view!=="side" && !state.clearance) return;
  const [x,y,z]=scene.pivot, a=project([x-60,y,z]), b=project([x+60,y,z]);
  svg.append(svgElement("line",{x1:a[0],y1:a[1],x2:b[0],y2:b[1],
    stroke:"var(--viz-series-4)","stroke-width":2}));
  const p=project(scene.pivot);
  svg.append(svgElement("circle",{cx:p[0],cy:p[1],r:4,fill:"var(--viz-series-4)"}));
  svg.append(svgElement("text",{x:p[0]+9,y:p[1]-9,class:"text-small"},"Eje"));
}
