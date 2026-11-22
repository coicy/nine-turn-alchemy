(() => {
  'use strict';

  const images = new Map();
  const pending = new Map();
  const preloaded = new Set();
  const layout = matchMedia('(max-width: 650px)');
  let preparation;
  let preparedLayout;

  function load(src, {timeout = 60000, priority = 'auto'} = {}) {
    if (images.has(src)) return Promise.resolve(true);
    if (pending.has(src)) return pending.get(src);

    const loading = new Promise(resolve => {
      const image = new Image();
      image.fetchPriority = priority;
      function finish(ok) {
        window.clearTimeout(timer);
        image.onload = image.onerror = null;
        if (ok) images.set(src, image);
        else image.removeAttribute('src');
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

  function roomImages(size) {
    const room = (size === 'desktop' ? 'assets/scene-entry/' : 'assets/scene-illustrated/') + 'room-' + size;
    return [room + '-open.webp', room + '-closed.webp'];
  }

  function announceProgress() {
    window.dispatchEvent(new Event('alchemy:entry-progress'));
  }

  function entryImages(size) {
    // The first room and immediately reachable furnace are the entry contract on both platforms.
    // Customer art and later scenes already load through their own renderers.
    const directory = size === 'desktop' ? 'assets/scene-entry/' : 'assets/scene-illustrated/';
    return ['room', 'furnace'].flatMap(scene => ['open', 'closed', 'front'].map(layer =>
      directory + scene + '-' + size + '-' + layer + '.webp'));
  }

  function available(source) {
    return images.has(source) || preloaded.has(source);
  }

  async function loadEntry(size, signal) {
    if (signal?.aborted) return false;
    const sources = entryImages(size);
    const loading = Promise.all(sources.map(async source => {
      const ready = await load(source, {timeout: 30000, priority: 'high'});
      if (!signal?.aborted) announceProgress();
      return ready;
    }));
    // Leaving the loading screen must release this attempt immediately; the
    // shared image cache may still finish for another consumer or a retry.
    let cancel;
    const aborted = new Promise(resolve => {
      cancel = () => resolve(false);
      signal?.addEventListener('abort', cancel, {once:true});
    });
    try {
      return await Promise.race([loading.then(result => result.every(Boolean)), aborted]);
    } finally {
      signal?.removeEventListener('abort', cancel);
    }
  }

  function prepare(signal) {
    const size = roomLayout();
    if (preparedLayout === size) return Promise.resolve(true);
    if (signal?.aborted) return Promise.resolve(false);
    if (preparation && !preparation.signal?.aborted) return preparation.promise;

    const attempt = {signal};
    preparation = attempt;
    attempt.promise = loadEntry(size, signal).then(ready => {
      if (preparation === attempt) preparation = undefined;
      if (signal?.aborted) return false;
      if (size !== roomLayout()) return prepare(signal);
      if (!ready) return false;

      preparedLayout = size;
      window.dispatchEvent(new Event('alchemy:assets-ready'));
      return true;
    });
    return attempt.promise;
  }

  layout.addEventListener('change', announceProgress);
  window.AlchemyAssets = {
    load, prepare,
    getImage: src => images.get(src),
    get loadedCount() { return images.size; },
    get entryProgress() {
      const required = entryImages(roomLayout());
      return required.filter(available).length / required.length;
    },
    get ready() { return preparedLayout === roomLayout(); }
  };
})();
