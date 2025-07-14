import * as OBC from "@thatopen/components";

const PROXY_URL = "https://my-ifc-project.onrender.com";


const container = document.getElementById("container");
const components = new OBC.Components();
const worlds = components.get(OBC.Worlds);
const world = worlds.create(OBC.SimpleScene, OBC.SimpleCamera, OBC.SimpleRenderer);

world.scene = new OBC.SimpleScene(components);
world.renderer = new OBC.SimpleRenderer(components, container);
world.camera = new OBC.SimpleCamera(components);

components.init();
world.scene.setup();
world.camera.controls.setLookAt(10, 10, 10, 0, 0, 0);
world.scene.three.background = null;

const fragments = components.get(OBC.FragmentsManager);
const fragmentIfcLoader = components.get(OBC.IfcLoader);
await fragmentIfcLoader.setup();
fragmentIfcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;

async function fetchAllFileNames() {
  try {
    const res = await fetch(`${PROXY_URL}/list-ifc`);
    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error("❌ Không lấy được danh sách:", err);
    return [];
  }
}

async function loadIFC(fileName) {
  try {
    const start = performance.now();
    const fileRes = await fetch(`${PROXY_URL}/download-ifc?file=${encodeURIComponent(fileName)}`);
    const buffer = await fileRes.arrayBuffer();
    const model = await fragmentIfcLoader.load(new Uint8Array(buffer));
    model.name = fileName;

    world.scene.three.children
      .filter(child => child !== world.scene.three)
      .forEach(child => world.scene.three.remove(child));

    world.scene.three.add(model);
    world.camera.controls.fitToSphere();

    console.log(`✅ Tải xong ${fileName} sau ${(performance.now() - start).toFixed(2)} ms`);
  } catch (err) {
    console.error(`❌ Lỗi tải ${fileName}:`, err);
  }
}

async function updateFileList() {
  const files = await fetchAllFileNames();
  const list = document.getElementById("file-list");
  list.innerHTML = '<h3>Danh sách IFC</h3><ul>' + 
    files.map(f => `<li onclick="loadIFC('${f}')">${f}</li>`).join("") +
    '</ul>';
}

const urlParams = new URLSearchParams(window.location.search);
const fileToLoad = urlParams.get("file");
if (fileToLoad) {
  loadIFC(fileToLoad);
} else {
  updateFileList();
}
