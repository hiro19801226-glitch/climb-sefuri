import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";

import { injectSvgDefs } from "./components/defs";
import { initParticles } from "./background/particles";
import { initRouter } from "./router";
import { homeViewMarkup, mountHomeUpcoming } from "./views/home";
import { ranksViewMarkup } from "./views/ranks";
import { membersViewMarkup, mountMembersView } from "./views/members";
import { calendarViewMarkup, mountCalendarView } from "./views/calendar";
import { joinViewMarkup, mountJoinView } from "./views/join";

function shellMarkup(): string {
  return `
    <div class="bg" aria-hidden="true">
      <div class="contour"></div>
      <div class="orb o1"></div><div class="orb o2"></div><div class="orb o3"></div>
      <canvas id="particles"></canvas>
    </div>

    <nav>
      <div class="nav-inner">
        <div class="brand">Climb <em>Sefuri</em> Project</div>
        <div class="tabs" role="tablist" aria-label="ページ切替">
          <button class="tab" role="tab" data-view="home" aria-selected="true">ホーム</button>
          <button class="tab" role="tab" data-view="ranks" aria-selected="false">称号</button>
          <button class="tab" role="tab" data-view="members" aria-selected="false">メンバー</button>
          <button class="tab" role="tab" data-view="calendar" aria-selected="false">カレンダー</button>
          <button class="tab" role="tab" data-view="join" aria-selected="false">参加する</button>
        </div>
      </div>
    </nav>

    <main class="app">
      ${homeViewMarkup()}
      ${ranksViewMarkup()}
      ${membersViewMarkup()}
      ${calendarViewMarkup()}
      ${joinViewMarkup()}
    </main>

    <footer>Climb Sefuri Project ── 背振ロング 13.9km / +910m / 山頂 1,055m</footer>
  `;
}

function mount(): void {
  const app = document.getElementById("app");
  if (!app) throw new Error("#app not found");

  injectSvgDefs();
  app.innerHTML = shellMarkup();

  const canvas = app.querySelector<HTMLCanvasElement>("#particles");
  if (canvas) initParticles(canvas);

  initRouter(app);
  mountHomeUpcoming(app.querySelector("#view-home")!);
  mountMembersView(app.querySelector("#view-members")!);
  mountCalendarView(app.querySelector("#view-calendar")!);
  mountJoinView(app.querySelector("#view-join")!);
}

mount();
