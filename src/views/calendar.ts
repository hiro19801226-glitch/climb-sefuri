import type { CalEvent } from "../types";
import { getEventsStore } from "../firebase/eventsStore";
import { isFirebaseConfigured } from "../firebase/config";
import { WEEKDAYS, isoOf, todayISO, formatEventDate, escapeHtml, lineShareUrl } from "../lib/format";

export function calendarViewMarkup(): string {
  return `
  <section class="view" id="view-calendar" role="tabpanel">
    <p class="sec-label">Calendar</p>
    <h2>予定を、共有しよう。</h2>
    <p class="desc">練習会やイベントの予定をみんなで共有（リアルタイム同期）。日付をタップすると、その日の予定と入力日付が切り替わります。</p>

    <div class="cal">
      <div class="cal-head">
        <button type="button" class="cal-nav" id="cal-prev" aria-label="前の月">◀</button>
        <div class="cal-title num" id="cal-title"></div>
        <button type="button" class="cal-nav" id="cal-next" aria-label="次の月">▶</button>
      </div>
      <div class="cal-dow">${WEEKDAYS.map((w, i) => `<span class="dow${i === 0 ? " sun" : i === 6 ? " sat" : ""}">${w}</span>`).join("")}</div>
      <div class="cal-grid" id="cal-grid"></div>
    </div>

    <div class="cal-list-head">
      <h3 class="sub-h" id="cal-list-title">近い予定</h3>
      <button type="button" class="btn-small" id="cal-clear-sel" hidden>近い予定に戻る</button>
    </div>
    <div class="cal-list" id="cal-list"></div>

    <h3 class="sub-h">予定を追加</h3>
    <form class="member-form cal-form" id="event-form" autocomplete="off">
      <div>
        <label for="event-date">日付</label>
        <input id="event-date" name="date" type="date" required>
      </div>
      <div>
        <label for="event-title">タイトル</label>
        <input id="event-title" name="title" type="text" required placeholder="例: 背振ロング練習会">
      </div>
      <div>
        <label for="event-note">メモ（任意）</label>
        <input id="event-note" name="note" type="text" placeholder="例: 8:00 峠の茶屋 集合">
      </div>
      <button type="submit" class="btn btn-line submit" id="event-submit">予定を追加</button>
      <p class="hint">URLを知っている人は誰でも予定の追加・編集・削除ができます。</p>
    </form>

    <p class="member-status" id="event-status"></p>
  </section>`;
}

