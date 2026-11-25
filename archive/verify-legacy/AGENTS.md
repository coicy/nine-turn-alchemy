# 历史验证脚本归档索引（archive/verify-legacy）

## 本目录功能

- 集中存放已退出当前产品规则、且无任何活跃脚本或工具导入依赖的历史验证脚本。
- 以下脚本对应前代丹纹系统、已退役工具表长度假设或旧美术切片结构，仅用于历史追溯，不得直接作为当前版本（V220+）的回归门禁。

## 已归档脚本

- `verify-mvp.cjs`：早期 MVP 单局与前代丹纹回归脚本（引用已退役的 `tryAddRune` / `tryFusion`）。
- `verify-rune-combos.cjs`：前代六种丹纹组合回归脚本。
- `verify-art-assets.cjs`：前代 `AlchemyPillArt.patterns` 切片资产回归脚本。
- `verify-unified-pills-v156.cjs`：V156 阶段脚本（硬编码断言前代 `TOOL_DEFS.length === 7`，与 V217/V219 后的 40 件法器体系冲突）。

## 仍在根目录保留的共享前置依赖

- `verify-simulation.cjs` 与 `verify-value-formula-v104.cjs` 被当前活跃回归脚本及 `Tools/` 模拟脚本直接切片读取，因此保留在发布目录根层。
