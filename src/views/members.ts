import type { Member, RecordItem } from "../types";
import { getMembersStore, memberBestSeconds } from "../firebase/membersStore";
import { isFirebaseConfigured } from "../firebase/config";
import { mmssToSeconds, secondsToClock } from "../firebase/time";
import { judgeTier, tierLabel } from "../data/tiers";
import { emblemMarkup } from "../components/defs";
import { meterMarkup } from "../components/meter";
import { stickerDownload, DOWNLOAD_ICON } from "../components/sticker";
import { TIME_PATTERN } from "../components/memberForm";
import { todayISO, formatEventDate, escapeHtml } from "../lib/format";

const TIER_ABBR: Record<string, string> = {
  iron: "i",
  bronze: "b",
  silver: "s",
  gold: "g",
  platinum: "p",
  titan: "t",
};

export function membersViewMarkup(): string {
  return `
  <section class="view" id="view-members" role="tabpanel">
    <p class="sec-label">Leaderboard</p>
    <h2>自己ベストで、頂へ。</h2>
    <p class="desc">自己申告のタイムを記録して、ベストで競おう。メンバーの追加は「参加する」から。記録は履歴に残り、全員にリアルタイム共有されます。</p>

    <form class="member-form record-form" id="record-form" autocomplete="off">
      <div>
        <label for="record-member">メンバー</label>
        <select id="record-member" required></select>
      </div>
      <div>
        <label for="record-date">走った日</label>
        <input id="record-date" type="date" required>
      </div>
      <div>
        <label for="record-time">タイム（分.秒）</label>
        <input id="record-time" type="text" required placeholder="例: 52.30" pattern="\\d{1,3}\\.\\d{1,2}">
      </div>
      <div>
        <label for="record-note">メモ（任意）</label>
        <input id="record-note" type="text" placeholder="例: 追い風・新機材">
      </div>
      <button type="submit" class="btn btn-line submit" id="record-submit">記録を追加</button>
      <p class="hint">自己申告のタイムを追加します。ベストタイムでランキングされ、履歴に残ります。</p>
    </form>

    <p class="member-status" id="member-status"></p>

    <div class="members" id="members-list"></div>
  </section>`;
}

function recordRow(r: RecordItem, isBest: boolean): string {
  const sec = mmssToSeconds(r.time);
  return `
    <li class="rec${isBest ? " best" : ""}">
      <span class="rec-date num">${formatEventDate(r.date)}</span>
      <span class="rec-time num">${sec != null ? secondsToClock(sec) : r.time}</span>
      ${isBest ? `<span class="rec-badge">BEST</span>` : ""}
      ${r.note ? `<span class="rec-note">${escapeHtml(r.note)}</span>` : ""}
      <button type="button" class="rec-del" data-delrecord="${r.id}" aria-label="記録を削除">削除</button>
    </li>`;
}

function memberCardMarkup(member: Member, position: number | null): string {
  const bestSeconds = memberBestSeconds(member);
  const targetSeconds = mmssToSeconds(member.target) ?? 0;
  const judgement = judgeTier(bestSeconds);
  const hasTier = judgement !== "none" && judgement !== "finisher";
  const tierClass = hasTier ? TIER_ABBR[judgement] : "s";

  const posChip =
    position != null ? `<span class="pos${position === 1 ? " lead" : ""}">#${position}</span>` : "";

  const attempts = member.records.length;
  const bestLabel = bestSeconds != null ? secondsToClock(bestSeconds) : "—";

  // 最速の記録ID（履歴でハイライト）
  let bestRecId: string | null = null;
  let bestRecSec = Infinity;
  for (const r of member.records) {
    const s = mmssToSeconds(r.time);
    if (s != null && s < bestRecSec) {
      bestRecSec = s;
      bestRecId = r.id;
    }
  }

  const history = attempts
    ? `<details class="member-history">
         <summary>履歴 <span class="hist-count">${attempts}</span></summary>
         <ul class="rec-list">${member.records.map((r) => recordRow(r, r.id === bestRecId)).join("")}</ul>
       </details>`
    : "";

  let sticker: string;
  if (judgement === "none") {
    sticker = `<p class="sticker-note">記録を追加するとステッカーを取得できます。</p>`;
  } else {
    const { img, file } = stickerDownload(judgement);
    const label = judgement === "finisher" ? "Finisher" : tierLabel(judgement);
    sticker = `<a class="btn-small sticker-dl" href="${img}" download="${file}">${DOWNLOAD_ICON}<span>${label}ステッカーを保存</span></a>`;
  }

  return `
    <div class="member m-${tierClass}" data-id="${member.id}">
      <div class="row-actions">
        <button type="button" class="btn-small danger" data-delete="${member.id}">削除</button>
      </div>
      ${hasTier ? emblemMarkup(judgement, "m-icon") : ""}
      <div class="tag-row">${posChip}<span class="tag">${tierLabel(judgement)}</span></div>
      <h3>${member.name}</h3>
      <p class="sub">ベスト <b class="best-time num">${bestLabel}</b>${attempts ? ` <span class="attempts">・ ${attempts}回</span>` : ""}</p>
      ${meterMarkup({
        nowSeconds: bestSeconds,
        targetSeconds,
        ariaLabel: `${member.name} の目標タイムに対する進捗`,
      })}
      ${history}
      <div class="sticker-actions">${sticker}</div>
    </div>`;
}

