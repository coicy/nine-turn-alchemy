# 《九转丹坊》试玩与体验优化待办清单 (TODOLIST)

> 整理日期：2026-11-23  
> 评测基准版本：`V219` (交付基线)  
> 评测环境：桌面端 Chrome/Edge (1440×900, 978×896) + 移动端视口 (390×844、390×600 触屏模式)  
> 审查状态：2026-11-23 已完成审查。结论见 [TODOLIST 审查报告](../../Evidence/current/TODOLISTReviewReport20261123.md) 与 [真实性核对](../../Evidence/current/TodoRealityAudit20261123.md)；本清单已按审查结论更新，汇总见文末「审查后状态汇总」。  
> 执行安排：[TODOLIST 执行计划](../../Docs/reviews/TODOLIST执行计划20261123.md)（分阶段顺序、证据要求与产物路径）。

---

## 优先级说明
- **P0（阻断 / 易损缺陷）**：直接导致运行时控制台报错、影响流程或造成硬性误触的问题。
- **P1（交互断点 / 体验毛刺）**：影响连贯手感、键盘/触屏流转受阻、容器溢出截断文字。
- **P2（打磨与风格化提升）**：提升视听沉浸感、手感增强与长线商业化优化。

## 状态说明（2026-11-23 审查后）
- 条目状态以各条「审查结论」及文末汇总表为准；原「优先级」为用户最初评估，保留以便追溯。
- `[x]` 表示审查后关闭；`[ ]` 表示仍需复核、观察或等待证据。
- 审查只确认当前证据能支持的结论，历史截图、静态代码检查与单次演示不等于 V219 全量验收。

---

## 一、 P0 级待办：运行稳定性与物理误触修复

- [x] **1.1 修复 `economy.js:65` 冷启动未判空报错**（审查后关闭）
  - **现象**：打开 `index.html` 尚未点击“开始营业”时，控制台抛出 `Uncaught TypeError: Cannot read properties of null (reading 'economy')`。
  - **根因**：模块加载阶段部分渲染监听器被提前触发调用了 `ensure(c)`，而此时 `campaign` 对象仍为 `null`。
  - **修复建议**（原始记录）：在 `economy.js` 的 `ensure(c)` 入口增加空值防护守卫：
    ```javascript
    function ensure(c) {
      if (!c) return null;
      // ... 原有初始化逻辑
    }
    ```
  - **审查结论（2026-11-23）**：真实存在，代码层已修复。`economy.js:65` 已有 `if(!c||typeof c!=='object')return null` 守卫，`verify-economy.cjs` 经济回归通过。按审查报告关闭此待办并保留回归记录；浏览器冷启动控制台复验仍待补（当前环境缺 `playwright`，见 [边界交互修复验证](../../Evidence/current/BoundaryInteractionFixValidation.md)），不得据静态检查宣称 V219 已全量验收。

- [ ] **1.2 移动端全面屏底部安全区误触 (Safe Area Inset)**（保留：真机复核，暂不列 P0）
  - **现象**：在手机（390×844）竖屏下，开场对白框下方的“回看”、“设置”、“跳过开场”三枚按钮过于贴近屏幕物理底边，与全面屏底部手势条（Home Indicator）重叠，极易误触系统“返回主屏/切任务”手势。
  - **涉及文件**：`dialogue.css`、`main-menu.css`
  - **修复建议**（原始记录）：针对移动端对白和底部固定操作栏补充安全边距：
    ```css
    @media (max-width: 650px) {
      .dialogue-footer, .dialogue-actions {
        padding-bottom: max(16px, env(safe-area-inset-bottom));
      }
    }
    ```
  - **审查结论（2026-11-23）**：问题方向成立，现象未证实。主菜单、炉前判断区、场景库存和底部操作区已使用 `env(safe-area-inset-bottom)`，现有截图未显示按钮与手势条重叠。保留为真机复核项，暂不列 P0；实施前须核对对白栏的真实 DOM 类名（原始建议中的 `.dialogue-footer`、`.dialogue-actions` 在 `dialogue.css` 中未直接命中）。
  - **最小补丁（2026-11-23）**：已针对真实 `#gameDialogue footer` 补充移动端 `padding-bottom: max(16px, env(safe-area-inset-bottom))`，并为脱离 footer 的固定定位 `#dialogueNext` 补充安全区偏移；浏览器/真机复验前仍不关闭本条。记录见 `../../Evidence/current/TodoExecutionPhase2/SafeAreaPatch20261123.md`。

