/**
 * 称号エンブレム／ステッカーの共通 SVG 定義（v2 参照実装の <defs> をそのまま移植）。
 * SVG_DEFS_INNER は <defs> の中身。ページ全体に一度だけ注入（injectSvgDefs）するほか、
 * 単体でダウンロードするステッカーSVGにも埋め込んで参照を自己完結させる。
 */
export const SVG_DEFS_INNER = `
    <path id="hexOuter" d="M44 3 L82 25 V71 L44 93 L6 71 V25 Z"/>
    <path id="hexInner" d="M44 10 L76 28.5 V67.5 L44 86 L12 67.5 V28.5 Z"/>
    <clipPath id="hexClip"><use href="#hexInner"/></clipPath>

    <linearGradient id="t-iron" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b8c2d0"/><stop offset="1" stop-color="#5a6472"/></linearGradient>
    <linearGradient id="t-bronze" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0b478"/><stop offset="1" stop-color="#8f5a26"/></linearGradient>
    <linearGradient id="t-silver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#8f9db2"/></linearGradient>
    <linearGradient id="t-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe28e"/><stop offset="1" stop-color="#c08c1e"/></linearGradient>
    <linearGradient id="t-platinum" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a8d6ff"/><stop offset="1" stop-color="#1f6ecf"/></linearGradient>
    <linearGradient id="t-titan" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d0aaff"/><stop offset="1" stop-color="#6733d6"/></linearGradient>

    <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1b2230"/><stop offset="1" stop-color="#0c1018"/>
    </linearGradient>
    <linearGradient id="glassShine" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="rgba(255,255,255,.16)"/><stop offset=".5" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>

    <g id="peakBody">
      <polygon points="44,26 62,64 44,64" opacity=".55"/>
      <polygon points="44,26 26,64 44,64"/>
      <polygon points="60,42 72,64 48,64" opacity=".35"/>
      <polyline points="30,58 38,46 44,52 52,40" fill="none" stroke="#0b0e13" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>
    </g>

    <g id="em-iron">
      <use href="#hexOuter" fill="none" stroke="url(#t-iron)" stroke-width="2.5"/>
      <use href="#hexInner" fill="url(#glass)" stroke="url(#t-iron)" stroke-width="1.2"/>
      <g clip-path="url(#hexClip)">
        <use href="#peakBody" fill="url(#t-iron)"/>
        <use href="#hexInner" fill="url(#glassShine)"/>
      </g>
      <g fill="url(#t-iron)"><rect x="33" y="72" width="4" height="4" rx="1"/><rect x="41" y="72" width="4" height="4" rx="1" opacity=".22"/><rect x="49" y="72" width="4" height="4" rx="1" opacity=".22"/></g>
    </g>
    <g id="em-bronze">
      <use href="#hexOuter" fill="none" stroke="url(#t-bronze)" stroke-width="2.5"/>
      <use href="#hexInner" fill="url(#glass)" stroke="url(#t-bronze)" stroke-width="1.2"/>
      <g clip-path="url(#hexClip)">
        <use href="#peakBody" fill="url(#t-bronze)"/>
        <use href="#hexInner" fill="url(#glassShine)"/>
      </g>
      <g fill="url(#t-bronze)"><rect x="33" y="72" width="4" height="4" rx="1"/><rect x="41" y="72" width="4" height="4" rx="1"/><rect x="49" y="72" width="4" height="4" rx="1" opacity=".22"/></g>
    </g>
    <g id="em-silver">
      <use href="#hexOuter" fill="none" stroke="url(#t-silver)" stroke-width="2.5"/>
      <use href="#hexInner" fill="url(#glass)" stroke="url(#t-silver)" stroke-width="1.2"/>
      <g clip-path="url(#hexClip)">
        <use href="#peakBody" fill="url(#t-silver)"/>
        <use href="#hexInner" fill="url(#glassShine)"/>
      </g>
      <g fill="url(#t-silver)"><rect x="29" y="72" width="4" height="4" rx="1"/><rect x="37" y="72" width="4" height="4" rx="1"/><rect x="45" y="72" width="4" height="4" rx="1"/><rect x="53" y="72" width="4" height="4" rx="1" opacity=".22"/></g>
    </g>
    <g id="em-gold">
      <use href="#hexOuter" fill="none" stroke="url(#t-gold)" stroke-width="2.5"/>
      <use href="#hexInner" fill="url(#glass)" stroke="url(#t-gold)" stroke-width="1.2"/>
      <g clip-path="url(#hexClip)">
        <use href="#peakBody" fill="url(#t-gold)"/>
        <use href="#hexInner" fill="url(#glassShine)"/>
      </g>
      <path d="M44 16 l2.4 5 5 2.4 -5 2.4 -2.4 5 -2.4 -5 -5 -2.4 5 -2.4 Z" fill="#ffe28e"/>
      <g fill="url(#t-gold)"><rect x="29" y="72" width="4" height="4" rx="1"/><rect x="37" y="72" width="4" height="4" rx="1"/><rect x="45" y="72" width="4" height="4" rx="1"/><rect x="53" y="72" width="4" height="4" rx="1"/></g>
    </g>
    <g id="em-platinum">
      <use href="#hexOuter" fill="none" stroke="url(#t-platinum)" stroke-width="2.5"/>
      <use href="#hexInner" fill="url(#glass)" stroke="url(#t-platinum)" stroke-width="1.2"/>
      <g clip-path="url(#hexClip)">
        <use href="#peakBody" fill="url(#t-platinum)"/>
        <path d="M10 34 H30 M6 42 H24 M12 50 H26" stroke="#a8d6ff" stroke-width="2" stroke-linecap="round" opacity=".6"/>
        <use href="#hexInner" fill="url(#glassShine)"/>
      </g>
      <g fill="url(#t-platinum)"><rect x="25" y="72" width="4" height="4" rx="1"/><rect x="33" y="72" width="4" height="4" rx="1"/><rect x="41" y="72" width="4" height="4" rx="1"/><rect x="49" y="72" width="4" height="4" rx="1"/><rect x="57" y="72" width="4" height="4" rx="1" opacity=".22"/></g>
    </g>
    <g id="em-titan">
      <use href="#hexOuter" fill="none" stroke="url(#t-titan)" stroke-width="2.5"/>
      <use href="#hexInner" fill="url(#glass)" stroke="url(#t-titan)" stroke-width="1.2"/>
      <g clip-path="url(#hexClip)">
        <use href="#peakBody" fill="url(#t-titan)"/>
        <path d="M50 20 L40 38 h7 L42 54 L56 34 h-8 L52 20 Z" fill="#efe4ff"/>
        <use href="#hexInner" fill="url(#glassShine)"/>
      </g>
      <g fill="url(#t-titan)"><rect x="25" y="72" width="4" height="4" rx="1"/><rect x="33" y="72" width="4" height="4" rx="1"/><rect x="41" y="72" width="4" height="4" rx="1"/><rect x="49" y="72" width="4" height="4" rx="1"/><rect x="57" y="72" width="4" height="4" rx="1"/></g>
    </g>

    <path id="ringPath" d="M100,26 a74,74 0 1,1 -0.01,0 Z"/>
`;

const DEFS_MARKUP = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${SVG_DEFS_INNER}</defs></svg>`;

let injected = false;

export function injectSvgDefs(): void {
  if (injected) return;
  const container = document.createElement("div");
  container.innerHTML = DEFS_MARKUP;
  document.body.prepend(container.firstElementChild as Node);
  injected = true;
}

export function emblemMarkup(tierId: string, className = "icon"): string {
  return `<svg class="${className}" viewBox="0 0 88 96"><use href="#em-${tierId}"/></svg>`;
}
