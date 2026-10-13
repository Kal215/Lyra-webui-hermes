/**
 * Lyra Autonomous Studio - Web-Native Presentation Engine
 * Generates standalone, pixel-perfect 16:9 widescreen HTML/Tailwind slide decks
 * matching Gamma.app / Vercel / Stripe design standards with interactive carousel,
 * keyboard controls, and print-to-PDF stylesheet.
 */
import { PresentationSpec, PresentationSlide } from './pptxCompiler';

export function generateHtmlSlideDeck(spec: PresentationSpec): string {
  const isDark = spec.theme !== 'light';
  const slides = spec.slides || [];

  const slidesHtml = slides.map((slide, idx) => {
    return renderSlideItem(slide, idx, slides.length, spec.title, isDark);
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="id" class="${isDark ? 'dark' : ''}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(spec.title)} - Lyra Executive Presentation</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
          }
        }
      }
    }
  </script>
  <style>
    @media print {
      body { background: #000 !important; color: #fff !important; }
      .no-print { display: none !important; }
      .slide-container { display: block !important; }
      .slide-page {
        display: flex !important;
        page-break-after: always;
        break-after: page;
        width: 100vw;
        height: 100vh;
        margin: 0;
        padding: 2.5rem;
      }
    }
    @page {
      size: 16in 9in landscape;
      margin: 0;
    }
  </style>
</head>
<body class="bg-zinc-950 text-zinc-100 font-sans min-h-screen flex flex-col justify-between selection:bg-indigo-500/30 selection:text-indigo-300">

  <!-- Top Global Bar (Screen Only) -->
  <header class="no-print border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur px-5 py-2.5 flex items-center justify-between text-xs text-zinc-400">
    <div class="flex items-center gap-3">
      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] font-medium tracking-wide">
        <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
        LYRA DECK ENGINE
      </span>
      <span class="font-medium text-zinc-200 truncate max-w-md">${escapeHtml(spec.title)}</span>
    </div>

    <div class="flex items-center gap-2">
      <button onclick="window.print()" class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition cursor-pointer">
        <svg class="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
        <span>Cetak ke PDF</span>
      </button>
      <button onclick="toggleFullScreen()" class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition cursor-pointer">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
        <span>Presentasi (F)</span>
      </button>
    </div>
  </header>

  <!-- Main Presentation Viewport -->
  <main class="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
    <div class="w-full max-w-5xl aspect-video bg-zinc-900/90 rounded-2xl border border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col justify-between slide-container">
      ${slidesHtml}
    </div>
  </main>

  <!-- Bottom Interactive Carousel Navigation Bar (Screen Only) -->
  <footer class="no-print border-t border-zinc-800/80 bg-zinc-900/60 backdrop-blur px-5 py-3 flex items-center justify-between text-xs">
    <div class="flex items-center gap-1.5 font-mono text-zinc-500 text-[11px]">
      <span>Navigasi:</span>
      <kbd class="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">←</kbd>
      <kbd class="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">→</kbd>
      <span class="ml-1">atau Spasi</span>
    </div>

    <!-- Stepper & Dot Indicators -->
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-1.5">
        ${slides.map((_, i) => `
          <button onclick="goToSlide(${i})" id="dot-${i}" class="w-2.5 h-1.5 rounded-full transition-all cursor-pointer ${i === 0 ? 'bg-indigo-500 w-6' : 'bg-zinc-700 hover:bg-zinc-600'}" title="Slide ${i + 1}"></button>
        `).join('')}
      </div>

      <div class="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1 font-mono text-[11px]">
        <button onclick="prevSlide()" class="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <span class="px-2 text-zinc-300"><span id="current-slide-num">1</span> / ${slides.length}</span>
        <button onclick="nextSlide()" class="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  </footer>

  <script>
    let currentSlide = 0;
    const totalSlides = ${slides.length};

    function updateSlideVisibility() {
      for (let i = 0; i < totalSlides; i++) {
        const el = document.getElementById('slide-' + i);
        const dot = document.getElementById('dot-' + i);
        if (el) {
          if (i === currentSlide) {
            el.classList.remove('hidden');
            el.classList.add('flex');
          } else {
            el.classList.add('hidden');
            el.classList.remove('flex');
          }
        }
        if (dot) {
          if (i === currentSlide) {
            dot.className = 'w-6 h-1.5 rounded-full bg-indigo-500 transition-all cursor-pointer';
          } else {
            dot.className = 'w-2.5 h-1.5 rounded-full bg-zinc-700 hover:bg-zinc-600 transition-all cursor-pointer';
          }
        }
      }
      const numDisplay = document.getElementById('current-slide-num');
      if (numDisplay) numDisplay.innerText = currentSlide + 1;
    }

    function nextSlide() {
      if (currentSlide < totalSlides - 1) {
        currentSlide++;
        updateSlideVisibility();
      }
    }

    function prevSlide() {
      if (currentSlide > 0) {
        currentSlide--;
        updateSlideVisibility();
      }
    }

    function goToSlide(idx) {
      if (idx >= 0 && idx < totalSlides) {
        currentSlide = idx;
        updateSlideVisibility();
      }
    }

    function toggleFullScreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullScreen();
      }
    });

    // Initialize
    updateSlideVisibility();
  </script>
