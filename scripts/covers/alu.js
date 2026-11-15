// Machined-aluminum variant of the cover scenes (opened with ?alu): a CNC-milled enclosure in
// bead-blasted, matte black anodized aluminum with bright diamond-cut chamfers. Every feature is
// something a 3-axis mill or a drill cuts in one setup per face: pockets, round/rounded-rect holes,
// straight slots and chamfered edges (no honeycomb, no undercuts).
import { THREE, mesh } from './studio.js';

export const ALU = new URLSearchParams(location.search).has('alu');

export const anodized = () =>
  new THREE.MeshPhysicalMaterial({ color: 0x141518, metalness: 0.25, roughness: 0.7, clearcoat: 0.08, clearcoatRoughness: 0.7 });
export const diamondCut = () => new THREE.MeshStandardMaterial({ color: 0xe4e7ec, metalness: 1, roughness: 0.14 });
export const slotMat = () => new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.9 });

// Rounded rectangle as a Shape (outline) or Path (hole).
export function rrect(x0, y0, x1, y1, r, p = new THREE.Shape()) {
  p.moveTo(x0 + r, y0); p.lineTo(x1 - r, y0); p.quadraticCurveTo(x1, y0, x1, y0 + r);
  p.lineTo(x1, y1 - r); p.quadraticCurveTo(x1, y1, x1 - r, y1);
  p.lineTo(x0 + r, y1); p.quadraticCurveTo(x0, y1, x0, y1 - r);
  p.lineTo(x0, y0 + r); p.quadraticCurveTo(x0, y0, x0 + r, y0);
  return p;
}
export const hole = (x0, y0, x1, y1, r) => rrect(x0, y0, x1, y1, r, new THREE.Path());
export function circle(cx, cy, r) { const p = new THREE.Path(); p.absarc(cx, cy, r, 0, Math.PI * 2, true); return p; }

// Extrudes `shape` to height h along +Z with a 45° chamfer of size c on both faces, and splits the
// triangles into two material groups: faces (anodized) and chamfers (diamond cut).
// flat = true lays it in STL coordinates (shape x/y on the ground, height up).
export function machined(shape, h, c = 0.8, flat = true) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: h - 2 * c, bevelEnabled: true, bevelThickness: c, bevelSize: c, bevelOffset: -c, bevelSegments: 1, curveSegments: 24,
  });
  g.translate(0, 0, c);
  const pos = g.attributes.position, names = Object.keys(g.attributes), a = new THREE.Vector3(), b = new THREE.Vector3(), n = new THREE.Vector3();
  const faces = [], chamfers = [];
  for (let t = 0; t < pos.count; t += 3) {
    a.fromBufferAttribute(pos, t + 1).sub(n.fromBufferAttribute(pos, t));
    b.fromBufferAttribute(pos, t + 2).sub(n.fromBufferAttribute(pos, t));
    a.cross(b).normalize();
    (Math.abs(a.z) > 0.2 && Math.abs(a.z) < 0.98 ? chamfers : faces).push(t);
  }
  const out = new THREE.BufferGeometry();
  for (const k of names) {
    const src = g.attributes[k], sz = src.itemSize, arr = new Float32Array(src.array.length);
    let o = 0;
    for (const t of [...faces, ...chamfers]) for (let v = 0; v < 3; v++) for (let i = 0; i < sz; i++) arr[o++] = src.array[(t + v) * sz + i];
    out.setAttribute(k, new THREE.BufferAttribute(arr, sz));
  }
  out.addGroup(0, faces.length * 3, 0); out.addGroup(faces.length * 3, chamfers.length * 3, 1);
  if (flat) out.rotateX(-Math.PI / 2);
  return mesh(out, [anodized(), diamondCut()]);
}
