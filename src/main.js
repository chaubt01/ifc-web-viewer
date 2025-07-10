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

const baseProxy = "https://my-ifc-project.onrender.com"; // Địa chỉ proxy đã deploy

async function fetchAllFileNames() {
  const res = await fetch(`${baseProxy}/list-ifc`);
  const files = await res.json(); // Nhận mảng tên file từ proxy
  return files;
}

async function loadAllIfcs() {
  try {
    const fileNames = await fetchAllFileNames();
    console.log("📂 Tất cả file IFC:", fileNames);

    for (const fileName of fileNames) {
      const fileRes = await fetch(`${baseProxy}/download-ifc?file=${encodeURIComponent(fileName)}`);
      const buffer = await fileRes.arrayBuffer();
      const model = await fragmentIfcLoader.load(new Uint8Array(buffer));
      model.name = fileName;
      world.scene.three.add(model);
    }

    world.camera.fitToScene(); // Zoom vừa mô hình
  } catch (err) {
    console.error("❌ Lỗi tải IFC:", err);
  }
}

loadAllIfcs();
