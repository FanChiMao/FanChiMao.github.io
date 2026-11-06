/**
 * The dashboard's two chart forms, in plain HTML (no chart library):
 *  - columns(): one value per day, thin columns from a shared baseline, hover / focus tooltip.
 *  - bars(): ranked horizontal bars with the label left and the value at the tip.
 * Both are single-series (one hue, no legend) and come with a table view.
 */

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** A "nice" axis top: 1, 2, 5 × 10^n at or above the max. */
function niceMax(v: number) {
  if (v <= 4) return Math.max(1, Math.ceil(v));
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((m) => m >= v)!;
}

function table(head: [string, string], rows: [string, string][]) {
  return `<details class="viz__table"><summary>表格檢視</summary><table><thead><tr><th scope="col">${esc(head[0])}</th><th scope="col">${esc(head[1])}</th></tr></thead><tbody>${rows
    .map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`)
    .join('')}</tbody></table></details>`;
}

export type Point = { label: string; tip: string; value: number };

export function columns(root: HTMLElement, points: Point[], unit: string, tickEvery = 7) {
  const top = niceMax(Math.max(0, ...points.map((p) => p.value)));
  root.innerHTML = `
    <div class="cols" role="img" aria-label="${esc(`${points.length} 天，每天的${unit}`)}">
      <div class="cols__grid" aria-hidden="true"><span data-v="${top}"></span><span data-v="${top / 2}"></span><span data-v="0"></span></div>
      <div class="cols__plot">${points
        .map(
          (p, i) =>
            `<button type="button" class="cols__col" data-i="${i}" aria-label="${esc(`${p.tip}：${p.value} ${unit}`)}"><span style="height:${(p.value / top) * 100}%"></span></button>`,
        )
        .join('')}</div>
      <div class="cols__x" aria-hidden="true">${points.map((p, i) => `<span>${(points.length - 1 - i) % tickEvery === 0 ? esc(p.label) : ''}</span>`).join('')}</div>
      <div class="viz__tip" hidden></div>
    </div>
    ${table(['日期', unit], points.map((p) => [p.tip, String(p.value)]))}`;
  const tip = root.querySelector<HTMLElement>('.viz__tip')!;
  const plot = root.querySelector<HTMLElement>('.cols')!;
  const show = (btn: HTMLElement) => {
    const p = points[Number(btn.dataset.i)];
    tip.innerHTML = `<strong>${p.value}</strong> ${esc(unit)}<span>${esc(p.tip)}</span>`;
    tip.hidden = false;
    const box = plot.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    const x = Math.min(Math.max(b.left + b.width / 2 - box.left, 60), box.width - 60);
    tip.style.left = `${x}px`;
    root.querySelectorAll('.cols__col').forEach((c) => c.classList.toggle('is-active', c === btn));
  };
  const hide = () => {
    tip.hidden = true;
    root.querySelectorAll('.cols__col').forEach((c) => c.classList.remove('is-active'));
  };
  root.querySelectorAll<HTMLElement>('.cols__col').forEach((btn) => {
    btn.addEventListener('pointerenter', () => show(btn));
    btn.addEventListener('focus', () => show(btn));
    btn.addEventListener('blur', hide);
  });
  plot.addEventListener('pointerleave', hide);
}

export type Bar = { label: string; value: number; note?: string };

export function bars(root: HTMLElement, rows: Bar[], unit: string, empty: string) {
  if (!rows.length) {
    root.innerHTML = `<p class="viz__empty">${esc(empty)}</p>`;
    return;
  }
  const top = Math.max(...rows.map((r) => r.value), 1);
  root.innerHTML = `
    <ol class="bars">${rows
      .map(
        (r) => `<li>
          <span class="bars__label">${esc(r.label)}</span>
          <span class="bars__track"><span class="bars__bar" style="--r:${Math.max(0.006, r.value / top)}"></span><span class="bars__value">${r.value}${r.note ? `<small>${esc(r.note)}</small>` : ''}</span></span>
        </li>`,
      )
      .join('')}</ol>
    ${table(['項目', unit], rows.map((r) => [r.label, `${r.value}${r.note ? `（${r.note}）` : ''}`]))}`;
}