</body>
</html>`;
}

function renderSlideItem(
  slide: PresentationSlide, 
  idx: number, 
  total: number, 
  deckTitle: string, 
  isDark: boolean
): string {
  const isHidden = idx !== 0 ? 'hidden' : 'flex';

  if (slide.type === 'title' || idx === 0) {
    // Archetype 1: Executive Title Hero
    return `
    <div id="slide-${idx}" class="${isHidden} slide-page flex-col justify-between p-8 sm:p-12 lg:p-14 w-full h-full relative">
      <!-- Watermark Accent -->
      <div class="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none"></div>

      <!-- Top Tag -->
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700 text-indigo-400 font-mono text-xs font-semibold uppercase tracking-widest">
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
          LYRA AUTONOMOUS STUDIO
        </div>
      </div>

      <!-- Main Headline -->
      <div class="max-w-3xl my-auto space-y-4">
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
          ${escapeHtml(slide.title)}
        </h1>
        ${slide.subtitle ? `
          <p class="text-base sm:text-lg text-zinc-400 font-normal leading-relaxed max-w-2xl">
            ${escapeHtml(slide.subtitle)}
          </p>
        ` : ''}
      </div>

      <!-- Bottom Metadata Bar -->
      <div class="flex items-center justify-between pt-6 border-t border-zinc-800/60 text-xs text-zinc-500 font-mono">
        <span>EXECUTIVE BRIEFING • STRATEGIC ARCHITECTURE</span>
        <span>SLIDE ${idx + 1} OF ${total}</span>
      </div>
    </div>`;
  }

  if (slide.type === 'stats' && slide.stats && slide.stats.length > 0) {
    // Archetype 2: KPI Metrics Row
    const statsCols = slide.stats.map(st => `
      <div class="flex-1 p-6 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col justify-center items-center text-center relative overflow-hidden group">
        <div class="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-sky-500"></div>
        <span class="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-100 to-zinc-400 font-mono tracking-tight">
          ${escapeHtml(st.value)}
        </span>
        <span class="mt-3 text-xs sm:text-sm font-medium text-zinc-400 leading-snug">
          ${escapeHtml(st.label)}
        </span>
      </div>
    `).join('');

    return `
    <div id="slide-${idx}" class="${isHidden} slide-page flex-col justify-between p-8 sm:p-12 w-full h-full">
      <div>
        <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">${escapeHtml(slide.title)}</h2>
        ${slide.subtitle ? `<p class="mt-1 text-sm text-zinc-400">${escapeHtml(slide.subtitle)}</p>` : ''}
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(slide.stats.length, 4)} gap-4 my-auto">
        ${statsCols}
      </div>

      <div class="flex items-center justify-between pt-4 border-t border-zinc-800/60 text-xs text-zinc-500 font-mono">
        <span>${escapeHtml(deckTitle)}</span>
        <span>SLIDE ${idx + 1} OF ${total}</span>
      </div>
    </div>`;
  }

  if (slide.type === 'cards' && slide.cards && slide.cards.length > 0) {
    // Archetype 3: Multi-Column Feature Cards
    const cardsCols = slide.cards.map((cd, cIdx) => `
      <div class="flex-1 p-5 rounded-xl bg-zinc-950/70 border border-zinc-800/90 flex flex-col justify-between hover:border-zinc-700 transition relative">
        <div class="space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-bold flex items-center justify-center">
              0${cIdx + 1}
            </span>
            <div class="w-8 h-1 rounded-full bg-indigo-500/40"></div>
          </div>
          <h3 class="text-base font-bold text-white leading-snug pt-1">${escapeHtml(cd.title)}</h3>
          <p class="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">${escapeHtml(cd.description)}</p>
        </div>
      </div>
    `).join('');

    return `
    <div id="slide-${idx}" class="${isHidden} slide-page flex-col justify-between p-8 sm:p-12 w-full h-full">
      <div>
        <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">${escapeHtml(slide.title)}</h2>
        ${slide.subtitle ? `<p class="mt-1 text-sm text-zinc-400">${escapeHtml(slide.subtitle)}</p>` : ''}
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-${Math.min(slide.cards.length, 3)} gap-4 my-auto">
        ${cardsCols}
      </div>

      <div class="flex items-center justify-between pt-4 border-t border-zinc-800/60 text-xs text-zinc-500 font-mono">
        <span>${escapeHtml(deckTitle)}</span>
        <span>SLIDE ${idx + 1} OF ${total}</span>
      </div>
    </div>`;
  }

  // Archetype 4: Crisp Structured Bullets
  const bulletsList = (slide.bullets || []).map(b => {
    const match = b.match(/^\*\*(.*?)\*\*[:\-]?\s*(.*)$/);
    if (match) {
      return `
      <li class="flex items-start gap-3 p-3.5 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
        <span class="mt-1 w-2 h-2 rounded-full bg-indigo-400 shrink-0"></span>
        <div>
          <strong class="text-white font-semibold text-sm block">${escapeHtml(match[1])}</strong>
          <span class="text-zinc-400 text-xs sm:text-sm leading-relaxed">${escapeHtml(match[2])}</span>
        </div>
      </li>`;
    }
    return `
    <li class="flex items-start gap-3 p-3 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
      <span class="mt-1 w-2 h-2 rounded-full bg-indigo-400 shrink-0"></span>
      <span class="text-zinc-300 text-xs sm:text-sm leading-relaxed">${escapeHtml(b)}</span>
    </li>`;
  }).join('');

  return `
  <div id="slide-${idx}" class="${isHidden} slide-page flex-col justify-between p-8 sm:p-12 w-full h-full">
    <div>
      <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">${escapeHtml(slide.title)}</h2>
      ${slide.subtitle ? `<p class="mt-1 text-sm text-zinc-400">${escapeHtml(slide.subtitle)}</p>` : ''}
    </div>

    <ul class="space-y-3 my-auto max-w-4xl">
      ${bulletsList}
    </ul>

    <div class="flex items-center justify-between pt-4 border-t border-zinc-800/60 text-xs text-zinc-500 font-mono">
      <span>${escapeHtml(deckTitle)}</span>
      <span>SLIDE ${idx + 1} OF ${total}</span>
    </div>
  </div>`;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
