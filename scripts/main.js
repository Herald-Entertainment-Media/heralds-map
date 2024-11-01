Hooks.once("init", () => {
  if (FilePicker.defaultOptions.extensions) {
    FilePicker.defaultOptions.extensions.push("webp");
  } else {
    FilePicker.defaultOptions.extensions = ["jpg", "jpeg", "png", "webp"];
  }
});

Hooks.on("ready", () => {
  Hooks.on("renderSceneDirectory", (app, html) => {
    const button = document.createElement("button");
    button.classList.add("herald-button");
    button.innerHTML = "<i></i> Heralds Map Beta";

    button.addEventListener("click", async () => {
      await showHeraldDialog();
    });

    const headerActions = html[0].querySelector(".header-actions");
    if (headerActions) {
      headerActions.appendChild(button);
    }
  });
});
/////---------------------------------------------/////
let allData = [];
let linkUrl = "https://herald-api-beta.onrender.com";
async function createFolder(folder) {
  try {
    await FilePicker.createDirectory("data", folder);
    ui.notifications.info(`Folder ${folder} created successfully.`);
  } catch (error) {
    console.log("folder sudah dibuat");
  }
}

async function fetchData() {
  try {
    const response = await fetch(`${linkUrl}/api/data`);
    if (!response.ok) {
      throw new Error("Error fetching assets");
    }
    const datas = await response.json();
    return datas;
  } catch (error) {
    console.error("Failed to fetch assets:", error);
  }
}

async function showHeraldDialog() {
  const datas = await fetchData();

  allData = datas;
  if (!datas || datas.length === 0) {
    console.error("No assets found.");
    return;
  }

  let content = `
    <div class="asset-container">
      <button class="patreon-button" onclick="go_patreon()">Patreon</button>
      <div class="asset-grid">
  `;
  datas.forEach((data) => {
    let thumbnail = `modules/herald-map-beta/assets/thumbnail/${data.thumbnail}`;
    content += `
      <div class="asset-item">
        <p>${data.name}</p>
        <img src="${thumbnail}" alt="${data.name}" class="asset-image" style="" />
        <div class="button-container">
          <button class="preview-button" onclick="showPreviewDialog(${data.preview})">Preview</button>
          <button class="download-button" onclick="showDownloadAssets(${data.id})">Download</button>
        </div>
      </div>
    `;
  });

  content += `
      </div>
    </div>
  `;

  const dialog = new Dialog({
    title: "Herald's-Maps",
    content: content,
    buttons: {},
    default: "close",
    width: 2000,
    height: 1200,
    resizable: true,
  }).render(true);
}

function go_patreon() {
  window.open("https://www.patreon.com/HeraldEntertainment", "_blank");
}

function showPreviewDialog(preview) {
  // let link = `http://localhost:3000${preview}`;
  new Dialog({
    title: "Preview Gambar",
    content: `<img src="${preview}" style="max-width: 100%; height: auto;" />`,
    buttons: {
      close: {
        label: "Close",
        callback: () => console.log("Preview ditutup"),
      },
    },
  }).render(true);
}

async function showDownloadAssets(assetId) {
  let folderDasar = "Herald's-Maps";
  createFolder(folderDasar);
  const assets = await fetchData();
  const selectedAsset = assets.find((data) => data.id == assetId);

  if (!selectedAsset) {
    console.error("Asset not found");
    return;
  }
  let contentItem = ``;
  if (Array.isArray(selectedAsset.assets)) {
    for (let data of selectedAsset.assets) {
      if (data && data.url && data.name) {
        contentItem += `
          <li style="margin-bottom: 10px;">
              <label style="display: flex; align-items: center; justify-content: space-between;">
                  <input type="hidden" class="cekbox-${selectedAsset.id}"  value="" style="margin-right: 10px; font-size: 20px">
                  ${data.name}
                  <div id="progress-${assetId}-${data.id}" style="margin-left:20px">Belum Terdownload</div>
              </label>
          </li>`;
      } else {
        console.warn("Invalid data in selectedAsset.download:", data);
      }
    }
  }

  const checklistItems = `
    <div style="text-align: center; padding: 10px;">
      <h2 style="margin-bottom: 15px;">${selectedAsset.name}</h2>
      <div style="display: flex; flex-direction: column; gap: 10px; padding: 10px; text-align: left;">
          <ul style="list-style-type: none; padding-left: 0;">
              ${contentItem}
          </ul>
      </div>
    </div>  `;
  new Dialog({
    title: "Assets Download",
    content: checklistItems,
    buttons: {},
    default: "cancel",
  }).render(true);

  downloadAssets(assetId);
}

