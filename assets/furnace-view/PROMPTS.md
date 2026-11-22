# Furnace view V102 generation records

Tool: built-in image_gen. All source PNGs are retained in Art/FurnaceViewV102. Runtime images are resized WebP conversions with alpha preserved. No external game assets were copied.

## Desktop master

Reference: Docs/FurnaceViewV101/open-furnace.png.

Production background cleanup, keep exact camera and every existing pixel position except the requested removals. Remove the upright celadon lid entirely from its left ceramic cradle, showing the cradle EMPTY. Remove the entire hanging feather fan and its shadow, leaving the brass hook empty. Keep central EMPTY open deep charcoal pot, ceramic outer furnace, fire door, right empty celadon receiving dish, table, light and dimensions perfectly unchanged. Add three modest small low wooden artifact pads at the BACK RIGHT tabletop on the existing free area top-right, evenly separated, aligned with that tabletop perspective, leave generous space below for dish. They are empty, no equipment. Do not change stove/plate scale or position. No text, no pill, no UI. This will be stable background under separately drawn moving lids and fan.

## Standing lid, transparent

Reference: Docs/FurnaceViewV101/open-furnace.png.

Extract ONLY the full upright lid on the LEFT side of this scene as a clean game sprite on truly transparent background. Preserve its exact appearance and oblique standing camera: pale celadon domed disk on edge with orange terracotta rim, bronze cloud knob protruding towards viewer at left, tall narrow ellipse, lit upper left. NOTHING ELSE. Remove the cradle, floor, stove, all background, no shadows outside the sprite. Tight portrait crop about width 270 height 650 around this one lid. Retain all celadon tilework details, the orange rim and bronze cloud knob. Actual transparent RGBA.

## Closed lid, transparent

Reference: Docs/FurnaceViewV101/closed-furnace.png.

Extract ONLY the closed HORIZONTAL celadon lid over the central pot as a clean game sprite on truly transparent background, tight landscape crop. Preserve exact downward camera ellipse, pale celadon shallow dome with bronze cloud knob in center, with very narrow orange edge only. Remove furnace, separate huge red pot rim, collar, table, all backdrop, floor, fire. No other object or cast shadow beyond lid. The bottom silhouette must be one smooth closed ellipse suited to place over the exact pot mouth. Width-to-height about 1.55. Original warm light upper left, painterly detail.

## Mobile master

Reference: desktop.png from this batch.

Make dedicated PORTRAIT 2:3 mobile camera layout of SAME Chinese ceramic stove and table, hand-painted quality. Looking steeply down from craftsperson standing in front. Recompose NOT squeeze or crop a wide image. Central stove full width about 70%, positioned LEFT CENTER. Open dark grey inner pot mouth ellipse centered at x40% y24%, width67% of whole portrait, minor axis about 60% of major. Empty concave bottom clearly visible. Ceramic outer stove extends downward to firebox at x35%, y76%, so fan hook at x58% y65%. EMPTY left ceramic lid cradle at x10% y57% low and narrow. Table is narrow to RIGHT of furnace, top surface starting at y35% and near edge at y67%; empty celadon shallow receiving plate center x79% y50%, diameter28%width. Three small EMPTY artifact pads on table back edge right from x66% to x94%, y36%, aligned with table plane. Chimney cropped at top. Leave no objects over mouth or plate. No fan and no lid on stove or cradle; these are later separate sprites. No pill, no UI, no text, no glow. Full grounded stage showing mouth, full fire door and plate in same fixed camera. Match original clay/celadon/brick/wood and warm window light, concise tactile painted game art.

## Mobile pad arrangement correction

Reference: mobile.png. Selected runtime asset: mobile-v2.webp. Separate 44px targets on narrow screens use two rear slots and one forward slot, aligned to these three supports.

Only change the three small wooden artifact rests on the upper RIGHT tabletop of this mobile background. Reorganize the SAME three rests into a compact triangular grouping of TWO in back and ONE centered in front, on this existing table. Positions as fractions of whole image: back rest centers (0.76,0.29) and (0.91,0.29), front rest center (0.835,0.35). Each rest visual footprint width about0.10 image width and height0.035 image height. Keep modest wooden low pads matching original perspective. Leave a clear gap from the front rest to the existing receiving plate which starts at y0.41. Remove original three-in-one-row rests. Do not change any pixel of pot, firebox, hook, lid cradle, dish, table edges, chimney, light or framing. Exact same original aspect and composition; local pad arrangement edit ONLY. No objects on pads, no pill, no labels or UI.
