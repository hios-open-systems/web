// orquestador-hios.ts
import { LMStudioClient } from "@lmstudio/sdk";
import * as fs from "fs";

const client = new LMStudioClient();

async function generarPantallaConfig() {
  // 1. Leer contexto local de btdac
  const pinout = fs.readFileSync('./projects/btdac/PINOUT.md', 'utf8');
  // Ruta corregida a la estructura real del proyecto Android
  const existingCode = fs.readFileSync('./projects/btdac/android/app/src/main/java/dev/hios/btdac/MainActivity.kt', 'utf8');

  // 2. Definir la tarea
  const prompt = `Contexto del código existente:\n${existingCode}\n\nBasado en el pinout: ${pinout}, genera el ViewModel en Kotlin para manejar la config del BTDAC via BLE.`;

  // 3. Inferencia Local (Nemotron)
  const model = await client.llm.model("nemotron-3-nano");
  const response = await model.respond(prompt);

  // 4. Escritura Automática (Incremento)
  // Ruta corregida para guardar en el paquete 'viewmodel'
  const targetPath = './projects/btdac/android/app/src/main/java/dev/hios/btdac/viewmodel/ConfigViewModel.kt';
  fs.writeFileSync(targetPath, response.content);
  console.log(`✅ Código incrementado localmente en: ${targetPath}`);
}

// Ejecutar la función
generarPantallaConfig().catch(console.error);