export function mountMembersView(root: ParentNode): void {
  const form = root.querySelector<HTMLFormElement>("#record-form")!;
  const memberSelect = root.querySelector<HTMLSelectElement>("#record-member")!;
  const dateInput = root.querySelector<HTMLInputElement>("#record-date")!;
  const timeInput = root.querySelector<HTMLInputElement>("#record-time")!;
  const noteInput = root.querySelector<HTMLInputElement>("#record-note")!;
  const statusEl = root.querySelector<HTMLElement>("#member-status")!;
  const listEl = root.querySelector<HTMLElement>("#members-list")!;

  let latestMembers: Member[] = [];

  dateInput.value = todayISO();

  statusEl.textContent = isFirebaseConfigured
    ? ""
    : "Firebase 未設定のため、ローカルのモックで動作しています（他端末とは同期されません）。";
  statusEl.classList.remove("err");

  function renderSelect(members: Member[]) {
    const prev = memberSelect.value;
    if (members.length === 0) {
      memberSelect.innerHTML = `<option value="" disabled selected>メンバーがいません（「参加する」から登録）</option>`;
      return;
    }
    memberSelect.innerHTML = members.map((m) => `<option value="${m.id}">${m.name}</option>`).join("");
    if (members.some((m) => m.id === prev)) memberSelect.value = prev;
  }

  function render(members: Member[]) {
    latestMembers = members;
    renderSelect(members);
    // ベストタイムを持つ人にだけ順位を振る（速い順）
    let position = 0;
    listEl.innerHTML = members
      .map((m) => memberCardMarkup(m, memberBestSeconds(m) != null ? ++position : null))
      .join("\n");
  }

  getMembersStore().then((store) => {
    store.subscribe(render);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = memberSelect.value;
      const date = dateInput.value;
      const time = timeInput.value.trim();
      const note = noteInput.value.trim();
      const member = latestMembers.find((m) => m.id === id);

      if (!member || !date || !TIME_PATTERN.test(time)) {
        statusEl.textContent = "入力エラー: メンバー・走った日・タイム（分.秒）を正しく入力してください。";
        statusEl.classList.add("err");
        return;
      }

      statusEl.classList.remove("err");
      await store.addRecord(id, { date, time, note: note || null });
      statusEl.textContent = `${member.name} さんの記録 ${secondsToClock(mmssToSeconds(time)!)}（${formatEventDate(date)}）を追加しました。`;
      timeInput.value = "";
      noteInput.value = "";
    });

    listEl.addEventListener("click", async (e) => {
      const el = e.target as HTMLElement;

      const delRecId = el.closest<HTMLElement>("[data-delrecord]")?.dataset.delrecord;
      if (delRecId) {
        const memberId = el.closest<HTMLElement>(".member")?.dataset.id;
        if (memberId && window.confirm("この記録を削除しますか？")) {
          await store.removeRecord(memberId, delRecId);
        }
        return;
      }

      const deleteId = el.closest<HTMLElement>("[data-delete]")?.dataset.delete;
      if (!deleteId) return;
      const member = latestMembers.find((m) => m.id === deleteId);
      const name = member?.name ?? "このメンバー";
      if (window.confirm(`${name} を削除しますか？記録の履歴も消えます。この操作は取り消せません。`)) {
        await store.remove(deleteId);
      }
    });
  });
}
