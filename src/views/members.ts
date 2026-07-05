import type { Member, TierId } from "../types";
import { getMembersStore } from "../firebase/membersStore";
import { isFirebaseConfigured } from "../firebase/config";
import { mmssToSeconds, secondsToClock } from "../firebase/time";
import { judgeTier, tierLabel } from "../data/tiers";
import { emblemMarkup } from "../components/defs";
import { meterMarkup } from "../components/meter";
import { downloadStickerSvg } from "../components/sticker";
import { TIME_PATTERN } from "../components/memberForm";

const TIER_ABBR: Record<string, string> = {
  iron: "i",
  bronze: "b",
  silver: "s",
  gold: "g",
  platinum: "p",
  titan: "t",
};

const DOWNLOAD_ICON = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>`;

export function membersViewMarkup(): string {
  return `
  <section class="view" id="view-members" role="tabpanel">
    <p class="sec-label">Core Members</p>
    <h2>リザルトを登録しよう。</h2>
    <p class="desc">出走後のリザルトタイムを記録。メンバーの追加は「参加する」から行えます。リザルトはリアルタイムに共有されます。</p>

    <form class="member-form result-form" id="result-form" autocomplete="off">
      <div>
        <label for="result-member">メンバー</label>
        <select id="result-member" required></select>
      </div>
      <div>
        <label for="result-time">リザルトタイム（分.秒）</label>
        <input id="result-time" type="text" required placeholder="例: 52.30" pattern="\\d{1,3}\\.\\d{1,2}">
      </div>
      <button type="submit" class="btn btn-line submit" id="result-submit">リザルト登録</button>
      <p class="hint">タイムは「分.秒」形式で入力してください（例: 52分30秒 → 52.30）。同じメンバーを再登録するとリザルトを更新します。</p>
    </form>

    <p class="member-status" id="member-status"></p>

    <div class="members" id="members-list"></div>
  </section>`;
}

function memberCardMarkup(member: Member, position: number | null): string {
  const resultSeconds = mmssToSeconds(member.result);
  const targetSeconds = mmssToSeconds(member.target) ?? 0;
  const judgement = judgeTier(resultSeconds);
  const hasTier = judgement !== "none" && judgement !== "finisher";
  const tierClass = hasTier ? TIER_ABBR[judgement] : "s";

  const posChip =
    position != null ? `<span class="pos${position === 1 ? " lead" : ""}">#${position}</span>` : "";

  const sticker = hasTier
    ? `<button type="button" class="btn-small sticker-dl" data-sticker="${judgement}">${DOWNLOAD_ICON}<span>${tierLabel(judgement)}ステッカーを保存</span></button>`
    : `<p class="sticker-note">ステッカーは称号獲得（65分切り）で取得できます。</p>`;

  return `
    <div class="member m-${tierClass}" data-id="${member.id}">
      <div class="row-actions">
        <button type="button" class="btn-small danger" data-delete="${member.id}">削除</button>
      </div>
      ${hasTier ? emblemMarkup(judgement, "m-icon") : ""}
      <div class="tag-row">${posChip}<span class="tag">${tierLabel(judgement)}</span></div>
      <h3>${member.name}</h3>
      <p class="sub">称号判定: ${tierLabel(judgement)}</p>
      ${meterMarkup({
        nowSeconds: resultSeconds,
        targetSeconds,
        ariaLabel: `${member.name} の目標タイムに対する進捗`,
      })}
      <div class="sticker-actions">${sticker}</div>
    </div>`;
}

export function mountMembersView(root: ParentNode): void {
  const form = root.querySelector<HTMLFormElement>("#result-form")!;
  const memberSelect = root.querySelector<HTMLSelectElement>("#result-member")!;
  const timeInput = root.querySelector<HTMLInputElement>("#result-time")!;
  const statusEl = root.querySelector<HTMLElement>("#member-status")!;
  const listEl = root.querySelector<HTMLElement>("#members-list")!;

  let latestMembers: Member[] = [];

  statusEl.textContent = isFirebaseConfigured
    ? "Firebase に接続中..."
    : "Firebase 未設定のため、ローカルのモックデータで動作しています（src/firebase/config.ts を設定すると実際に同期されます）。";
  statusEl.classList.remove("err");

  function renderSelect(members: Member[]) {
    const prev = memberSelect.value;
    if (members.length === 0) {
      memberSelect.innerHTML = `<option value="" disabled selected>メンバーがいません（「参加する」から登録）</option>`;
      return;
    }
    memberSelect.innerHTML = members
      .map((m) => `<option value="${m.id}">${m.name}</option>`)
      .join("");
    // 再描画をまたいで選択中メンバーを維持
    if (members.some((m) => m.id === prev)) memberSelect.value = prev;
  }

  function render(members: Member[]) {
    latestMembers = members;
    renderSelect(members);
    // リザルト保持者にだけ順位を振る（速い順。未出走はバッジなし）
    let position = 0;
    listEl.innerHTML = members
      .map((m) => memberCardMarkup(m, mmssToSeconds(m.result) != null ? ++position : null))
      .join("\n");
  }

  getMembersStore().then((store) => {
    store.subscribe(render);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = memberSelect.value;
      const time = timeInput.value.trim();
      const member = latestMembers.find((m) => m.id === id);

      if (!member || !TIME_PATTERN.test(time)) {
        statusEl.textContent = "入力エラー: メンバーを選び、リザルトタイム（分.秒）を正しく入力してください。";
        statusEl.classList.add("err");
        return;
      }

      statusEl.classList.remove("err");
      await store.update(id, { result: time });
      statusEl.textContent = `${member.name} さんのリザルト ${secondsToClock(mmssToSeconds(time)!)} を登録しました。`;
      timeInput.value = "";
    });

    listEl.addEventListener("click", async (e) => {
      const el = e.target as HTMLElement;

      const stickerTier = el.closest<HTMLElement>("[data-sticker]")?.dataset.sticker;
      if (stickerTier) {
        downloadStickerSvg(stickerTier as TierId);
        return;
      }

      const deleteId = el.closest<HTMLElement>("[data-delete]")?.dataset.delete;
      if (!deleteId) return;
      const member = latestMembers.find((m) => m.id === deleteId);
      const name = member?.name ?? "このメンバー";
      if (window.confirm(`${name} を削除しますか？この操作は取り消せません。`)) {
        await store.remove(deleteId);
      }
    });
  });
}
