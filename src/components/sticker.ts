import type { TierId } from "../types";
import { tiers } from "../data/tiers";
import { stickerImage } from "../data/stickerImages";

export type StickerId = TierId | "finisher";

export const DOWNLOAD_ICON = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>`;

/** メンバーカード等からの取得ステッカーDL用（画像URL＋保存ファイル名） */
export function stickerDownload(id: StickerId): { img: string; file: string } {
  return { img: stickerImage[id], file: `climb-sefuri-sticker-${id}.jpg` };
}

interface StickerEntry {
  id: StickerId;
  jp: string;
  caption: string;
}

function stickerEntry(id: StickerId): StickerEntry {
  if (id === "finisher") return { id, jp: "フィニッシャー", caption: "完走の証" };
  const tier = tiers.find((t) => t.id === id)!;
  return { id, jp: tier.jp, caption: `SUB ${tier.subMinutes}` };
}

function stickerFigure(entry: StickerEntry): string {
  return `
    <figure class="sticker">
      <img class="sticker-photo" src="${stickerImage[entry.id]}" alt="${entry.jp} 達成ステッカー（${entry.caption}）" loading="lazy">
      <figcaption class="cap">${entry.jp}／${entry.caption}</figcaption>
    </figure>`;
}

/** 称号ページの達成ステッカー一覧（6ティア＋フィニッシャー、各DL可） */
export function stickersGridMarkup(): string {
  const ids: StickerId[] = [...tiers.map((t) => t.id), "finisher"];
  return ids.map((id) => stickerFigure(stickerEntry(id))).join("\n");
}
