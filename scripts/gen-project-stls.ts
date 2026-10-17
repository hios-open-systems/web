/**
 * Generador de modelos 3D STL sólidos para BTDAC y Speaker.
 * Produce archivos STL binarios válidos compatibles con STLLoader (Three.js / WebGL).
 */
import fs from 'node:fs';
import path from 'node:path';

interface Triangle {
  normal: [number, number, number];
  v1: [number, number, number];
  v2: [number, number, number];
  v3: [number, number, number];
}

function calculateNormal(
  v1: [number, number, number],
  v2: [number, number, number],
  v3: [number, number, number]
): [number, number, number] {
  const ax = v2[0] - v1[0], ay = v2[1] - v1[1], az = v2[2] - v1[2];
  const bx = v3[0] - v1[0], by = v3[1] - v1[1], bz = v3[2] - v1[2];
  const nx = ay * bz - az * by;
  const ny = az * bx - ax * bz;
  const nz = ax * by - ay * bx;
  const len = Math.hypot(nx, ny, nz) || 1;
  return [nx / len, ny / len, nz / len];
}

function addQuad(
  triangles: Triangle[],
  v1: [number, number, number],
  v2: [number, number, number],
  v3: [number, number, number],
  v4: [number, number, number]
) {
  const n1 = calculateNormal(v1, v2, v3);
  triangles.push({ normal: n1, v1, v2, v3 });
  const n2 = calculateNormal(v1, v3, v4);
  triangles.push({ normal: n2, v1, v2: v3, v3: v4 });
}

function addBox(
  triangles: Triangle[],
  x: number, y: number, z: number,
  w: number, d: number, h: number
) {
  const x1 = x, x2 = x + w;
  const y1 = y, y2 = y + d;
  const z1 = z, z2 = z + h;

  // Bottom (-Z)
  addQuad(triangles, [x1, y1, z1], [x1, y2, z1], [x2, y2, z1], [x2, y1, z1]);
  // Top (+Z)
  addQuad(triangles, [x1, y1, z2], [x2, y1, z2], [x2, y2, z2], [x1, y2, z2]);
  // Front (-Y)
  addQuad(triangles, [x1, y1, z1], [x2, y1, z1], [x2, y1, z2], [x1, y1, z2]);
  // Back (+Y)
  addQuad(triangles, [x1, y2, z1], [x1, y2, z2], [x2, y2, z2], [x2, y2, z1]);
  // Left (-X)
  addQuad(triangles, [x1, y1, z1], [x1, y1, z2], [x1, y2, z2], [x1, y2, z1]);
  // Right (+X)
  addQuad(triangles, [x2, y1, z1], [x2, y2, z1], [x2, y2, z2], [x2, y1, z2]);
}

function addHollowBox(
  triangles: Triangle[],
  x: number, y: number, z: number,
  w: number, d: number, h: number,
  wall: number
) {
  // Base floor
  addBox(triangles, x, y, z, w, d, wall);
  // 4 walls
  addBox(triangles, x, y, z + wall, w, wall, h - wall); // Front
  addBox(triangles, x, y + d - wall, z + wall, w, wall, h - wall); // Back
  addBox(triangles, x, y + wall, z + wall, wall, d - 2 * wall, h - wall); // Left
  addBox(triangles, x + w - wall, y + wall, z + wall, wall, d - 2 * wall, h - wall); // Right
}

function trianglesToBinaryStl(name: string, triangles: Triangle[]): Buffer {
  const header = Buffer.alloc(80, 0);
  header.write(`HIOS 3D STL - ${name.slice(0, 60)}`, 'utf-8');

  const triangleCount = triangles.length;
  const buffer = Buffer.alloc(84 + triangleCount * 50);
  header.copy(buffer, 0);
  buffer.writeUInt32LE(triangleCount, 80);

  let offset = 84;
  for (const tri of triangles) {
    buffer.writeFloatLE(tri.normal[0], offset);
    buffer.writeFloatLE(tri.normal[1], offset + 4);
    buffer.writeFloatLE(tri.normal[2], offset + 8);

    buffer.writeFloatLE(tri.v1[0], offset + 12);
    buffer.writeFloatLE(tri.v1[1], offset + 16);
    buffer.writeFloatLE(tri.v1[2], offset + 20);

    buffer.writeFloatLE(tri.v2[0], offset + 24);
    buffer.writeFloatLE(tri.v2[1], offset + 28);
    buffer.writeFloatLE(tri.v2[2], offset + 32);

    buffer.writeFloatLE(tri.v3[0], offset + 36);
    buffer.writeFloatLE(tri.v3[1], offset + 40);
    buffer.writeFloatLE(tri.v3[2], offset + 44);

    buffer.writeUInt16LE(0, offset + 48);
    offset += 50;
  }
  return buffer;
}

// 1. BTDAC Models
// Base enclosure: 105 x 65 x 26 mm with 2.5 mm wall and mounting bosses
const btdacBaseTriangles: Triangle[] = [];
addHollowBox(btdacBaseTriangles, -52.5, -32.5, 0, 105, 65, 26, 2.5);
// Standoff bosses in 4 corners
addBox(btdacBaseTriangles, -46, -26, 2.5, 6, 6, 6);
addBox(btdacBaseTriangles, 40, -26, 2.5, 6, 6, 6);
addBox(btdacBaseTriangles, -46, 20, 2.5, 6, 6, 6);
addBox(btdacBaseTriangles, 40, 20, 2.5, 6, 6, 6);
// Divider rail for battery pack
addBox(btdacBaseTriangles, -2, -30, 2.5, 3, 60, 10);

