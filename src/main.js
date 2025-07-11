import * as OBC from "@thatopen/components";
import * as WEBIFC from "web-ifc";

const baseProxy = "https://my-ifc-project.onrender.com";
const viewerRoot = document.getElementById("viewers");

async function fetchAllFileNames() {
  const res = await fetch(`${baseProxy}/list-ifc`);
  const files = await res.json();
  return files;
}

function createViewerContainer(id) {
  const div = document.createElement("div");
  div.className = "viewer-container";
  div.id = `viewer-${id}`;
  viewerRoot.appendChild(div);
  return div;
}

async function loadIfcIntoContainer(fileName, container) {
  const components = new OBC.Components();
  const worlds = components.get(OBC.Worlds);

  const world = worlds.create(OBC.SimpleScene, OBC.SimpleCamera, OBC.SimpleRenderer);
  world.scene = new OBC.SimpleScene(components);
  world.renderer = new OBC.SimpleRenderer(components, container);
  world.camera = new OBC.SimpleCamera(components);
  components.init();
  world.scene.setup();
  world.scene.three.background = null;

  const fragments = components.get(OBC.FragmentsManager);
  const fragmentIfcLoader = components.get(OBC.IfcLoader);
  await fragmentIfcLoader.setup();
  fragmentIfcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;

  const fileRes = await fetch(`${baseProxy}/download-ifc?file=${encodeURIComponent(fileName)}`);
  const buffer = await fileRes.arrayBuffer();
  const model = await fragmentIfcLoader.load(new Uint8Array(buffer));
  model.name = fileName;
  world.scene.three.add(model);
  world.camera.controls.fitToSphere();

  console.log(`✅ Viewer cho file ${fileName} đã load`);
}

async function loadAllViewers() {
  const fileNames = await fetchAllFileNames();

  const promises = fileNames.map(async (file, i) => {
    const container = createViewerContainer(i);
    await loadIfcIntoContainer(file, container);
  });

  await Promise.all(promises);
}

document.addEventListener("DOMContentLoaded", loadAllViewers);
