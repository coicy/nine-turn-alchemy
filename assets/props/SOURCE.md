# MVP 基础物件素材 V01

2026-10-28，使用内置 image_gen 生成，未使用 CLI/API。沿用本项目的深青丹房、暖纸与旧铜配色，不引用其他游戏资源。

运行文件位于 `../../Prototypes/九转丹坊MVP/assets/props/`：
- herb-parcel-v1.png：药材纸包，1312×1199，RGBA；常规展示框 85×80，底部中心落位。
- alchemy-fan-v1.png：催炼羽扇，1235×1274，RGBA；展示框 85×125，随原有挥扇动画转动。
- delivery-tray-v1.png：青瓷交付盘，1536×1024，RGBA；展示框 120×80，成丹仍由程序叠加。

PNG 原样保留，未进行抠图、重绘或压缩。原生成文件保留在 Codex generated_images 中；此项目中的副本为实际引用来源。透明通道检查见 technical-checks.json。盘面包含轻微半透明暖光，可在素材预览中评估；这是 MVP 初版，不宣称最终美术验收。

art-assets.js 仅在图片加载成功时替换对应 SVG，失败时保留旧图形。按钮文本、点击区、拖放规则、选中与禁用反馈由程序保留。生成资产不是新道具，不改变材料数量或数值。

已查看三张源图并检查轮廓、文字污染与透明度；预览页提供大图及游戏显示尺寸对照。脚本语法、场景操作与经营流程检查通过；实际浏览器渲染与触摸尚未验收。

## 最终生成提示词

以下共用提示词逐字用于每次生成，后接对应 Subject。每次工具 transparent_background=true，无参考图片。

Create ONE production-ready 2D game prop sprite for a Chinese wandering alchemist's modest workshop game. Painterly hand illustrated, clean strong silhouette readable at 90 pixels, restrained cel shading, subtle paper grain, warm light from upper left, muted sage green, warm parchment ochre and antique bronze palette. Slightly elevated front three-quarter view matching a tabletop, object centered, all edges intact, generous transparent margin, transparent background, no lettering, no symbols, no labels, no text, no frame, no other props, no ground plane, no cast ground shadow.

### herb-parcel-v1
A single small folded kraft-paper medicine parcel tied with dark green twine, one folded green medicinal leaf peeking out of the top; squat practical package. Not a pouch, not a sack.
Source: exec-e2f88336-ad1f-4b85-b89f-e3d54044d7bd.png

### alchemy-fan-v1
A single elegant but humble handheld feather fan, five broad pale sage feathers with darker green ribs and a short worn wooden handle pointing straight down; fan upright and fully open. No hand holding it.
Source: exec-2f87bdc6-ac9f-4f0e-ab6a-fdc2f2e0183e.png

### delivery-tray-v1
A single empty shallow circular celadon ceramic dish with a slightly raised gold-brown rim, viewed from above at 35 degrees so the round dish appears oval, simple and practical, no pills inside.
Source: exec-27d01f9a-deae-4a5b-9775-e6c6367e53eb.png
