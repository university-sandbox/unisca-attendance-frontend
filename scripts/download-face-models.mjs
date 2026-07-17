import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const WEIGHTS_URL =
  "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/0.22.2/weights";
const MODEL_FILES = [
  "ssd_mobilenetv1_model-weights_manifest.json",
  "ssd_mobilenetv1_model-shard1",
  "ssd_mobilenetv1_model-shard2",
  "face_landmark_68_model-weights_manifest.json",
  "face_landmark_68_model-shard1",
  "face_recognition_model-weights_manifest.json",
  "face_recognition_model-shard1",
  "face_recognition_model-shard2",
];
const destination = resolve("public/models");

await mkdir(destination, { recursive: true });

for (const fileName of MODEL_FILES) {
  const response = await fetch(`${WEIGHTS_URL}/${fileName}`);

  if (!response.ok) {
    throw new Error(`Unable to download ${fileName}: HTTP ${response.status}`);
  }

  const contents = new Uint8Array(await response.arrayBuffer());
  if (contents.byteLength === 0) {
    throw new Error(`Unable to download ${fileName}: empty response`);
  }

  await writeFile(resolve(destination, fileName), contents);
  console.log(`Downloaded ${fileName}`);
}
