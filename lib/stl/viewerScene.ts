/**
 * viewerScene.ts — la escena Three.js de un STL, SIN React.
 *
 * Todo lo pesado (three) vive acá y en el componente que lo importa, y ese
 * componente se carga con `dynamic(ssr:false)`: three NUNCA entra al bundle del
 * server/edge de Cloudflare (si entrara, revienta el worker con Error 1102) ni al
 * bundle inicial del cliente — baja como chunk aparte recién cuando abrís el visor.
 *
 * Renderiza por WebGL (GPU). El .stl se baja como asset estático y se parsea en el
 * browser: cero trabajo de servidor, que es lo que pide una page estática en CF.
 */
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface SceneTheme {
  /** fondo del canvas */
  bg: number;
  /** color del modelo (tipo filamento PLA) */
  model: number;
  /** color de la grilla de piso */
  grid: number;
}

export interface StlDims {
  /** bounding box en unidades del STL (los slicers las tratan como mm) */
  x: number;
  y: number;
  z: number;
  triangles: number;
}

export interface SceneHandle {
  resize: () => void;
  resetView: () => void;
  setAutoRotate: (on: boolean) => void;
  dispose: () => void;
}

export interface LoadResult {
  handle: SceneHandle;
  dims: StlDims;
}

/**
 * Monta la escena en `container` y carga el STL de `url`. Promise: resuelve cuando
 * el modelo esta cargado y encuadrado (con sus dimensiones), rechaza si el fetch o
 * el parse fallan. El caller es dueño del handle: TIENE que llamar dispose() al
 * desmontar, o quedan colgados el contexto WebGL, la geometria y el rAF.
 */
export function mountStlScene(
  container: HTMLElement,
  url: string,
  theme: SceneTheme,
): Promise<LoadResult> {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(theme.bg);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100000);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 2 = techo: retina sin fundir la GPU
  container.appendChild(renderer.domElement);
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';

  // Luz: hemisferica (cielo/piso) + una direccional de relleno. Da volumen sin que
  // las caras planas de una pieza impresa queden lavadas.
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(1, 1.5, 1);
  scene.add(key);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotateSpeed = 1.6;

  let mesh: THREE.Mesh | null = null;
  let grid: THREE.GridHelper | null = null;
  let raf = 0;
  let disposed = false;
  // encuadre de referencia, para el boton "reset"
  const home = { pos: new THREE.Vector3(), target: new THREE.Vector3() };

  const sizeToContainer = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const animate = () => {
    if (disposed) return;
    raf = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };

  const loader = new STLLoader();

  return new Promise<LoadResult>((resolve, reject) => {
    loader.load(
      url,
      (geometry) => {
        if (disposed) {
          geometry.dispose();
          return;
        }
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        const box = geometry.boundingBox!;
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);

        // Centrar la pieza en el origen: los STL suelen venir corridos al cuadrante
        // positivo (origen del CAD), y sin centrar el orbit gira alrededor de la nada.
        geometry.translate(-center.x, -center.y, -center.z);

        const material = new THREE.MeshStandardMaterial({
          color: theme.model,
          metalness: 0.0,
          roughness: 0.85, // mate, como PLA/PETG
          flatShading: false,
        });
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // Piso: grilla a la altura de la base del modelo (radio x2, celdas legibles).
        const radius = size.length() / 2;
        const gridSpan = Math.ceil((radius * 2.4) / 10) * 10;
        grid = new THREE.GridHelper(gridSpan, 20, theme.grid, theme.grid);
        (grid.material as THREE.Material).opacity = 0.25;
        (grid.material as THREE.Material).transparent = true;
        grid.position.y = -size.y / 2;
        scene.add(grid);

        // Encuadre: distancia para que la esfera envolvente entre entera en el FOV,
        // con un margen. Angulo 3/4 (isometrico-ish) que muestra las 3 caras.
        const fov = (camera.fov * Math.PI) / 180;
        const dist = (radius / Math.sin(fov / 2)) * 1.25;
        camera.position.set(dist * 0.7, dist * 0.6, dist * 0.7);
        camera.near = radius / 100;
        camera.far = radius * 100;
        camera.updateProjectionMatrix();
        controls.target.set(0, 0, 0);
        home.pos.copy(camera.position);
        home.target.copy(controls.target);
        controls.update();

        sizeToContainer();
        animate();

        resolve({
          handle: {
            resize: sizeToContainer,
            resetView: () => {
              camera.position.copy(home.pos);
              controls.target.copy(home.target);
              controls.update();
            },
            setAutoRotate: (on: boolean) => {
              controls.autoRotate = on;
            },
            dispose: () => {
              if (disposed) return;
              disposed = true;
              cancelAnimationFrame(raf);
              controls.dispose();
              geometry.dispose();
              material.dispose();
              if (grid) {
                grid.geometry.dispose();
                (grid.material as THREE.Material).dispose();
              }
              renderer.dispose();
              if (renderer.domElement.parentNode === container) {
                container.removeChild(renderer.domElement);
              }
            },
          },
          dims: {
            x: size.x,
            y: size.y,
            z: size.z,
            triangles: geometry.attributes.position.count / 3,
          },
        });
      },
      undefined,
      (err) => {
        cancelAnimationFrame(raf);
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
        reject(err instanceof Error ? err : new Error('No se pudo cargar el STL'));
      },
    );
  });
}
