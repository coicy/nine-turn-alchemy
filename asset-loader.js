(() => {
  'use strict';

  const images = new Map();
  const pending = new Map();
  const layout = matchMedia('(max-width: 650px)');
  let preparation;
  let preparedLayout;

  function load(src, {timeout = 60000} = {}) {
    if (images.has(src)) return Promise.resolve(true);
    if (pending.has(src)) return pending.get(src);

    const loading = new Promise(resolve => {
      const image = new Image();
      function finish(ok) {
        window.clearTimeout(timer);
        image.onload = image.onerror = null;
        if (ok) images.set(src, image);
        resolve(ok);
      }
      const timer = window.setTimeout(() => finish(false), timeout);
      image.onload = async () => {
        try {
          await image.decode();
          if (image.onload) finish(true);
        } catch {
          if (image.onload) finish(false);
        }
      };
      image.onerror = () => finish(false);
      image.src = src;
    }).finally(() => pending.delete(src));
    pending.set(src, loading);
    return loading;
  }

  function roomLayout() {
    return layout.matches ? 'mobile' : 'desktop';
  }

  function prepare() {
    if (preparedLayout === roomLayout()) return Promise.resolve(true);
    if (preparation) return preparation;

    const size = roomLayout();
    const room = 'assets/scene-illustrated-v128/room-' + size;
    preparation = Promise.all(['open', 'closed'].map(state =>
      load(room + '-' + state + '.webp', {timeout: 12000})
    )).then(results => {
      preparation = undefined;
      if (size !== roomLayout()) return prepare();
      const ready = results.every(Boolean);
      if (ready) preparedLayout = size;
      if (ready) window.dispatchEvent(new Event('alchemy:assets-ready'));
      return ready;
    });
    return preparation;
  }

  window.AlchemyAssets = {
    load, prepare,
    getImage: src => images.get(src),
    get loadedCount() { return images.size; },
    get ready() { return preparedLayout === roomLayout(); }
  };
})();
