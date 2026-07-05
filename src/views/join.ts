import { getMembersStore } from "../firebase/membersStore";
import {
  memberFormMarkup,
  getMemberFormRefs,
  readMemberForm,
  isValidMemberInput,
  toMemberRecord,
} from "../components/memberForm";

export function joinViewMarkup(): string {
  return `
  <section class="view" id="view-join" role="tabpanel">
    <p class="sec-label">Join The Project</p>
    <h2>参加はシンプル。</h2>
    <p class="desc">Climb Sefuri Projectは、背振ロングを通じて佐賀のサイクリストを応援するプロジェクトです。</p>

    <div class="how">
      <div class="step"><div class="n">STEP 01</div><h4>目標タイムを設定</h4><p>6段階のランクから、自分の次のステージを選ぶ。</p></div>
      <div class="step"><div class="n">STEP 02</div><h4>仲間と登る</h4><p>仲間と切磋琢磨しながら、背振ロングに挑戦する。</p></div>
      <div class="step"><div class="n">STEP 03</div><h4>ステッカーを獲得</h4><p>目標を達成したらステッカーをゲット。称号を証明しよう。</p></div>
    </div>

    <div class="join-cta">
      <h2>一緒に登ろう、最高の景色へ。</h2>
      <p>下のフォームから参加登録しよう。登録するとメンバー一覧に追加され、仲間と目標タイムを共有できます。</p>

      ${memberFormMarkup({
        idPrefix: "join",
        submitLabel: "参加登録する",
        includeResult: false,
        hint: "目標タイムを「分.秒」形式で入力してください（例: 45分ちょうど → 45.00）。リザルトは出走後にメンバー画面から登録します。",
      })}

      <p class="member-status" id="join-status"></p>
      <button type="button" class="btn btn-ghost" data-goto="members">登録したメンバー一覧を見る</button>
    </div>
  </section>`;
}

export function mountJoinView(root: ParentNode): void {
  const refs = getMemberFormRefs(root, "join");
  const statusEl = root.querySelector<HTMLElement>("#join-status")!;

  getMembersStore().then((store) => {
    refs.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = readMemberForm(refs);

      if (!isValidMemberInput(input)) {
        statusEl.textContent = "入力エラー: 名前と目標タイム（分.秒）を正しく入力してください。";
        statusEl.classList.add("err");
        return;
      }

      statusEl.classList.remove("err");
      await store.add(toMemberRecord(input));
      statusEl.textContent = `${input.name} さんを登録しました。メンバー一覧に追加されました。`;
      refs.form.reset();
    });
  });
}
