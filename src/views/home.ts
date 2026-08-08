import { getEventsStore } from "../firebase/eventsStore";
import { todayISO, formatEventDate, escapeHtml } from "../lib/format";

export function homeViewMarkup(): string {
  return `
  <section class="view" id="view-home" role="tabpanel">
    <p class="sec-label">Saga Hillclimb Challenge</p>
    <h1>登れ、仲間と共に。<br><span class="grad">超えろ、自分の限界を。</span></h1>
    <p class="lead">背振ロングで自分をアップデートしよう。目標タイムを設定し、仲間と切磋琢磨しながら、次のステージへ。</p>

    <div class="home-upcoming" id="home-upcoming" hidden>
      <div class="home-upcoming-head">
        <span class="hu-label">近い予定</span>
        <button type="button" class="hu-all" data-goto="calendar">カレンダーを見る →</button>
      </div>
      <div class="hu-list" id="hu-list"></div>
    </div>

    <div class="hero-stats">
      <div class="hstat"><div class="v num">13.9<small>km</small></div><div class="k">全長</div></div>
      <div class="hstat"><div class="v num">910<small>m</small></div><div class="k">獲得標高</div></div>
      <div class="hstat"><div class="v num">1,055<small>m</small></div><div class="k">背振山山頂 標高</div></div>
      <div class="hstat"><div class="v num">6<small>ランク</small></div><div class="k">称号システム</div></div>
    </div>

    <div class="profile" aria-label="背振ロング 標高プロファイル">
      <svg viewBox="0 0 1440 280" preserveAspectRatio="none" role="img">
        <defs>
          <linearGradient id="pf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ff5c3a" stop-opacity=".5"/><stop offset="100%" stop-color="#ff5c3a" stop-opacity="0"/></linearGradient>
          <linearGradient id="ps" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#ffb03a"/><stop offset="100%" stop-color="#ff5c3a"/></linearGradient>
        </defs>
        <path d="M0,270 L120,252 L260,248 L380,220 L520,208 L640,172 L760,160 L880,120 L1000,104 L1120,72 L1240,54 L1360,26 L1440,14 L1440,280 L0,280 Z" fill="url(#pf)"/>
        <path d="M0,270 L120,252 L260,248 L380,220 L520,208 L640,172 L760,160 L880,120 L1000,104 L1120,72 L1240,54 L1360,26 L1440,14" fill="none" stroke="url(#ps)" stroke-width="3"/>
        <circle cx="1440" cy="14" r="6" fill="#ff5c3a"/>
        <text x="1338" y="12" fill="#8b97a8" font-size="13" font-family="Oswald" letter-spacing="1">GOAL 1,055m</text>
        <text x="14" y="258" fill="#8b97a8" font-size="13" font-family="Oswald" letter-spacing="1">START</text>
      </svg>
    </div>

    <div class="home-cta">
      <button class="btn btn-line" data-goto="join">参加する</button>
      <button class="btn btn-ghost" data-goto="ranks">称号システムを見る</button>
    </div>
  </section>`;
}

/** リード文の下に「近い予定」を表示（カレンダーと同じイベントストアをリアルタイム購読） */
export function mountHomeUpcoming(root: ParentNode): void {
  const container = root.querySelector<HTMLElement>("#home-upcoming");
  const list = root.querySelector<HTMLElement>("#hu-list");
  if (!container || !list) return;

  getEventsStore().then((store) => {
    store.subscribe((events) => {
      const today = todayISO();
      const upcoming = events.filter((e) => e.date >= today).slice(0, 3);
      if (!upcoming.length) {
        container.hidden = true;
        list.innerHTML = "";
        return;
      }
      container.hidden = false;
      list.innerHTML = upcoming
        .map(
          (e) => `
        <button type="button" class="hu-item" data-goto="calendar">
          <span class="hu-date num">${formatEventDate(e.date)}</span>
          <span class="hu-title">${escapeHtml(e.title)}</span>
          ${e.attendees.length ? `<span class="hu-att">参加 ${e.attendees.length}</span>` : ""}
        </button>`
        )
        .join("");
    });
  });
}
