// scripts/orquestador-hios.ts — run from the repo root: node --experimental-strip-types scripts/orquestador-hios.ts
import { requestLocalCompletion } from "./lmstudio-client.ts";
import * as fs from "fs";

async function generarPantallaConfig() {
  // 1. Leer contexto local de btdac
  const pinout = fs.readFileSync('./projects/btdac/README.md', 'utf8');
  // Ruta corregida a la estructura real del proyecto Android
  const existingCode = fs.readFileSync('./projects/btdac/android/app/src/main/java/dev/hios/btdac/MainActivity.kt', 'utf8');

  // 2. Definir la tarea
  const prompt = `Contexto del código existente:\n${existingCode}\n\nBasado en el pinout: ${pinout}, genera el ViewModel en Kotlin para manejar la config del BTDAC via BLE.`;

  // 3. Inferencia Local (Nemotron)
  const content = await requestLocalCompletion(prompt);

  // 4. Escritura Automática (Incremento)
  // Ruta corregida para guardar en el paquete 'viewmodel'
  const targetPath = './projects/btdac/android/app/src/main/java/dev/hios/btdac/viewmodel/ConfigViewModel.kt';
  fs.writeFileSync(targetPath, content);
  console.log(`✅ Código incrementado localmente en: ${targetPath}`);
}

// Ejecutar la función
generarPantallaConfig().catch(console.error);