---

## 二、 P1 级待办：交互流转与容器排版优化

- [x] **2.1 弹窗特殊阅读层焦点回退复核**（原：修复弹窗焦点丢失与键盘 Enter 扇火中断问题；保留并改写）
  - **现象**（原始记录）：键盘流玩家习惯按 `Enter` 快速扇火催炼；但在打开“看丹”、“炉谱”或“来客手书”并关闭后，键盘焦点停留在已隐藏的关闭按钮上，导致直接按 `Enter` 无法触发催炼，造成“游戏卡死”假象。
  - **修复建议**（原始记录）：在 `AlchemyViewState.close()` 或对应弹窗关闭回调中，主动归还焦点：
    ```javascript
    document.querySelector('.furnace-fire, #fireObject')?.focus({ preventScroll: true });
    ```
  - **补充**（原始记录）：弹窗处于开启状态时，在弹窗角落增加明显的 `按 Esc 合上` 或快捷键提示。
  - **审查结论（2026-11-23）**：部分成立，原描述过重。`game-shell.js` 已有 `focusKey`/`restore` 栈式入口焦点记录与恢复，`dialogue-ui.js` 有 `restoreFocus()`，委托来笺 Escape 关闭已补齐。条目改写为“特殊阅读层焦点回退复核”：继续复核丹匣详情、炉谱和短面板路径，不继续描述为“所有关闭后都停在隐藏按钮”；原始代码建议仅为兜底示意，不应照抄覆盖现有机制。
  - **执行结论（2026-11-23）**：本地浏览器已复核丹匣、炉谱、法器短面板、炉前“炉谱”及成丹后的“看丹”关闭路径，焦点均回到可用入口，按当前计划关闭。记录见 `../../Evidence/current/TodoExecutionPhase2/ReadingLayerFocusValidation20261123.md`。

- [x] **2.2 丹匣决策区多尺寸截图验收**（原：重构右下角丹匣抽屉决策按钮排版；已关闭）
  - **现象**：在 900px 左右高度（笔记本/分屏）或手机屏高下，丹药入匣后展开卡片（“提交委托”、“抵料后出售 / 立即出售”、“寄售”及回款说明）因垂直堆叠过长，超出抽屉容器高度，出现细小原生内滚动条，“寄售”按钮被裁切在可视区外。
  - **涉及文件**：`loop.css`、`loop.js`、`consignment-ui.css`
  - **修复建议**（原始记录）：
    - 将“提交委托”与“立即出售”改为左右双列栅格并排（`grid-template-columns: 1fr 1fr`）；
    - 下方单行放置“寄售”与回款周期说明；
    - 确保在 800px 高度视口内完全无需滚动即可完整呈现所有操作项。
  - **审查结论（2026-11-23）**：真实存在，当前已部分修复。`loop.css` 已将 `.loop-trades` 改为两列 `repeat(2,minmax(0,1fr))`，寄售 `grid-column:1/-1` 独占一行；`.scene-stock`、`.herb-materials` 仍有 `overflow:auto`，其他阅读层待查。历史 V193 截图只作风险依据。**关闭条件**：重拍 V219 在 800px、600px 和 390×844 下的截图，确认提交、出售、寄售与回款说明无需滚动即可完整呈现。
  - **执行结论（2026-11-23）**：真实炼化并展开丹匣决策区，在 `2344×1390`、`800×600`、`390×844`、`390×600` 下均确认决策按钮与回款说明完整可见，面板 `clientHeight=scrollHeight`，无内部滚动。记录见 `../../Evidence/current/TodoExecutionPhase2/PillDecisionLayoutValidation20261123.md`；可用页面为 `http://127.0.0.1:8802/Evidence/current/TodoExecutionPhase2/viewport-matrix.html`。

