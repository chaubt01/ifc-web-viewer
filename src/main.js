import * as OBC from "@thatopen/components";
import * as WEBIFC from "web-ifc";

const baseProxy = "https://my-ifc-project.onrender.com";
const container = document.getElementById("container");
const tabsContainer = document.getElementById("tabs");

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

let models = {}; // lưu mô hình đã load để không cần load lại

async function fetchAllFileNames() {
  const res = await fetch(`${baseProxy}/list-ifc`);
  return await res.json();
}

async function loadModel(fileName) {
  if (models[fileName]) return models[fileName];

  const res = await fetch(`${baseProxy}/download-ifc?file=${encodeURIComponent(fileName)}`);
  const buffer = await res.arrayBuffer();
  const model = await fragmentIfcLoader.load(new Uint8Array(buffer));
  model.name = fileName;
  models[fileName] = model;
  return model;
}

async function switchModel(fileName) {
  // Xóa mô hình cũ
  world.scene.three.clear();

  const model = await loadModel(fileName);
  world.scene.three.add(model);
  world.camera.controls.fitToSphere();
}

function createTabs(fileNames) {
  fileNames.forEach((file, i) => {
    const tab = document.createElement("div");
    tab.textContent = file;
    tab.classList.add("tab");
    if (i === 0) tab.classList.add("active");

    tab.addEventListener("click", async () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      await switchModel(file);
    });

    tabsContainer.appendChild(tab);
  });
}

async function init() {
  const fileNames = await fetchAllFileNames();
  if (!fileNames.length) return alert("Không có file IFC!");

  createTabs(fileNames);
  await switchModel(fileNames[0]); // load mô hình đầu tiên
}

document.addEventListener("DOMContentLoaded", init);