const btdacBaseStl = trianglesToBinaryStl('HIOS BTDAC Enclosure Base', btdacBaseTriangles);
fs.writeFileSync(path.join(process.cwd(), 'public/downloads/btdac/btdac-enclosure-base.stl'), btdacBaseStl);

// Lid: 105 x 65 x 3 mm with LED bezel opening and perimeter lip
const btdacLidTriangles: Triangle[] = [];
addBox(btdacLidTriangles, -52.5, -32.5, 0, 105, 65, 2.5);
// Lip underneath to snap into the base
addBox(btdacLidTriangles, -49.5, -29.5, -2, 99, 2, 2);
addBox(btdacLidTriangles, -49.5, 27.5, -2, 99, 2, 2);
addBox(btdacLidTriangles, -49.5, -27.5, -2, 2, 55, 2);
addBox(btdacLidTriangles, 47.5, -27.5, -2, 2, 55, 2);
// LED indicator bezel on top
addBox(btdacLidTriangles, -4, -4, 2.5, 8, 8, 1.5);

const btdacLidStl = trianglesToBinaryStl('HIOS BTDAC Enclosure Lid', btdacLidTriangles);
fs.writeFileSync(path.join(process.cwd(), 'public/downloads/btdac/btdac-enclosure-lid.stl'), btdacLidStl);

// PCM5102 Carrier Mount: 46 x 32 x 6 mm
const btdacMountTriangles: Triangle[] = [];
addBox(btdacMountTriangles, -23, -16, 0, 46, 32, 2);
// Side rails
addBox(btdacMountTriangles, -23, -16, 2, 46, 3, 5);
addBox(btdacMountTriangles, -23, 13, 2, 46, 3, 5);
addBox(btdacMountTriangles, -23, -13, 2, 3, 26, 5);

const btdacMountStl = trianglesToBinaryStl('HIOS BTDAC PCM5102 Carrier Mount', btdacMountTriangles);
fs.writeFileSync(path.join(process.cwd(), 'public/downloads/btdac/btdac-pcm5102-mount.stl'), btdacMountStl);

// 2. Speaker Models
// Cabinet base: 135 x 75 x 60 mm with center acoustic divider
const speakerBaseTriangles: Triangle[] = [];
addHollowBox(speakerBaseTriangles, -67.5, -37.5, 0, 135, 75, 60, 3);
// Internal acoustic divider separating L and R speaker chambers
addBox(speakerBaseTriangles, -1.5, -34.5, 3, 3, 69, 54);
// Internal battery tray support tabs
addBox(speakerBaseTriangles, -50, -10, 3, 15, 20, 4);
addBox(speakerBaseTriangles, 35, -10, 3, 15, 20, 4);

const speakerBaseStl = trianglesToBinaryStl('HIOS Speaker Cabinet Base', speakerBaseTriangles);
fs.writeFileSync(path.join(process.cwd(), 'public/downloads/speaker/speaker-cabinet-base.stl'), speakerBaseStl);

// Front baffle: 135 x 75 x 3.5 mm with dual speaker cones aperture and LCD 16x2 frame
const speakerBaffleTriangles: Triangle[] = [];
// Plate base
addBox(speakerBaffleTriangles, -67.5, -37.5, 0, 135, 75, 3.5);
// Dual speaker grill rings
for (let i = 0; i < 16; i++) {
  const angle = (i * Math.PI * 2) / 16;
  const cx1 = -38 + Math.cos(angle) * 18;
  const cy1 = Math.sin(angle) * 18;
  addBox(speakerBaffleTriangles, cx1 - 1.5, cy1 - 1.5, 3.5, 3, 3, 2);

  const cx2 = 38 + Math.cos(angle) * 18;
  const cy2 = Math.sin(angle) * 18;
  addBox(speakerBaffleTriangles, cx2 - 1.5, cy2 - 1.5, 3.5, 3, 3, 2);
}
// LCD 16x2 raised bezel in center
addBox(speakerBaffleTriangles, -18, -12, 3.5, 36, 24, 2);

const speakerBaffleStl = trianglesToBinaryStl('HIOS Speaker Front Baffle', speakerBaffleTriangles);
fs.writeFileSync(path.join(process.cwd(), 'public/downloads/speaker/speaker-front-baffle.stl'), speakerBaffleStl);

// Back plate: 135 x 75 x 3 mm with ports
const speakerBackTriangles: Triangle[] = [];
addBox(speakerBackTriangles, -67.5, -37.5, 0, 135, 75, 3);
// Power switch and USB-C port rim
addBox(speakerBackTriangles, -40, -10, 3, 20, 20, 1.5);
addBox(speakerBackTriangles, 20, -8, 3, 22, 16, 1.5);

const speakerBackStl = trianglesToBinaryStl('HIOS Speaker Back Plate', speakerBackTriangles);
fs.writeFileSync(path.join(process.cwd(), 'public/downloads/speaker/speaker-back-plate.stl'), speakerBackStl);

console.log('Successfully generated 6 project STL models for BTDAC and Speaker');
