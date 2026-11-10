/* Keep the open painting as the static room. The closed painting supplies only
   the lid on the furnace and the uncovered area of the lid rest. */
(() => {
  'use strict';

  const directory = 'assets/scene-illustrated-v128/';
  const patches = {
    'room-desktop': {
      size: [1600, 1600], feather: 4,
      lid: 'M384 759 Q416 725 495 714 Q500 681 545 678 Q583 679 596 720 Q685 733 707 776 Q697 811 634 824 Q500 847 408 816 Q381 801 384 759Z',
      rest: 'M275 671 Q332 665 357 730 Q374 761 381 787 Q398 801 394 841 Q383 866 361 875 Q340 949 296 974 L239 976 Q200 930 211 835 Q200 733 248 685Z'
    },
    'room-mobile': {
      size: [390, 900], feather: 1.5,
      lid: 'M30 389 Q44 374 81 368 Q84 349 104 348 Q122 350 126 370 Q158 375 171 393 Q173 416 133 423 Q68 432 37 413Z',
      rest: 'M-10 358 Q9 367 12 399 Q29 403 30 426 Q26 439 17 443 Q12 463 -10 468Z'
    },
    'furnace-desktop': {
      size: [1600, 1600], feather: 5,
      lid: 'M115 675 Q136 584 365 535 Q366 473 434 466 Q501 462 531 531 Q703 551 770 644 Q815 730 680 782 Q558 842 358 827 Q151 828 115 739Z',
      rest: 'M-16 544 Q15 555 42 603 Q72 653 84 718 Q123 741 119 798 Q115 833 99 849 Q94 961 -16 1055Z'
    },
    'furnace-mobile': {
      size: [390, 900], feather: 1.5,
      lid: 'M22 394 Q42 366 111 358 Q117 343 145 342 Q167 343 178 358 Q237 362 260 398 Q279 434 231 457 Q194 474 128 468 Q49 464 25 439Z',
      rest: 'M-8 393 Q7 408 9 426 Q22 428 21 447 Q17 462 -8 480Z'
    }
  };

  const svgNS = 'http://www.w3.org/2000/svg';
  function element(name, attributes) {
    const node = document.createElementNS(svgNS, name);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    return node;
  }

  function mount(stage) {
    const layer = element('svg', {'aria-hidden': 'true', preserveAspectRatio: 'none'});
    Object.assign(layer.style, {
      position: 'absolute', left: '0', top: 'var(--scene-image-top)',
      width: 'var(--room-base-width)', height: 'var(--room-base-height)',
      pointerEvents: 'none', zIndex: '0', visibility: 'hidden'
    });
    const defs = element('defs', {});
    const filter = element('filter', {id: 'lid-patch-feather', x: '-20%', y: '-20%', width: '140%', height: '140%'});
    const blur = element('feGaussianBlur', {});
    filter.append(blur);
    const mask = element('mask', {id: 'lid-patch-mask', maskUnits: 'userSpaceOnUse'});
    const footprint = element('path', {fill: 'white', filter: 'url(#lid-patch-feather)'});
    mask.append(footprint);
    defs.append(filter, mask);
    const painting = element('image', {mask: 'url(#lid-patch-mask)', preserveAspectRatio: 'none'});
    layer.append(defs, painting);
    stage.prepend(layer);

    let currentKey, currentLid;
    return (key, lid) => {
      if (key !== currentKey) {
        const {size: [width, height], feather, lid: lidPath, rest} = patches[key];
        layer.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
        for (const node of [painting, mask]) {
          node.setAttribute('width', width);
          node.setAttribute('height', height);
        }
        blur.setAttribute('stdDeviation', feather);
        footprint.setAttribute('d', lidPath + ' ' + rest);
        painting.setAttribute('href', directory + key + '-closed.webp');
        currentKey = key;
      }
      if (lid !== currentLid) {
        layer.style.visibility = lid === 'closed' ? 'visible' : 'hidden';
        currentLid = lid;
      }
    };
  }

  window.AlchemySceneLidLayer = {mount, baseImage: key => directory + key + '-open.webp'};
})();
