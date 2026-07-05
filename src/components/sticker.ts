import type { Tier, TierId } from "../types";
import { tiers } from "../data/tiers";
import { SVG_DEFS_INNER } from "./defs";

const COURSE_RING_TEXT = "CLIMB SEFURI PROJECT ・ 13.9km / +910m ・ SEFURI LONG ・";

/** ステッカーSVGの中身（<defs> は含まない）。埋め込み先の <svg> 側で defs を用意する前提 */
function stickerInner(tier: Tier): string {
  return `
      <circle cx="100" cy="100" r="98" fill="#f4f6f9"/>
      <circle cx="100" cy="100" r="90" fill="url(#${tier.gradient})"/>
      <circle cx="100" cy="100" r="66" fill="#10151d"/>
      <circle cx="100" cy="100" r="66" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="1"/>
      <text font-family="Oswald, sans-serif" font-size="11.5" font-weight="600" letter-spacing="2.5" fill="${tier.dark}">
        <textPath href="#ringPath" startOffset="1%">${COURSE_RING_TEXT}</textPath>
      </text>
      <g transform="translate(70,42) scale(0.68)"><use href="#em-${tier.id}"/></g>
      <text x="100" y="138" text-anchor="middle" font-family="Oswald, sans-serif" font-weight="700" font-size="26" fill="#eef2f7" letter-spacing="1">SUB ${tier.subMinutes}</text>
      <text x="100" y="155" text-anchor="middle" font-family="Oswald, sans-serif" font-weight="600" font-size="10.5" fill="rgba(238,242,247,.55)" letter-spacing="3">${tier.en}</text>`;
}

/** ランクページ表示用（ページ側の共有 <defs> を参照） */
export function stickerMarkup(tier: Tier): string {
  return `
  <figure class="sticker">
    <svg viewBox="0 0 200 200" role="img" aria-label="${tier.jp} 達成ステッカー SUB ${tier.subMinutes}">${stickerInner(tier)}
    </svg>
    <figcaption class="cap">${tier.jp}／SUB ${tier.subMinutes}</figcaption>
  </figure>`;
}

export function stickersGridMarkup(tierList: Tier[]): string {
  return tierList.map(stickerMarkup).join("\n");
}

/** ダウンロード用の自己完結SVG（defs を埋め込み、単体で開いても表示できる） */
export function standaloneStickerSvg(tier: Tier): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs>${SVG_DEFS_INNER}</defs>${stickerInner(tier)}
</svg>`;
}

/** 取得ティアのステッカーSVGをファイルとしてダウンロードさせる */
export function downloadStickerSvg(tierId: TierId): void {
  const tier = tiers.find((t) => t.id === tierId);
  if (!tier) return;
  const svg = standaloneStickerSvg(tier);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `climb-sefuri-sticker-${tier.id}.svg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
