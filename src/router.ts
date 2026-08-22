export type ViewId = "home" | "ranks" | "members" | "calendar" | "join";

const VIEW_IDS: ViewId[] = ["home", "ranks", "members", "calendar", "join"];

export function isViewId(value: string): value is ViewId {
  return (VIEW_IDS as string[]).includes(value);
}

export function initRouter(root: ParentNode): void {
  const tabs = root.querySelectorAll<HTMLElement>(".tab");
  const views = root.querySelectorAll<HTMLElement>(".view");

  function show(id: ViewId): void {
    views.forEach((v) => v.classList.toggle("active", v.id === `view-${id}`));
    tabs.forEach((t) => t.setAttribute("aria-selected", t.dataset.view === id ? "true" : "false"));
    history.replaceState(null, "", `#${id}`);
    window.scrollTo(0, 0);
  }

  tabs.forEach((t) =>
    t.addEventListener("click", () => {
      const id = t.dataset.view;
      if (id && isViewId(id)) show(id);
    })
  );

  // [data-goto] はイベント委譲で処理（動的に追加される要素にも対応）
  root.addEventListener("click", (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-goto]");
    if (!el) return;
    const id = el.dataset.goto;
    if (id && isViewId(id)) show(id);
  });

  // position:sticky のナビは、iOS Safari でスクロール中〜直後に
  // 指の下の要素判定がずれてタブに誤タップが飛ぶことがある
  // （スクロールしていたら勝手にホームへ切り替わる不具合の原因）。
  // スクロール中は一時的にナビのクリックを無効化して誤爆を防ぐ。
  const nav = root.querySelector<HTMLElement>("nav");
  if (nav) {
    let scrollLockTimer: number | undefined;
    const lockNavDuringScroll = () => {
      nav.style.pointerEvents = "none";
      if (scrollLockTimer) window.clearTimeout(scrollLockTimer);
      scrollLockTimer = window.setTimeout(() => {
        nav.style.pointerEvents = "";
      }, 150);
    };
    window.addEventListener("scroll", lockNavDuringScroll, { passive: true });
  }

  // ページを開いたときは常にホームから開始する
  // （共有URLやLINE内蔵ブラウザに #ranks 等が残っていても無視してホームを表示）
  show("home");
}
