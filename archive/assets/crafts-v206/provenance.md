# V206 造物素材来源

本项目独立生成，使用内置 imagegen；未跨游戏复制素材。

- atlas-a.png：机关鸟、石狮、洞府，各五阶段。生成后以参考图编辑清理背景与边缘，保留透明alpha。最终来源 exec-54c31138-3442-4edd-94b4-0bf119e1c5ce.png。
- atlas-b.png：机关驮兽、守御建筑、石泉，各五阶段。生成后以参考图编辑背景分离，保留透明alpha。最终来源 exec-ed572469-a22b-4cdc-b1f4-e3cb9ad808db.png。
- frames.json：通过alpha连通轮廓测量标定30件物体的取图范围；运行中等比绘制到透明画布，无重绘或用其他物品拼接。

原始生成与编辑输出保留于当前用户的 Codex generated_images/01a1fa37-f23e-7810-a79e-44f5ac4e6609；生产图片已复制到本目录，运行不依赖该外部目录。

风格提示：Chinese fantasy alchemy shop, pale hand-painted gouache, fine ink contours, aged timber, muted bronze and gray stone, warm mineral ochre, isolated complete objects, consistent elevated three-quarter view, five columns by three rows, no labels, no UI, no people, no plants.

A组形态：wooden messenger sparrow to mechanical phoenix; small stone guardian lion to shrine; rock house to courtyard, portable abode and floating gatehouse.
B组形态：wooden pack ox to walking mechanical supply house; warning turret to miniature citadel; trickling stone spring to connected basin water realm.

最终A编辑提示：Preserve all 15 object designs and exact five-column three-row arrangement. Remove red/yellow speckled fringe, black background, external haze and glow; clean antialiased silhouettes on transparent alpha. No text or new objects.
最终B编辑提示：Preserve all 15 objects and current five-column three-row positions. Remove entire brown/gray gradient backdrop and external shadows; genuine transparent alpha, including gaps between legs, windows and spring arches. No colored fringes, checkerboard, text or labels.

人工校验：实际炉中、收纳、市场和30形态受控目录查看；不以图集本身证明新玩家理解或游戏趣味。
