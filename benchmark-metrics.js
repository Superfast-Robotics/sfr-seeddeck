/* WebGL owns the live phase. The legacy GIF has its own six-second clock. */
(() => {
  'use strict';
  const host = document.querySelector('.benchmark-metrics');
  if (!host) return;
  const slide = host.closest('.benchmark-slide');
  const deck = document.getElementById('deck');
  const lattice = slide?.querySelector('.benchmark-animation');
  const fallbackImage = lattice?.querySelector('img[data-animated-src]');
  const size = host.querySelector('[data-benchmark-size]');
  const speed = host.querySelector('[data-benchmark-speed]');
  let frozen = false;
  let lastCompression = -1;
  let fallbackFrame = 0;
  let fallbackStart = null;

  function paint(compression) {
    const progress = Math.max(0, Math.min(1, compression));
    if (Math.abs(progress - lastCompression) < .00001) return;
    lastCompression = progress;
    const sizeText = String(Math.round(1070 + (30 - 1070) * progress));
    const percent = Math.round((100 - 9.5 * progress) * 10) / 10;
    const speedText = percent === 100 ? '100' : percent.toFixed(1);
    if (size.textContent !== sizeText) size.textContent = sizeText;
    if (speed.textContent !== speedText) speed.textContent = speedText;
    host.style.setProperty('--compression', progress.toFixed(5));
    host.dataset.compression = progress.toFixed(5);
  }

  function stopFallback() {
    if (fallbackFrame) cancelAnimationFrame(fallbackFrame);
    fallbackFrame = 0;
    fallbackStart = null;
  }

  function fallbackPlaying() {
    return !frozen && !document.hidden && !deck?.classList.contains('motion-paused') &&
      slide?.classList.contains('is-active') && !lattice?.classList.contains('has-live-motion') &&
      fallbackImage?.getAttribute('src') === fallbackImage?.dataset.animatedSrc;
  }

  const smooth = (a, b, value) => {
    const u = Math.max(0, Math.min(1, (value - a) / (b - a)));
    return u * u * (3 - 2 * u);
  };

  function fallbackTick(now) {
    fallbackFrame = 0;
    if (!fallbackPlaying()) { stopFallback(); return; }
    if (fallbackStart === null) fallbackStart = now;
    // The existing 120-frame GIF runs at 50 ms per frame. Its compact
    // portion is around 2.75–3.6 s; use that visible motion for fallback.
    const cycle = ((now - fallbackStart) / 1000) % 6;
    const compression = smooth(.45, 2.75, cycle) * (1 - smooth(3.6, 5.65, cycle));
    paint(compression);
    host.dataset.clock = 'gif';
    fallbackFrame = requestAnimationFrame(fallbackTick);
  }

  function syncFallback() {
    if (!fallbackPlaying()) { stopFallback(); return; }
    if (!fallbackFrame) {
      paint(0);
      fallbackFrame = requestAnimationFrame(fallbackTick);
    }
  }

  window.SFRBenchmarkMetrics = {
    sync(compression) {
      stopFallback();
      // The deck explicitly autoplays, even when the OS requests reduced
      // motion. Match its lattice clock instead of overriding only numbers.
      paint(frozen ? 1 : compression);
      host.dataset.clock = frozen ? 'frozen' : 'webgl';
    },
    freeze() {
      frozen = true;
      stopFallback();
      paint(1);
      host.dataset.clock = 'frozen';
    },
  };

  paint(1);
  const observer = new MutationObserver(syncFallback);
  if (deck) observer.observe(deck, { attributes:true, attributeFilter:['class'] });
  if (slide) observer.observe(slide, { attributes:true, attributeFilter:['class'] });
  if (lattice) observer.observe(lattice, { attributes:true, attributeFilter:['class','data-renderer'] });
  if (fallbackImage) {
    observer.observe(fallbackImage, { attributes:true, attributeFilter:['src'] });
    fallbackImage.addEventListener('load', () => { stopFallback(); syncFallback(); });
  }
  document.addEventListener('visibilitychange', syncFallback);
  syncFallback();
})();
