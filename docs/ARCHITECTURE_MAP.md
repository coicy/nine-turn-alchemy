# 九转丹坊源码模块地图（V220 综合版）

历史迭代积累的 125 个零散运行文件（54 CSS + 71 JS）已按原有加载与层叠顺序综合收口为 **8 个样式模块 + 31 个脚本模块**（原件备份于 `archive/merged-warm-cinnabar/` 与 `archive/consolidated-v220/`）。修改业务或样式前先查下表直达目标模块。

## 一、运行与打包入口

- **正式入口**：`index.html`（只加载 `bundle.css` + `bundle.js` 双产物）
- **合并清单**：`bundle-manifest.json`（8 CSS + 31 JS，严格定义加载顺序）
- **打包与回归命令**：修改任意 `.css` / `.js` 后运行 `npm run build`，并通过 `npm run verify:core` 一键校验
- **散文件调试入口**：`index-warm-cinnabar.html`（与 `bundle-manifest.json` 完全同步）

## 二、8 大样式模块（按层叠顺序）

1. **`styles.css`**：基础全局、模拟、战役与基础美术资产样式（含原 `simulation.css`、`campaign.css`、`art-assets.css`、`alchemy-assets.css`）
2. **`game-shell.css`**：应用主壳、丹房 2D 场景、药格与手札样式（含原 `room-ui.css`、`scene2d.css`、`herb-tray.css`、`painted-scenes.css`、`scene-props.css`、`journal-ui.css`、`counter-people.css` 等）
3. **`unified-theme.css`**：统一基础主题变量与文字排版（同时供 `data-policy.html` 独立引用）
4. **`world-ui.css`**：顾客、引导、存档槽位、炼丹概率、药囊与世界信息界面样式（含原 `customers.css`、`onboarding.css`、`save-slots.css`、`refine-odds.css`、`pill-bag.css`、`information-ui.css`、`ui-revision.css` 等）
5. **`furnace-view.css`**：工作台、丹炉视角、丹体、主菜单、加载页、房租与手感反馈样式（含原 `workbench.css`、`pill-body.css`、`furnace-surface.css`、`loop.css`、`main-menu.css`、`lease.css`、`game-feel.css` 等）
6. **`warm-cinnabar-experiment.css`**：温暖金石正式主视觉皮肤与分栏导航（含原 `navigation-split.css`）
7. **`value-preview.css`**：寄售、价值预览与坊市来客样式（含原 `consignment-ui.css`、`merchant-visit.css`、`market-merchants.css`）
8. **`warm-cinnabar-ui.css`**：温暖金石界面组件、动效、药匣侧栏、对话与造物样式（含原 `warm-cinnabar-motion.css`、`warm-cinnabar-stock.css`、`dialogue.css`、`crafts.css`）

## 三、31 个脚本模块（按业务域划分）

### 1. 核心数值、经营模型与测试锚点（独立模块，兼顾 Node 回归直读）
- **炼丹核心**：`app.js`、`simulation.js`、`ritual-brush.js`、`value-preview.js`
- **经济与战役**：`economy.js`、`lease.js`、`campaign.js`、`crafts.js`（含温暖金石造物图集映射）
- **顾客与剧情模型**：`customer-catalog.js`、`customers.js`、`dialogue-content.js`、`dialogue-core.js`
- **基础数据与存档**：`save-slots.js`、`telemetry.js`、`pill-palette.js`、`entry-images.js`、`local-image-sources.js`、`asset-loader.js`（含温暖金石立绘与丹药图集映射）、`warm-cinnabar-props.js`

### 2. 前端界面、场景与交互运行时（已合并历史补丁）
- **`ui-runtime.js`**：丹体视图与通用 UI 运行时（含 `pill-body.js`）
- **`campaign-ui.js`** / **`economy-ui.js`** / **`game-shell.js`** / **`customer-view.js`**：战役面板、经济面板、主壳与顾客视图
- **`alchemy-assets.js`**：开场对话、美术与炼丹视觉资源装配（含 `dialogue-opening.js`、`art-assets.js`）
- **`world-layout.js`**：装备面板、药囊、寄售袋与世界布局（含 `equipment-ui.js`、`pill-bag.js`、`consignment-bag.js`）
- **`scene2d.js`**：丹房 2D 场景、药盘、坊市场景与场景物件（含 `room-ui.js`、`scene-feedback.js`、`refine-animation.js`、`observation-near.js`、`herb-tray.js`、`market-merchants.js`、`market-scene.js`、`scene-props.js`）
- **`world-ui.js`**：手札、寄售 UI、柜台人物、引导、存档 UI、概率面板与设置（含 `journal-ui.js`、`consignment-ui.js`、`counter-people.js`、`onboarding.js`、`save-slots-ui.js`、`commission-motion.js`、`refine-odds.js`、`information-ui.js`、`ui-settings.js`）
- **`furnace-view.js`**：工作台、丹炉视角、引导、投影、炉盖层、场景运行时与主循环（含 `workbench.js`、`furnace-guidance.js`、`scene-projection.js`、`scene-lid-layer.js`、`scene-runtime.js`、`furnace-surface.js`、`loop.js`）
- **`warm-cinnabar-ui.js`**：温暖金石导航与药匣侧栏交互、主菜单、手感、炉火与炼制演出（含 `warm-cinnabar-stock.js`、`main-menu.js`、`game-feel.js`、`furnace-fire.js`、`refine-performance.js`）
- **`dialogue-ui.js`**：对话界面、行商来访与造物收购交互（含 `merchant-visit.js`、`craft-buyer.js`）