export function mountCalendarView(root: ParentNode): void {
  const form = root.querySelector<HTMLFormElement>("#event-form")!;
  const dateInput = root.querySelector<HTMLInputElement>("#event-date")!;
  const titleInput = root.querySelector<HTMLInputElement>("#event-title")!;
  const noteInput = root.querySelector<HTMLInputElement>("#event-note")!;
  const submitBtn = root.querySelector<HTMLButtonElement>("#event-submit")!;
  const statusEl = root.querySelector<HTMLElement>("#event-status")!;
  const titleEl = root.querySelector<HTMLElement>("#cal-title")!;
  const gridEl = root.querySelector<HTMLElement>("#cal-grid")!;
  const prevBtn = root.querySelector<HTMLButtonElement>("#cal-prev")!;
  const nextBtn = root.querySelector<HTMLButtonElement>("#cal-next")!;
  const listEl = root.querySelector<HTMLElement>("#cal-list")!;
  const listTitleEl = root.querySelector<HTMLElement>("#cal-list-title")!;
  const clearSelBtn = root.querySelector<HTMLButtonElement>("#cal-clear-sel")!;

  const today = todayISO();
  const initial = new Date();
  let viewYear = initial.getFullYear();
  let viewMonth = initial.getMonth(); // 0-based
  let selectedDate: string | null = null;
  let editingId: string | null = null;
  let latestEvents: CalEvent[] = [];

  dateInput.value = today;

  statusEl.textContent = isFirebaseConfigured
    ? ""
    : "Firebase 未設定のため、ローカルのモックで動作しています（他端末とは同期されません）。";
  statusEl.classList.remove("err");

  function eventsByDate(): Map<string, CalEvent[]> {
    const map = new Map<string, CalEvent[]>();
    for (const e of latestEvents) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }

  function renderGrid() {
    titleEl.textContent = `${viewYear}年${viewMonth + 1}月`;
    const byDate = eventsByDate();
    const firstDow = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells: string[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(`<div class="cal-day blank"></div>`);

    for (let day = 1; day <= daysInMonth; day++) {
      const iso = isoOf(viewYear, viewMonth, day);
      const dow = new Date(viewYear, viewMonth, day).getDay();
      const dayEvents = byDate.get(iso) ?? [];
      const classes = ["cal-day"];
      if (iso === today) classes.push("today");
      if (iso === selectedDate) classes.push("selected");
      if (iso < today) classes.push("past");
      if (dow === 0) classes.push("sun");
      if (dow === 6) classes.push("sat");

      const dots = dayEvents
        .slice(0, 3)
        .map(() => `<span class="cal-dot"></span>`)
        .join("");
      const more = dayEvents.length > 3 ? `<span class="cal-more">+${dayEvents.length - 3}</span>` : "";

      cells.push(
        `<button type="button" class="${classes.join(" ")}" data-date="${iso}">
           <span class="cal-daynum">${day}</span>
           ${dayEvents.length ? `<span class="cal-dots">${dots}${more}</span>` : ""}
         </button>`
      );
    }

    gridEl.innerHTML = cells.join("");
  }

  function eventRow(e: CalEvent): string {
    const chips = e.attendees
      .map(
        (a) =>
          `<span class="attendee">${escapeHtml(a.name)}<button type="button" class="attendee-x" data-leave="${a.id}" aria-label="${escapeHtml(a.name)} の参加を取り消し">×</button></span>`
      )
      .join("");
    return `
      <div class="cal-event" data-id="${e.id}">
        <div class="cal-event-date num">${formatEventDate(e.date)}</div>
        <div class="cal-event-body">
          <div class="cal-event-title">${escapeHtml(e.title)}</div>
          ${e.note ? `<div class="cal-event-note">${escapeHtml(e.note)}</div>` : ""}
          <div class="cal-attend">
            <div class="cal-attend-count">参加 <b>${e.attendees.length}</b>人</div>
            ${chips ? `<div class="cal-attend-list">${chips}</div>` : ""}
            <form class="cal-attend-form" data-join="${e.id}">
              <input type="text" class="cal-attend-input" placeholder="名前を入れて参加表明" aria-label="参加者名" maxlength="24">
              <button type="submit" class="btn-small">参加</button>
            </form>
          </div>
        </div>
        <div class="cal-event-actions">
          <a class="btn-small" href="${lineShareUrl(e.date, e.title, e.note)}" target="_blank" rel="noopener noreferrer">LINEで告知</a>
          <button type="button" class="btn-small" data-edit="${e.id}">編集</button>
          <button type="button" class="btn-small danger" data-delete="${e.id}">削除</button>
        </div>
      </div>`;
  }

  function renderList() {
    let events: CalEvent[];
    if (selectedDate) {
      listTitleEl.textContent = `${formatEventDate(selectedDate)} の予定`;
      clearSelBtn.hidden = false;
      events = latestEvents.filter((e) => e.date === selectedDate);
    } else {
      listTitleEl.textContent = "近い予定";
      clearSelBtn.hidden = true;
      events = latestEvents.filter((e) => e.date >= today);
    }

    listEl.innerHTML = events.length
      ? events.map(eventRow).join("\n")
      : `<p class="cal-empty">予定はありません。上のフォームから追加できます。</p>`;
  }

  function render(events: CalEvent[]) {
    latestEvents = events;
    renderGrid();
    renderList();
  }

  function resetForm() {
    editingId = null;
    titleInput.value = "";
    noteInput.value = "";
    submitBtn.textContent = "予定を追加";
  }

  getEventsStore().then((store) => {
    store.subscribe(render);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const date = dateInput.value;
      const title = titleInput.value.trim();
      const note = noteInput.value.trim();

      if (!date || !title) {
        statusEl.textContent = "入力エラー: 日付とタイトルを入力してください。";
        statusEl.classList.add("err");
        return;
      }
      statusEl.classList.remove("err");
      const data = { date, title, note: note || null };

      if (editingId) {
        await store.update(editingId, data);
        statusEl.textContent = `「${title}」を更新しました。`;
      } else {
        await store.add(data);
        statusEl.textContent = `${formatEventDate(date)} に「${title}」を追加しました。`;
      }
      resetForm();
    });

    prevBtn.addEventListener("click", () => {
      viewMonth--;
      if (viewMonth < 0) {
        viewMonth = 11;
        viewYear--;
      }
      renderGrid();
    });
    nextBtn.addEventListener("click", () => {
      viewMonth++;
      if (viewMonth > 11) {
        viewMonth = 0;
        viewYear++;
      }
      renderGrid();
    });

    gridEl.addEventListener("click", (e) => {
      const cell = (e.target as HTMLElement).closest<HTMLElement>(".cal-day[data-date]");
      if (!cell) return;
      const date = cell.dataset.date!;
      selectedDate = selectedDate === date ? null : date;
      dateInput.value = date;
      renderGrid();
      renderList();
    });

    clearSelBtn.addEventListener("click", () => {
      selectedDate = null;
      renderGrid();
      renderList();
    });

    // 参加表明（各予定行のインラインフォーム）
    listEl.addEventListener("submit", async (e) => {
      const joinForm = (e.target as HTMLElement).closest<HTMLFormElement>("form[data-join]");
      if (!joinForm) return;
      e.preventDefault();
      const eventId = joinForm.dataset.join!;
      const input = joinForm.querySelector<HTMLInputElement>(".cal-attend-input")!;
      const name = input.value.trim();
      if (!name) return;
      input.value = "";
      await store.join(eventId, name);
    });

    listEl.addEventListener("click", async (e) => {
      const el = e.target as HTMLElement;

      const leaveId = el.closest<HTMLElement>("[data-leave]")?.dataset.leave;
      if (leaveId) {
        const eventId = el.closest<HTMLElement>(".cal-event")?.dataset.id;
        const ev = latestEvents.find((x) => x.id === eventId);
        const att = ev?.attendees.find((a) => a.id === leaveId);
        if (eventId && window.confirm(`${att?.name ?? "この参加者"} の参加を取り消しますか？`)) {
          await store.leave(eventId, leaveId);
        }
        return;
      }

      const editId = el.closest<HTMLElement>("[data-edit]")?.dataset.edit;
      const deleteId = el.closest<HTMLElement>("[data-delete]")?.dataset.delete;

      if (editId) {
        const ev = latestEvents.find((x) => x.id === editId);
        if (ev) {
          dateInput.value = ev.date;
          titleInput.value = ev.title;
          noteInput.value = ev.note ?? "";
          editingId = editId;
          submitBtn.textContent = "更新";
          titleInput.focus();
        }
      }

      if (deleteId) {
        const ev = latestEvents.find((x) => x.id === deleteId);
        const label = ev ? `「${ev.title}」` : "この予定";
        if (window.confirm(`${label}を削除しますか？この操作は取り消せません。`)) {
          await store.remove(deleteId);
          if (editingId === deleteId) resetForm();
        }
      }
    });
  });
}
