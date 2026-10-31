# 游戏场景内三幕开场 V01

2026-10-31。制作人要求开场在游戏场景中切换，提高模拟感。

## 呈现

- 第一幕：实际丹房，招牌开张的旁白覆盖于画面下方，经营入口与药匣暂时收起。
- 第二幕：经原有场景切换进入接待柜台，使用当前首单的真实客人和三包药材。客人名字沿用实际委托身份；委托笺保留所求丹值、工钱和归属条款。窄屏突出客人与药材。
- 第三幕：携药回到同一张炼丹台，药匣出现三包委托药材。按“亲手开炉”后收起旁白，焦点交到实际药包，接着进行正常投药。
- 采用已有丹房、柜台及客人资源，客人入场与药包放置使用轻移和淡入。叙事由玩家推进，可跳过，也支持减少动画。

## 状态与交互

- 新开局通过正常开始流程创建一次经营进度；opening-story.js 在实际场景中演出，不再创建独立示意炉或故事舞台。
- 场景切换通过 alchemy:opening-view 交给 game-shell.js，保留现有离场/入场与输入锁。切换中可跳过，最终回到炼丹台。
- 演出期间主工作区、导航与返回按钮 inert，键盘焦点限于演出按钮。存档入口检查 AlchemyOpening.active，避免演出中切换。
- 每个槽位的 openingStep 偏好记录当前幕0–2，结束或跳过后为3。刷新后继续经营可续看未完成的一幕；正常旧存档无该标记则直接恢复，不补播故事。
- 演出不投药、不炼化，不改变委托目标、材料数量、金钱或归属。跳过后仍是原订单、三包未投入材料。

## 验证

- verify-opening-scenes-browser.cjs：真实丹房→柜台→丹房、首单姓名、三包药、输入锁、幕中刷新恢复、结束后真实点击投药、正常进度不重播、切换中Escape跳过、三幕跳过、390宽与减少动画。
- verify-onboarding-browser.cjs、verify-save-slots-browser.cjs、verify-theme-transitions.cjs、verify-loop-flow-browser.cjs：开局、三槽位新开局与恢复、六页面/三尺寸、收丹与丹纹流程回归。
- verify-mvp / verify-simulation / verify-campaign / verify-economy / verify-telemetry / verify-save-slots：原单炉、30天、经济、匿名记录和存档隔离检查通过。
- 截图与线上核查：Evidence/OpeningScenesV01。新玩家的模拟感与阅读负担仍需试玩评价。
