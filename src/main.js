import * as OBC from "@thatopen/components";

const PROXY_URL = "https://my-ifc-project.onrender.com";
const container = document.getElementById("container");

async function main() {
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

  // IFC loader
  const fragments = components.get(OBC.FragmentsManager);
  const fragmentIfcLoader = components.get(OBC.IfcLoader);
  await fragmentIfcLoader.setup();
  fragmentIfcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;

  // Tải danh sách file IFC từ proxy
  async function fetchAllFileNames() {
    try {
      const response = await fetch(`${PROXY_URL}/list-ifc`);
      if (!response.ok) throw new Error("Không thể lấy danh sách file");
      const data = await response.json();
      return data.files || [];
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách file:", err);
      return [];
    }
  }

  // Tải file IFC
  async function loadIFC(fileName) {
    try {
      const start = performance.now();
      console.log(`📂 Đang tải file: ${fileName}`);

      const fileRes = await fetch(`${PROXY_URL}/download-ifc?file=${encodeURIComponent(fileName)}`);
      if (!fileRes.ok) throw new Error(`Không thể tải file ${fileName}`);

      const buffer = await fileRes.arrayBuffer();
      const model = await fragmentIfcLoader.load(new Uint8Array(buffer));
      model.name = fileName;

      // Xóa mô hình cũ
      world.scene.three.children
        .filter(child => child !== world.scene.three)
        .forEach(child => world.scene.three.remove(child));

      world.scene.three.add(model);
      world.camera.controls.fitToSphere();

      const end = performance.now();
      console.log(`✅ Đã tải file ${fileName} trong ${(end - start).toFixed(2)} ms`);
    } catch (err) {
      console.error(`❌ Lỗi khi tải file ${fileName}:`, err);
      alert(`Lỗi khi tải file ${fileName}: ${err.message}`);
    }
  }

  // Hiển thị danh sách file
  async function updateFileList() {
    try {
      const files = await fetchAllFileNames();
      const fileList = document.getElementById("file-list");
      fileList.innerHTML = '<h3>Danh sách file IFC</h3><ul>' +
        files.map(file => `<li onclick="loadIFC('${file}')">${file}</li>`).join("") +
        "</ul>";
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật danh sách file:", err);
    }
  }

  // Đọc query để tự load file
  const urlParams = new URLSearchParams(window.location.search);
  const fileToLoad = urlParams.get("file");
  if (fileToLoad) {
    await loadIFC(fileToLoad);
  } else {
    await updateFileList();
  }

  // Gắn function vào window (để click từ HTML gọi được)
  window.loadIFC = loadIFC;
}

main();
