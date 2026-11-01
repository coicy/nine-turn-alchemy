# 新客人实际柜台接入 V62

2026-11-01。陆绣（V61 布庄行商）作为独立新身份 clothier-lu 接入既有坊市行商订单类型，立绘、对白与订单状态在实际接待界面运行。旧 merchant-zhou 身份保留，已有存档身份不重写。新订单通过既有身份绑定选择陆绣；未把十六人目录全部接入随机来客系统。

完整 PNG 保持2:3比例显示，以背景同一 cover 坐标定位；人物站位在来笺下方，柜面按背景y527遮住下部躯干。clip-path仅用于柜台遮挡，不清理或隐藏人物透明边缘。旧三类占位外貌换成 V59/V60 同画风母稿，以免同屏出现写实与简化人物混用；其原有多身份共用占位图的问题仍待完整来客池处理，不宣称已解决人数多样性。

内部检查：实际1600×1000运行截图中发顶未被来笺遮挡，人物与柜台比例、对话位置和桌面遮挡正常；候客保持后方较小尺度。静态立绘状态可用，尚未接入骨骼或交接动画。

verify-new-customer-v62.cjs 使用新建隔离浏览器及固定随机数生成可复查的第一天订单，不修改生产随机规则或用户存档；实际点击开场、查看全部功能、柜台、来笺、终止原订单、落印接单及回柜台。验证身份clothier-lu、三包材料、无脚本错误。verify-campaign.cjs的30天规则检查通过。

证据：Evidence/CustomerInGameV62/counter-full.png 为待接单查看状态；counter-accepted.png 为接单后回柜台状态，保留真实页签、来笺、委托书、药包及收据，没有覆盖假UI。素材来源 Art/CustomerBatchV61/clothier.png、Art/CharacterStyleV59/merchant.png、Art/CharacterModelsV60/scholar.png 和 herbalist.png，原图原样复制。