// async function createFolderHerald(name,folder) {
//     try {
//       await FilePicker.createDirectory(`data/${name}`, folder);
//       ui.notifications.info(`Folder ${folder} created successfully.`);
//     } catch (error) {
//       console.log("folder sudah dibuat");
//     }
//   }

function createFolderMap(assetId) {
  console.log(allData);
  let tempdata = {};

  for (const data of allData) {
    if (data.id === assetId) {
      tempdata = data;
      break;
    }
  }
  let release = tempdata.release.split("/");
  let year = release[0];
  let month = release[1];
  createFolder(`Herald's-Maps/${year}`);
  createFolder(`Herald's-Maps/${year}/${month}`);
  createFolder(`Herald's-Maps/${year}/${month}/${tempdata.name}`);
}
async function downloadAssets(assetId) {
  const assets = await fetchData();
  let tempdata = {};

  for (const data of assets) {
    if (data.id === assetId) {
      tempdata = data;
      break;
    }
  }
  let release = tempdata.release.split("/");
  let year = release[0];
  let month = release[1];

  createFolderMap(assetId);

  let directorySave = `Herald's-Maps/${year}/${month}/${tempdata.name}`;
  for (const image of tempdata.assets) {
    const progressId = `progress-${assetId}-${image.id}`;
    document.getElementById(progressId).innerText = "Processing...";
  }
  for (const image of tempdata.assets) {
    const progressId = `progress-${assetId}-${image.id}`;

    let checking = await checkFileExists(directorySave, image.name);
    if (checking == true) {
      document.getElementById(progressId).innerText = "Downloaded";
    } else {
      await downloadAndSaveAsset(directorySave, progressId, image.url);
    }
  }
  let lengthAssets = tempdata.assets.length;
  let assetsReady = 0;
  for (const image of tempdata.assets) {
    let checking = await checkFileExists(directorySave, image.name);
    if (checking == true) {
      assetsReady++;
    }
  }

  if (lengthAssets == assetsReady) {
    let jsonPath = `modules/herald-map-beta/source/${tempdata.json}`;
    createScene(jsonPath);
  }
}

async function checkFileExists(filePath, nameFile) {
  try {
    const result = await FilePicker.browse("data", filePath);
    let existFile = decodeURIComponent(filePath + "/" + nameFile);
    console.log(existFile);
    console.log(result);
    let hasil = false;
    for (let file of result.files) {
      const decodedFile = decodeURIComponent(file);

      console.log(decodedFile);
      if (decodedFile === existFile) {
        hasil = true;
        break;
      }
    }
    return hasil;
  } catch (error) {
    console.error("Error checking file existence:", error);
    return false;
  }
}

async function downloadAndSaveAsset(directory, progressId, assetUrl) {
  let progressBar = document.getElementById(progressId);
  try {
    const localServerUrl = `${linkUrl}/download?url=${encodeURIComponent(
      assetUrl
    )}`;
    console.log("Requesting download from server");

    const response = await fetch(localServerUrl);
    if (!response.ok) throw new Error("Failed to fetch from server");
    progressBar.innerHTML = "Processing...";
    console.log("sedang mendownload...");
    const blob = await response.blob();

    if (!blob || !blob.size) {
      throw new Error("Downloaded blob is empty or invalid");
    }

    const originalFilename = assetUrl.split("/").pop();
    const file = new File([blob], originalFilename, { type: blob.type });

    console.log("File to be saved:", file);
    const result = await FilePicker.upload("data", directory, file);
    console.log("File uploaded successfully:", result);
    progressBar.innerHTML = "Downloaded";
  } catch (err) {
    console.error("Error downloading and saving asset:", err);
  }
}

async function createScene(jsonPath) {
  try {
    const response = await fetch(jsonPath);
    if (!response.ok) throw new Error("Network response was not ok");

    const sceneData = await response.json();
    await Scene.create(sceneData);
    console.log("Scene created successfully:", sceneData);
  } catch (error) {
    console.error("Failed to download or apply scene:", error);
  }
}
