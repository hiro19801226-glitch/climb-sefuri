/**
 * メンバー登録フォーム（メンバー画面・参加画面で共有）。
 * 同一ページに複数フォームを共存させられるよう idPrefix で id を分ける。
 */
export const TIME_PATTERN = /^\d{1,3}\.\d{1,2}$/;

export interface MemberFormRefs {
  form: HTMLFormElement;
  name: HTMLInputElement;
  target: HTMLInputElement;
  result: HTMLInputElement | null;
  submit: HTMLButtonElement;
}

export interface MemberFormInput {
  name: string;
  target: string;
  result: string;
}

export interface MemberFormMarkupOptions {
  idPrefix: string;
  submitLabel?: string;
  hint?: string;
  /** リザルトタイム欄を含めるか（参加登録は目標のみなので false） */
  includeResult?: boolean;
}

export function memberFormMarkup({
  idPrefix,
  submitLabel = "登録",
  hint,
  includeResult = true,
}: MemberFormMarkupOptions): string {
  const hintText = hint ?? "タイムは「分.秒」形式で入力してください（例: 52分30秒 → 52.30）。";
  const resultField = includeResult
    ? `
      <div>
        <label for="${idPrefix}-result">リザルトタイム（分.秒・任意）</label>
        <input id="${idPrefix}-result" name="result" type="text" placeholder="例: 52.30" pattern="\\d{1,3}\\.\\d{1,2}">
      </div>`
    : "";
  return `
    <form class="member-form" id="${idPrefix}-form" autocomplete="off">
      <div>
        <label for="${idPrefix}-name">名前</label>
        <input id="${idPrefix}-name" name="name" type="text" required placeholder="例: 山田さん">
      </div>
      <div>
        <label for="${idPrefix}-target">目標タイム（分.秒）</label>
        <input id="${idPrefix}-target" name="target" type="text" required placeholder="例: 45.00" pattern="\\d{1,3}\\.\\d{1,2}">
      </div>${resultField}
      <button type="submit" class="btn btn-line submit" id="${idPrefix}-submit">${submitLabel}</button>
      <p class="hint">${hintText}</p>
    </form>`;
}

export function getMemberFormRefs(root: ParentNode, idPrefix: string): MemberFormRefs {
  return {
    form: root.querySelector<HTMLFormElement>(`#${idPrefix}-form`)!,
    name: root.querySelector<HTMLInputElement>(`#${idPrefix}-name`)!,
    target: root.querySelector<HTMLInputElement>(`#${idPrefix}-target`)!,
    result: root.querySelector<HTMLInputElement>(`#${idPrefix}-result`),
    submit: root.querySelector<HTMLButtonElement>(`#${idPrefix}-submit`)!,
  };
}

export function readMemberForm(refs: MemberFormRefs): MemberFormInput {
  return {
    name: refs.name.value.trim(),
    target: refs.target.value.trim(),
    result: refs.result?.value.trim() ?? "",
  };
}

export function isValidMemberInput(v: MemberFormInput): boolean {
  return Boolean(v.name) && TIME_PATTERN.test(v.target) && (!v.result || TIME_PATTERN.test(v.result));
}

/** フォーム入力をストアの add/update が受け取る形へ正規化 */
export function toMemberRecord(v: MemberFormInput): { name: string; target: string; result: string | null } {
  return { name: v.name, target: v.target, result: v.result || null };
}
