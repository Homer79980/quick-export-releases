# 快速导出（Photoshop UXP 插件）

这是一个 Photoshop UXP 面板插件：选择一次输出文件夹和格式后，点击按钮即可把当前文档的可见合成内容导出为图片。

## 功能

- 导出当前文档的可见图层合成，不改变原 PSD/PSB 文档。
- 支持 PNG、JPEG。
- 文件名格式：`文档名_YYYYMMDD_HHmmss.扩展名`。
- 如果同名文件已存在，自动追加 `_001`、`_002` 等序号。
- 输出文件夹通过 Photoshop 的文件夹选择器授权，并使用持久 token 记住；插件不会直接读取用户未授权的任意路径。

## 在 Photoshop 中加载

1. 安装并打开 Adobe UXP Developer Tool。
2. 选择 **Add Plugin**，选中本目录的 `manifest.json`。
3. 点击 **Load**，在 Photoshop 的 **窗口 > 扩展功能（UXP）** 中打开“快速导出”。
4. 在面板中选择输出文件夹，再点击“导出当前画面”。

## 本地验证

在本目录运行：

```powershell
node tests/filename.test.js
node tests/ui_layout.test.js
```

Photoshop 端的真实导出需要在 UXP Developer Tool/Photoshop 中运行；普通 Node 环境没有 `photoshop` 与 `uxp` 模块。

## 面板图标资源

当 manifest 声明 `scale: [1, 2]`，Photoshop 会读取带 `@1x.png`、`@2x.png` 后缀的文件；无后缀 PNG 不能代替 `@1x.png`。

```powershell
node tests/icon_assets.test.js
```

此检查会验证 manifest 引用的倍率文件存在、尺寸正确，且为 8 位 RGB/RGBA PNG。生成脚本 `tools/make_icons.py` 会同时产出预览文件及倍率文件。
