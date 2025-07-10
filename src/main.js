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
world.camera.controls.setLookAt(10, 10, 10, 0, 0, 0);
world.scene.three.background = null;

const fragments = components.get(OBC.FragmentsManager);
const fragmentIfcLoader = components.get(OBC.IfcLoader);
await fragmentIfcLoader.setup();
fragmentIfcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;

// 🔁 Thay đổi URL proxy tại đây
const baseProxy = "https://my-ifc-project.onrender.com";

async function fetchAllFileNames() {
  const res = await fetch(`${baseProxy}/list-ifc`);
  const files = await res.json();
  return files;
}

async function loadAllIfcs() {
  try {
    const fileNames = await fetchAllFileNames();
    console.log("📂 File IFC:", fileNames);
    for (const fileName of fileNames) {
      const fileRes = await fetch(`${baseProxy}/download-ifc?file=${encodeURIComponent(fileName)}`);
      const buffer = await fileRes.arrayBuffer();
      const model = await fragmentIfcLoader.load(new Uint8Array(buffer));
      model.name = fileName;
      world.scene.three.add(model);
    }
    world.camera.fitToScene();
  } catch (err) {
    console.error("❌ Lỗi:", err);
  }
}

loadAllIfcs();
