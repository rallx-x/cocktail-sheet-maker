// Tester build (limited private distribution). Editor UI only: nothing here touches project state or the
// renderer, so it can never appear in the sheet or in an export.
//  1) App subtitle: the header h1 becomes a small "COCKTAIL / SHEET MAKER" under the logo line.
//  2) Entry notice: a <dialog> shown once per TESTER_BUILD per browser (localStorage). If storage is
//     unavailable (private mode, blocked site data), it simply shows on every launch.
// No accounts, network, telemetry or access control — intentionally simple.

export const TESTER_BUILD = "tester-1"; // bump when sending testers a new build → the notice shows once again
const KEY = `tdad.testerNotice.${TESTER_BUILD}`;

const LINES = [
  "테스터용으로 제한 배포 중인 개인 제작 도구입니다.",
  "사용 중 발견한 UI/UX 불편 사항, 버그 및 오류를 제보해 주세요.",
  "제3자에게 파일을 재배포하거나 공개적으로 공유하지 말아 주세요.",
];

export function initTesterBuild() {
  const h1 = document.querySelector(".panel-header h1");
  if (h1) {
    h1.textContent = "COCKTAIL / SHEET MAKER";
    h1.classList.add("app-subtitle");
  }

  let seen = false;
  try {
    seen = localStorage.getItem(KEY) === "1";
  } catch {
    seen = false;
  }
  if (seen) return;

  const dialog = document.createElement("dialog");
  dialog.className = "tester-notice";
  dialog.setAttribute("aria-labelledby", "tester-notice-title");
  const title = document.createElement("h2");
  title.id = "tester-notice-title";
  title.textContent = "테스터 버전 안내";
  const badge = document.createElement("p");
  badge.className = "tester-badge";
  badge.textContent = `TESTER BUILD · ${TESTER_BUILD}`;
  const body = document.createElement("div");
  for (const line of LINES) {
    const p = document.createElement("p");
    p.textContent = line;
    body.append(p);
  }
  const ok = document.createElement("button");
  ok.type = "button";
  ok.textContent = "확인했어요";
  ok.addEventListener("click", () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* storage unavailable: the notice will show again next time */
    }
    dialog.close();
    dialog.remove();
  });
  dialog.addEventListener("cancel", (e) => e.preventDefault()); // Esc does not skip it: confirm with the button
  dialog.append(badge, title, body, ok);
  document.body.append(dialog);
  dialog.showModal();
  ok.focus();
}
