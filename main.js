const { app, core } = require("photoshop");
const { entrypoints, storage } = require("uxp");
const { nextAvailableName } = require("./filename");

const fs = storage.localFileSystem;
const STORAGE_KEY = "quick-png-export.folder-token";
const FORMAT_KEY = "quick-png-export.format";
const FORMAT_OPTIONS = {
  png: {
    label: "PNG",
    extension: "png",
    method: "png",
    options: { compression: 6, interlaced: false },
  },
  jpg: {
    label: "JPEG",
    extension: "jpg",
    method: "jpg",
    options: { quality: 12, embedColorProfile: true },
  },
};
const state = {
  folder: null,
  exporting: false,
};

function getElement(id) {
  return document.getElementById(id);
}

function setStatus(message, kind = "info") {
  const status = getElement("status");
  if (!status) return;

  status.textContent = message;
  status.className = `status status-${kind}`;
}

function setFolderDisplay(label) {
  const path = getElement("folder-path");
  if (!path) return;

  path.textContent = label;
  path.title = label;
}

function setBusy(isBusy) {
  const chooseButton = getElement("choose-folder");
  const exportButton = getElement("export-png");
  const formatSelect = getElement("format-select");
  if (chooseButton) chooseButton.disabled = isBusy;
  if (formatSelect) formatSelect.disabled = isBusy;
  if (exportButton) {
    exportButton.disabled = isBusy;
    exportButton.textContent = isBusy ? "导出中…" : "导出当前画面";
  }
}

function requireDocument() {
  if (!app.documents || app.documents.length === 0) {
    throw new Error("请先在 Photoshop 中打开一个文档。");
  }

  return app.activeDocument;
}

async function describeFolder(folder) {
  try {
    return fs.getNativePath(folder);
  } catch (error) {
    return folder.name || "已选择输出文件夹";
  }
}

async function restoreFolder() {
  const token = localStorage.getItem(STORAGE_KEY);
  if (!token) {
    setFolderDisplay("未选择输出文件夹");
    return;
  }

  try {
    const folder = await fs.getEntryForPersistentToken(token);
    if (!folder || !folder.isFolder) {
      throw new Error("保存的路径不是文件夹");
    }

    state.folder = folder;
    setFolderDisplay(await describeFolder(folder));
    setStatus("输出文件夹已就绪。", "success");
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    state.folder = null;
    setFolderDisplay("未选择输出文件夹");
    setStatus("上次的文件夹不可用，请重新选择。", "warning");
  }
}

function getSelectedFormat() {
  const value = getElement("format-select").value;
  return FORMAT_OPTIONS[value] || FORMAT_OPTIONS.png;
}

function restoreFormat() {
  const savedFormat = localStorage.getItem(FORMAT_KEY);
  if (savedFormat && FORMAT_OPTIONS[savedFormat]) {
    getElement("format-select").value = savedFormat;
  }
}

async function chooseFolder() {
  const folder = await fs.getFolder();
  if (!folder) return;

  const token = await fs.createPersistentToken(folder);
  localStorage.setItem(STORAGE_KEY, token);
  state.folder = folder;
  setFolderDisplay(await describeFolder(folder));
  setStatus("输出文件夹已保存。", "success");
}

async function getExistingFileNames(folder) {
  const entries = await folder.getEntries();
  return entries.filter((entry) => entry.isFile).map((entry) => entry.name);
}

async function createUniqueFile(folder, documentName, existingNames, date, format) {
  const fileName = nextAvailableName(
    documentName,
    existingNames,
    date,
    format.extension
  );
  return {
    file: await folder.createFile(fileName),
    fileName,
  };
}

async function exportPng() {
  if (state.exporting) return;

  state.exporting = true;
  setBusy(true);
  setStatus("正在导出当前画面…", "info");

  try {
    const document = requireDocument();
    if (!state.folder) {
      throw new Error("请先选择输出文件夹。");
    }

    const format = getSelectedFormat();
    const existingNames = await getExistingFileNames(state.folder);
    const { file, fileName } = await createUniqueFile(
      state.folder,
      document.name,
      existingNames,
      new Date(),
      format
    );

    await core.executeAsModal(
      async () => {
        await document.saveAs[format.method](
          file,
          format.options,
          true
        );
      },
      { commandName: "快速导出" }
    );

    setStatus(`已导出：${fileName}`, "success");
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    setStatus(message, "error");
  } finally {
    state.exporting = false;
    setBusy(false);
  }
}

function bindUi() {
  getElement("choose-folder").addEventListener("click", () => {
    chooseFolder().catch((error) => {
      const message = error && error.message ? error.message : String(error);
      setStatus(`选择文件夹失败：${message}`, "error");
    });
  });

  getElement("export-png").addEventListener("click", () => {
    void exportPng();
  });

  getElement("format-select").addEventListener("change", () => {
    const format = getSelectedFormat();
    localStorage.setItem(FORMAT_KEY, getElement("format-select").value);
    setStatus(`导出格式：${format.label}`, "info");
  });

  restoreFormat();
  restoreFolder().catch((error) => {
    setStatus(`读取保存路径失败：${error.message || error}`, "error");
  });
}

entrypoints.setup({
  panels: {
    quickPngPanel: {
      show() {
        restoreFolder().catch(() => undefined);
      },
    },
  },
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bindUi, { once: true });
} else {
  bindUi();
}
