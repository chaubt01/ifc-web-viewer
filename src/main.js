import * as OBC from "@thatopen/components";
import * as WEBIFC from "web-ifc";

// Lấy DOM container
const container = document.getElementById("container");

// Khởi tạo components
const components = new OBC.Components();
const worlds = components.get(OBC.Worlds);

// Tạo scene, renderer, camera
const world = worlds.create(OBC.SimpleScene, OBC.SimpleCamera, OBC.SimpleRenderer);
world.scene = new OBC.SimpleScene(components);
world.renderer = new OBC.SimpleRenderer(components, container);
world.camera = new OBC.SimpleCamera(components);

// Khởi tạo & thiết lập
components.init();
world.scene.setup();
world.camera.controls.setLookAt(10, 10, 10, 0, 0, 0);
world.scene.three.background = null;

// IFC loader
const fragments = components.get(OBC.FragmentsManager);
const fragmentIfcLoader = components.get(OBC.IfcLoader);
await fragmentIfcLoader.setup();
fragmentIfcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;

// 🔁 Proxy server đã deploy trên Render (thay đúng link của bạn nếu khác)
const baseProxy = "https://my-ifc-project.onrender.com";

// Lấy danh sách tên file IFC
async function fetchAllFileNames() {
  const res = await fetch(`${baseProxy}/list-ifc`);
  const files = await res.json();
  return files;
}

// Load tất cả các file IFC
async function loadAllIfcs() {
  try {
    const start = performance.now(); // Bắt đầu đếm thời gian

    const fileNames = await fetchAllFileNames();
    console.log("📂 Danh sách file IFC:", fileNames);

    for (const fileName of fileNames) {
      const fileRes = await fetch(`${baseProxy}/download-ifc?file=${encodeURIComponent(fileName)}`);
      const buffer = await fileRes.arrayBuffer();
      const model = await fragmentIfcLoader.load(new Uint8Array(buffer));
      model.name = fileName;
      world.scene.three.add(model);
    }

    world.camera.controls.fitToSphere(); // Zoom vừa tất cả mô hình

    const end = performance.now(); // Kết thúc đếm
    console.log(`✅ Đã tải xong ${fileNames.length} file IFC trong ${(end - start).toFixed(2)} ms`);
  } catch (err) {
    console.error("❌ Lỗi khi tải IFC:", err);
  }
}

// Bắt đầu
loadAllIfcs();
