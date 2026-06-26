// Contrato JSON compartido con el firmware (POST /api/state).
// FUENTE DE VERDAD: debe coincidir con handlePostState() en
// ../../src/net/Net.cpp (firmware del pad). Todos los campos son OPCIONALES: el firmware
// pisa solo lo presente, asi que el daemon manda unicamente lo que pudo leer.
// La RESPUESTA puede traer comandos pad->companion: 204 (sin comandos) o
// 200 con cuerpo {"cmds":["micToggle"]} -> ver device.ts (PushResult) e index.ts.
export interface PadState {
  mic?: boolean;     // microfono muteado
  cam?: boolean;     // camara en uso / apagada (nice-to-have)
  media?: boolean;   // media reproduciendo (nice-to-have)
  vol?: number;      // 0..100 volumen del sistema
  cpuTemp?: number;  // C
  gpuTemp?: number;  // C
  cpuLoad?: number;  // 0..100 (promedio de nucleos)
  gpuLoad?: number;  // 0..100
  cpuFan?: number;   // RPM del cooler de CPU/gabinete
  gpuFan?: number;   // 0..100 del cooler de GPU
  ram?: number;      // 0..100 RAM usada
  cores?: number[];  // carga 0..100 por nucleo (capa Nucleos)
  netDown?: number;  // KB/s de bajada
  netUp?: number;    // KB/s de subida
  ip?: string;       // IP local (capa Red)
  vramUsed?: number; // MB de VRAM usada (capa General, GPU)
  vramTotal?: number;// MB de VRAM total
  disk?: number;     // 0..100 uso del volumen principal (capa Disco)
  diskRd?: number;   // KB/s de lectura de disco
  diskWr?: number;   // KB/s de escritura de disco
  uptime?: number;   // segundos encendido (capa General)
  procs?: number;    // nº de procesos
  clockMin?: number; // hora local en minutos desde 00:00 (0..1439) -> sincroniza el reloj del pad
  // --- feedback WiZ (para que la capa WiZ muestre que se esta controlando) ---
  wizRoom?: string;    // cuarto activo
  wizTarget?: string;  // "Todas" o "n/N" (luz puntual)
  wizOn?: boolean;     // estado on/off (real, via getPilot)
  wizBright?: number;  // brillo 0..100
}
