// Shared studio setup for project cover renders (units: mm, Y up).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

export const W = 1600, H = 1000;
export { THREE, RoundedBoxGeometry };

export function studio({ accent = 0x38bdf8 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.9;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const bg = canvasTex(8, 512, (c) => {
    const g = c.createRadialGradient(4, 200, 10, 4, 260, 420);
    g.addColorStop(0, '#2a303b'); g.addColorStop(1, '#0b0d11'); c.fillStyle = g; c.fillRect(0, 0, 8, 512);
  });
  scene.background = bg;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.ShadowMaterial({ opacity: 0.5 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(-140, 280, 180); key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096); Object.assign(key.shadow.camera, { left: -160, right: 160, top: 160, bottom: -160, near: 10, far: 900 });
  key.shadow.radius = 8; key.shadow.bias = -0.0004; scene.add(key);
  const rim = new THREE.DirectionalLight(accent, 1.4); rim.position.set(220, 140, -240); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xe6f0ff, 0x0d1014, 0.35));
  return { renderer, scene };
}

export function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

const loader = new STLLoader();
// STL files are Z-up; rotate into the Y-up scene: (x, y, z) -> (x, z, -y).
export async function stl(path, material, zUp = true) {
  const g = await loader.loadAsync(path); if (zUp) g.rotateX(-Math.PI / 2); g.computeVertexNormals();
  material.side = THREE.DoubleSide; const m = new THREE.Mesh(g, material); m.castShadow = true; m.receiveShadow = true; return m;
}
export const at = (x, y, z) => new THREE.Vector3(x, z, -y); // STL coords -> scene

export function mesh(geo, mat, pos, shadow = true) {
  const m = new THREE.Mesh(geo, mat); if (pos) m.position.copy(pos); m.castShadow = shadow; m.receiveShadow = true; return m;
}

export function pla(color, opts = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.55, metalness: 0, clearcoat: 0.15, clearcoatRoughness: 0.6, ...opts });
}

export function shoot(renderer, scene, cam) { renderer.render(scene, cam); window.__done = true; }
