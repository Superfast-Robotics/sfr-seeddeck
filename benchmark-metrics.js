/* One clock, two views: read the existing lattice's compression, never drive it. */
(() => {
  'use strict';
  const host = document.querySelector('.benchmark-metrics');
  if (!host) return;
  const size = host.querySelector('[data-benchmark-size]');
  const speed = host.querySelector('[data-benchmark-speed]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frozen = false;
  let lastCompression = -1;

  function paint(compression) {
    const progress = Math.max(0, Math.min(1, compression));
    if (Math.abs(progress - lastCompression) < .00001) return;
    lastCompression = progress;
    const megabytes = Math.round(1767 + (50 - 1767) * progress);
    const speedup = (6.27 + (5.78 - 6.27) * progress).toFixed(2);
    const sizeText = megabytes.toLocaleString('en-US');
    if (size.textContent !== sizeText) size.textContent = sizeText;
    if (speed.textContent !== speedup) speed.textContent = speedup;
    host.style.setProperty('--compression', progress.toFixed(5));
    host.dataset.compression = progress.toFixed(5);
  }

  window.SFRBenchmarkMetrics = {
    sync(compression) { paint(frozen || reducedMotion.matches ? 1 : compression); },
    freeze() { frozen = true; paint(1); },
  };
  // A useful final state is also the no-WebGL and no-animation fallback.
  paint(1);
  const lattice = host.closest('.benchmark-slide')?.querySelector('.benchmark-animation');
  if (lattice) new MutationObserver(() => {
    if (lattice.dataset.renderer === 'fallback') paint(1);
  }).observe(lattice, { attributes:true, attributeFilter:['data-renderer'] });
  const onPreferenceChange = () => { if (reducedMotion.matches) paint(1); };
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', onPreferenceChange);
  else reducedMotion.addListener(onPreferenceChange);
})();
