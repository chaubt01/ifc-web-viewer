import * as OBC from "@thatopen/components";

const NEXTCLOUD_URL = "https://bimtechcloud.ddns.net/public.php/webdav";
const SHARE_TOKEN = "bEYRrq8C8y2xM4q";
const SHARE_PASSWORD = "your_share_password"; // Thay bằng mật khẩu thực tế

const container = document.getElementById("container");

// Khởi tạo components
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

// Lấy danh sách file IFC
async function fetchAllFileNames() {
  try {
    const response = await fetch(NEXTCLOUD_URL, {
      method: "PROPFIND",
      headers: {
        Authorization: `Basic ${btoa(`${SHARE_TOKEN}:${SHARE_PASSWORD}`)}`,
        "Depth": "1",
        "Content-Type": "application/xml",
      },
      body: `<?xml version="1.0" encoding="utf-8" ?>
        <d:propfind xmlns:d="DAV:">
          <d:prop><d:resourcetype /></d:prop>
        </d:propfind>`,
    });

    if (!response.ok) throw new Error("Không thể lấy danh sách file");
    const data = await response.text();
    const files = data.match(/<d:href>[^<]+<\/d:href>/g)
      .map(href => decodeURIComponent(href.replace(/<d:href>|<\/d:href>/g, "").split("/").pop()))
      .filter(name => name && name.endsWith(".ifc"));
    return files;
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách file:", err);
    return [];
  }
}

// Tải và hiển thị file IFC
async function loadIFC(fileName) {
  try {
    const start = performance.now();
    console.log(`📂 Đang tải file: ${fileName}`);

    const fileRes = await fetch(`${NEXTCLOUD_URL}/${encodeURIComponent(fileName)}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${btoa(`${SHARE_TOKEN}:${SHARE_PASSWORD}`)}`,
      },
    });

    if (!fileRes.ok) throw new Error(`Không thể tải file ${fileName}`);

    const buffer = await fileRes.arrayBuffer();
    const model = await fragmentIfcLoader.load(new Uint8Array(buffer));
    model.name = fileName;

    // Xóa các mô hình cũ
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

// Cập nhật danh sách file
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

// Kiểm tra query parameter để tải file
const urlParams = new URLSearchParams(window.location.search);
const fileToLoad = urlParams.get("file");
if (fileToLoad) {
  loadIFC(fileToLoad);
} else {
  updateFileList();
}