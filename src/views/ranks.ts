import { tiers } from "../data/tiers";
import { emblemMarkup } from "../components/defs";
import { stickersGridMarkup } from "../components/sticker";

function rankCardMarkup(tier: (typeof tiers)[number]): string {
  return `
      <div class="rank r-${tier.id}">
        ${emblemMarkup(tier.id)}
        <div>
          <div class="tname">${tier.en} ─ ${tier.jp}</div>
          <div class="time num">${tier.subMinutes}<small>分切り</small></div>
          <p class="flavor">${tier.flavor}</p>
        </div>
      </div>`;
}

export function ranksViewMarkup(): string {
  return `
  <section class="view" id="view-ranks" role="tabpanel">
    <p class="sec-label">Rank System</p>
    <h2>称号を、勝ち取れ。</h2>
    <p class="desc">背振ロングのタイムに応じて6段階の称号を用意。エンブレム下部の<b>ピップ（■）</b>がランクレベルを示す。</p>

    <div class="ranks">
      ${tiers.map(rankCardMarkup).join("\n")}
    </div>

    <h3 class="sub-h">達成ステッカー</h3>
    <p class="desc tight">目標達成の証明として配布するダイカットステッカー（φ50mm想定）。フレームやヘルメットに貼って称号を示そう。タイム未達でも、完走すれば <b>Finisher</b> ステッカーを獲得。ダウンロードはメンバーページの各自のカードから。</p>

    <div class="stickers" id="stickerGrid">${stickersGridMarkup()}</div>
  </section>`;
}