- [x] **2.3 非对白阅读层命中与失活复核**（原：规范化模态层下的底层点击穿透与失活状态；已关闭）
  - **现象**：当对白层（`dialog`）或全屏书册升起时，底层柜台上的药包或委托纸被上层透明边缘阻挡（标记为 `[occluded]`），但底层鼠标指针仍保持手型（`cursor: pointer`），引起玩家误判。
  - **修复建议**（原始记录）：对白或模态层激活时，显式为底层交互容器添加 `pointer-events: none; opacity: 0.85;`，并在关闭时恢复。
  - **审查结论（2026-11-23）**：真实存在，当前已部分修复。`dialogue.css` 已有 `body:has(#gameDialogue[open]) .engine-viewport{pointer-events:none!important;cursor:default!important}`，`game-shell.js` 有 `inert` 逻辑。保留 P1，继续逐层检查其他阅读层、短面板和局部柜台层的命中与光标状态。
  - **执行结论（2026-11-23）**：对白层、柜台委托纸笺、炉谱、丹匣和法器面板均完成实际点击、光标与失活复核；法器面板改为完全模态，遮罩出现、导航/场景进入 `inert`，底层收纳匣不可命中，关闭后焦点回到“丹药与法器”入口。记录见 `../../Evidence/current/TodoExecutionPhase2/HitCursorMatrixValidation20261123.md`。

---

## 三、 P2 级待办：移动端与视听感打磨

- [ ] **3.1 移动端触觉震动反馈 (Web Haptics)**（降级：增强项观察，非阻断缺陷）
  - **现状**：手机端催炼仅依赖画面动画和音效。
  - **优化**（原始记录）：在 `game-feel.js` 中接入 `navigator.vibrate`（轻度震动），为核心博弈行为赋予手感：
    - 扇火催炼：`navigator.vibrate(15)`（轻微短震）；
    - 炼化成功/大成功：`navigator.vibrate([20, 50, 30])`（轻快双震）；
    - 炸丹/受损：`navigator.vibrate(120)`（沉重顿挫长震）；
    - 极大地放大“九转博弈”过程中心跳加速的单手握持反馈。
  - **审查结论（2026-11-23）**：代码中确有此功能缺失（全库未发现 `navigator.vibrate`），但体验收益未验证。降级为增强项观察，不作为阻断缺陷；实施前需确认目标浏览器覆盖率、桌面端无效场景与减少动态设置偏好。
  - **执行结论（2026-11-23）**：已完成浏览器能力评估；当前静态 Web 交付不接入触觉震动，暂缓实现。`Navigator.vibrate()` 覆盖有限，iPhone/iPad WebKit 相关请求记录为 WONTFIX，且项目已有 `prefers-reduced-motion` 动效降级。记录见 `../../Evidence/current/TodoExecutionPhase2/HapticsFeasibility20261123.md`。

- [x] **3.2 移动端主菜单木匾横幅比例**（降级：视觉偏好观察，已完成复核）
  - **现状**（原始记录）：顶部“九转丹坊”木匾原本针对 16:9 横屏构图，在 390px 竖屏下宽度占比过大、两端过于贴近屏幕侧边。
  - **优化**（原始记录）：在 `main-menu.css` 的 `@media (max-width: 650px)` 中微调木匾 `max-width: 82vw;` 并稍微上移，留出两侧与顶部的呼吸感。
  - **审查结论（2026-11-23）**：未确认现存问题。`main-menu.css:137` 已为 `width:min(420px,82vw)`，移动端截图显示木匾两侧有留白。降为视觉偏好观察，不进入缺陷待办。
  - **执行结论（2026-11-23）**：390×844 固定视口实测木匾宽度 319.79px，左右各 35.10px 留白，符合现有 CSS 约束；不修改 CSS，关闭观察项。记录见 `../../Evidence/current/TodoExecutionPhase2/MenuBannerRatioValidation20261123.md`。

