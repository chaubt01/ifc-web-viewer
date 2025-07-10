import * as OBC from "@thatopen/components";
import * as WEBIFC from "web-ifc";

const container = document.getElementById("container");
const components = new OBC.Components();
const worlds = components.get(OBC.Worlds);

const world = worlds.create(OBC.SimpleScene, OBC.SimpleCamera, OBC.SimpleRenderer);
world.scene = new OBC.SimpleScene(components);
world.renderer = new OBC.SimpleRenderer(components, container);
world.camera = new OBC.SimpleCamera(components);
components.init();
world.scene.setup();
world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);
world.scene.three.background = null;

const fragments = components.get(OBC.FragmentsManager);
const fragmentIfcLoader = components.get(OBC.IfcLoader);
await fragmentIfcLoader.setup();
fragmentIfcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;

const baseUrl = "https://my-ifc-project.onrender.com";
const select = document.getElementById("fileSelect");

async function fetchAllIFCs() {
  const res = await fetch(`${baseUrl}/list-ifc`);
  const files = await res.json();
  return files;
}

async function loadIfcFromFile(fileName) {
  const fileRes = await fetch(`${baseUrl}/download-ifc?file=${encodeURIComponent(fileName)}`);
  const buffer = await fileRes.arrayBuffer();
  const model = await fragmentIfcLoader.load(new Uint8Array(buffer));
  model.name = fileName;
  world.scene.clear();
  world.scene.three.add(model);
}

select.addEventListener("change", async () => {
  await loadIfcFromFile(select.value);
});

const files = await fetchAllIFCs();
files.forEach(file => {
  const option = document.createElement("option");
  option.value = file;
  option.textContent = file;
  select.appendChild(option);
});

if (files.length > 0) {
  await loadIfcFromFile(files[0]);
}
