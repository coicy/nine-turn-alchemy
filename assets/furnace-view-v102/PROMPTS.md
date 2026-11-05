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
