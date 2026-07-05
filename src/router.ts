export type ViewId = "home" | "ranks" | "members" | "join";

const VIEW_IDS: ViewId[] = ["home", "ranks", "members", "join"];

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

  root.querySelectorAll<HTMLElement>("[data-goto]").forEach((b) =>
    b.addEventListener("click", () => {
      const id = b.dataset.goto;
      if (id && isViewId(id)) show(id);
    })
  );

  // ページを開いたときは常にホームから開始する
  // （共有URLやLINE内蔵ブラウザに #ranks 等が残っていても無視してホームを表示）
  show("home");
}