- [x] **3.3 移动端配置锁定竖屏方向 (Manifest / WebApp)**（已完成横屏复核：保持自适应）
  - **建议**（原始记录）：在 Web App Manifest 中明确标注 `"orientation": "portrait"`，避免手机端用户在不小心倾斜设备时触发未做专门优化的横屏导致构图拉伸。
  - **审查结论（2026-11-23）**：缺少问题证据，暂停实施。仓库无横屏截图或操作失败记录；`index.html` 未引用 Web App Manifest，`assets/runtime/manifest.json` 只是 WebP 转换清单而非 Manifest。先补横屏可用性截图与操作测试，再决定是否限制方向。
  - **执行结论（2026-11-23）**：844×390 固定视口刷新并进入“继续经营”路径，页面滚动范围保持 844×390，场景视口与开场对白控件均未越界；保持自适应，不新增 Manifest 或方向锁定。记录见 `../../Evidence/current/TodoExecutionPhase2/HorizontalViewportValidation20261123.md`。

---

## 四、 视觉风格化探索跟踪（产品决策项，与运行缺陷分离）

已在 `Art/StyleStudies/` 归档 4 组场景概念图与 2 组实机 UI Mockup（审查已确认文件存在）：
- [x] **风格一：新中式金石版画与朱砂印** (`01_Woodblock_Cinnabar_Concept.jpg` & `Mockup_Style1_Woodblock_FurnaceUI.jpg`) —— *文化质感沉稳、独立游戏奖项首选*
- [x] **风格二：怪诞道诡水墨风** (`02_Eerie_Daoist_Ink_Concept.jpg` & `Mockup_Style2_Eerie_Daoist_FurnaceUI.jpg`) —— *博弈张力强、修仙网文向、短视频传播力强*
- [x] **风格三：新国风高精像素与琉璃光影** (`03_HiBit_Pixel_Glass_Concept.jpg`) —— *经典耐玩、掌机独立游戏手感*
- [x] **风格四：暖融绘本与治愈药膳风** (`04_Warm_Cozy_Storybook_Concept.jpg`) —— *泛休闲大众向、低挫败感*

**后续行动建议**（审查归类为产品决策项，不计入运行缺陷待办）：
- [ ] 针对目标发售平台（Steam 偏硬核/文化向 vs TapTap 偏休闲/网文向）在小规模社群内对上述方案进行问卷小样比对；
- [ ] 若确定风格迁移，建议优先以**方案一（金石版画）**进行无损轻量级换肤验证（仅替换 WebP 与少量边框 CSS，不破坏现有 2D 命中几何）。

---

## 审查后状态汇总（2026-11-23）

| 条目 | 审查结论 | 审查后状态 | 关闭或推进条件 |
|---|---|---|---|
| 1.1 冷启动 `ensure(null)` | 真实存在，代码层已修复 | **关闭** | 已加空值守卫、经济回归通过；浏览器冷启动控制台复验待补 |
| 1.2 安全区误触 | 方向成立，现象未证实 | **保留**，暂不列 P0 | 真机复核对白栏底部间距，先核对真实 DOM 类名 |
| 2.1 焦点回退 | 部分成立，原描述过重 | **关闭** | 已复核丹匣详情、炉谱、短面板及炉前入口 |
| 2.2 丹匣决策区 | 真实存在，已修复 | **关闭** | 已完成 V219 的 800×600、390×844、390×600 固定视口验收 |
| 2.3 模态层命中 | 真实存在，已完成修复 | **关闭** | 已复核对白、纸笺、炉谱、丹匣和法器模态层 |
| 3.1 触觉反馈 | 功能缺失，跨设备能力有限 | **降级观察** | 技术评估完成，当前暂缓实现；改为原生壳或限定设备时再复核 |
| 3.2 木匾比例 | CSS 已覆盖，390×844 复核通过 | **关闭** | 已完成比例与留白复核，后续换资源时再复核 |
| 3.3 竖屏锁定 | 横屏浏览器路径可用，无溢出 | **关闭** | 保持自适应；若未来出现真机旋转问题再复核 |
| 风格方案问卷 | 产品决策，非运行缺陷 | **独立记录** | 由平台定位与用户样本决策 |

合计 9 项：关闭 6 项、保留 1 项、降级观察 1 项、暂停 0 项、产品决策 1 项。审查边界与修复记录见 [Evidence/current/](../../Evidence/current/README.md)。
