(() => {
  'use strict';

  const images = new Map();
  const pending = new Map();
  const preloaded = new Set();
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

  function roomImages(size) {
    const room = 'assets/scene-illustrated-v128/room-' + size;
    return [room + '-open.webp', room + '-closed.webp'];
  }

  function announceProgress() {
    window.dispatchEvent(new Event('alchemy:entry-progress'));
  }

  function entryImages(size) {
    return size === 'desktop' ? window.AlchemyEntryImages : roomImages(size);
  }

  function available(source) {
    return images.has(source) || preloaded.has(source);
  }

  function preloadImage(source, signal) {
    return new Promise(resolve => {
      const image = new Image();
      const timer = window.setTimeout(cancel, 25000);

      function finish(ok) {
        window.clearTimeout(timer);
        signal.removeEventListener('abort', cancel);
        image.onload = image.onerror = null;
        if (ok) {
          preloaded.add(source);
          announceProgress();
        } else {
          image.removeAttribute('src');
        }
        resolve(ok);
      }

      function cancel() {
        finish(false);
      }

      signal.addEventListener('abort', cancel, {once:true});
      image.decoding = 'async';
      image.onload = () => finish(true);
      image.onerror = cancel;
      image.src = source;
    });
  }

  async function preloadDesktop(signal) {
    const queue = entryImages('desktop').filter(source => !available(source));
    const batch = new AbortController();
    const cancel = () => batch.abort();
    signal?.addEventListener('abort', cancel, {once:true});
    let next = 0;

    async function worker() {
      while (!batch.signal.aborted && next < queue.length) {
        if (!await preloadImage(queue[next++], batch.signal)) cancel();
      }
    }

    try {
      await Promise.all(Array.from({length: Math.min(queue.length, 4)}, worker));
      return !batch.signal.aborted;
    } finally {
      signal?.removeEventListener('abort', cancel);
    }
  }

  async function loadEntry(size, signal) {
    const required = await Promise.all(roomImages(size).map(async source => {
      const ready = await load(source, {timeout: 12000});
      if (ready) announceProgress();
      return ready;
    }));
    if (signal?.aborted || !required.every(Boolean)) return false;
    return size !== 'desktop' || size !== roomLayout() || preloadDesktop(signal);
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
