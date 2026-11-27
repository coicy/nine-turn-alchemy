# 目录索引：nine-turn-alchemy-github

## 本目录功能

- 本文件记录正式发布副本的直接子目录和文件用途；历史资源与合并前源码原件集中在 `archive/`。
- 当前产品版本由根目录 `VERSION` 统一声明，变化记录见 `CHANGELOG.md`。

## 版本整理与综合约定

- **正式运行入口**：`index.html`（加载合并产物 `bundle.css` 与 `bundle.js`）；当前代码与资源使用稳定名称，不再把产品版本号写入运行路径。
- **源码模块地图**：全部运行源码已按原加载与层叠顺序综合为 **8 个 CSS + 31 个 JS** 模块；修改前先查阅 `docs/ARCHITECTURE_MAP.md` 直达目标模块。
- **构建与回归**：修改 `bundle-manifest.json` 列出的任意 `.css` / `.js` 后，必须运行 `npm run build` 重新生成 `bundle.css` 与 `bundle.js`，并通过 `npm run verify:core` 校验同步与核心回归。
- **调试与沙箱前置**：`index-warm-cinnabar.html` 保留为散文件调试入口（与 `bundle-manifest.json` 同步）；`verify-simulation.cjs` 与 `verify-value-formula-v104.cjs` 作为共享测试沙箱前置依赖保留在根目录。
- **历史归档**：`archive/` 保存已退出当前运行的资源、预览、合并前源码备份（`archive/merged-warm-cinnabar/`、`archive/consolidated-v220/`）和历史版本验证脚本（`archive/verify-legacy/`）；不得从 `archive/` 复制旧文件覆盖当前运行副本。

## 子目录

- .qa/AGENTS.md
- archive/AGENTS.md
- archive/consolidated-v220/AGENTS.md
- archive/merged-warm-cinnabar/AGENTS.md
- archive/opening-story-legacy/AGENTS.md
- archive/verify-legacy/AGENTS.md
- assets/AGENTS.md
- character-style/AGENTS.md
- docs/AGENTS.md
- previews/AGENTS.md

## 文件索引

### 入口、构建与版本配置
- `index.html`：正式浏览器运行入口（加载 `bundle.css` + `bundle.js`）。
- `index-warm-cinnabar.html`：温暖金石散文件调试入口。
- `data-policy.html`：试玩数据收集说明页。
- `build-bundle.cjs`：零依赖前端打包与同步校验脚本。
- `bundle-manifest.json`：正式入口合并清单（8 CSS + 31 JS 精确加载顺序）。
- `bundle.css`、`bundle.js`：正式入口合并产物（由 `build-bundle.cjs` 生成，勿手改）。
- `VERSION`、`CHANGELOG.md`、`PROJECT_STAGE.md`、`TODOLIST.md`、`README.md`、`LICENSE`、`package.json`、`package-lock.json`、`.gitignore`、`warm-cinnabar-experiment.md`：版本、工程与说明文档。
- `alchemy-preview.html`、`asset-preview.html`、`pill-style-preview.html`、`reputation-review.html`、`scene-anchor-reference.html`：专项静态预览与参考页。
- `risk-curve-order-estimate.json`、`value-estimate.json`：数值估算参考数据。

### 8 个样式模块（详见 `docs/ARCHITECTURE_MAP.md`）
- `styles.css`、`game-shell.css`、`unified-theme.css`、`world-ui.css`、`furnace-view.css`、`warm-cinnabar-experiment.css`、`value-preview.css`、`warm-cinnabar-ui.css`。

### 31 个脚本模块（详见 `docs/ARCHITECTURE_MAP.md`）
- 核心与数据模型：`save-slots.js`、`telemetry.js`、`customer-catalog.js`、`customers.js`、`customer-view.js`、`pill-palette.js`、`entry-images.js`、`local-image-sources.js`、`asset-loader.js`、`crafts.js`、`economy.js`、`warm-cinnabar-props.js`、`lease.js`、`campaign.js`、`ritual-brush.js`、`app.js`、`simulation.js`、`dialogue-content.js`、`dialogue-core.js`、`value-preview.js`。
- 前端界面与场景运行时：`ui-runtime.js`、`campaign-ui.js`、`alchemy-assets.js`、`economy-ui.js`、`world-layout.js`、`game-shell.js`、`scene2d.js`、`world-ui.js`、`furnace-view.js`、`warm-cinnabar-ui.js`、`dialogue-ui.js`。

### 验证与数值估算脚本
- 数值估算与共享沙箱：`estimate-orders.cjs`、`estimate-risk-orders.cjs`、`estimate-values.cjs`、`verify-simulation.cjs`、`verify-value-formula-v104.cjs`。
- 核心 Node 回归：`verify-logic-fixes.cjs`、`verify-economy.cjs`、`verify-crafts.cjs`、`verify-save-slots.cjs`、`verify-campaign.cjs`、`verify-tools.cjs`、`verify-progression.cjs`、`verify-reputation.cjs`、`verify-special-customers.cjs`、`verify-shell.cjs`、`verify-telemetry.cjs`、`verify-painted-scenes.cjs`。
- 浏览器与专项核查：`verify-animation-browser.cjs`、`verify-asset-loading.cjs`、`verify-counter-browser.cjs`、`verify-counter-scale.cjs`、`verify-equipment-browser.cjs`、`verify-feedback-acceptance.cjs`、`verify-feedback-browser.cjs`、`verify-herb-tray.cjs`、`verify-journal-browser.cjs`、`verify-loop-flow-browser.cjs`、`verify-observation-near.cjs`、`verify-onboarding-browser.cjs`、`verify-online.cjs`、`verify-pill-shape-browser.cjs`、`verify-reputation-browser.cjs`、`verify-room-browser.cjs`、`verify-save-slots-browser.cjs`、`verify-scene2d-browser.cjs`、`verify-theme-transitions.cjs`。
