/**
 * One progress card instead of a log that keeps growing: a bar, what is happening now, and the
 * step-by-step record folded away under "詳細紀錄". On phones it sticks to the bottom of the
 * screen (above the tab bar) while it runs, so the form never has to be scrolled to follow it.
 */
export class Progress {
  private bar: HTMLElement;
  private text: HTMLElement;
  private sub: HTMLElement;
  private actions: HTMLElement;
  private list: HTMLOListElement;
  private details: HTMLDetailsElement;

  constructor(private el: HTMLElement) {
    el.classList.add('prog');
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML =
      '<button type="button" class="prog__close" aria-label="關閉" title="關閉">✕</button><div class="prog__bar"><span></span></div><p class="prog__text"></p><p class="prog__sub"></p><div class="prog__actions"></div><details class="prog__log"><summary>詳細紀錄</summary><ol></ol></details>';
    this.bar = el.querySelector('.prog__bar span')!;
    this.text = el.querySelector('.prog__text')!;
    this.sub = el.querySelector('.prog__sub')!;
    this.actions = el.querySelector('.prog__actions')!;
    this.list = el.querySelector('ol')!;
    this.details = el.querySelector('details')!;
    el.querySelector('.prog__close')!.addEventListener('click', () => this.hide());
    el.hidden = true;
  }

  start(text: string) {
    this.el.hidden = false;
    this.el.dataset.state = 'running';
    this.list.innerHTML = '';
    this.details.open = false;
    this.actions.innerHTML = '';
    this.set(0, text);
    // Phones: bring it into view once; it then sticks to the bottom.
    this.el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  /** `fraction` 0..1, or null while the length is unknown (an animated bar). */
  set(fraction: number | null, text: string, sub = '') {
    this.el.classList.toggle('is-indeterminate', fraction === null);
    if (fraction !== null) this.bar.style.width = `${Math.round(Math.max(0, Math.min(1, fraction)) * 100)}%`;
    this.text.textContent = text;
    this.sub.textContent = sub;
    this.sub.hidden = !sub;
  }

  /** A line in the folded record (HTML). */
  log(html: string, tone = '') {
    const li = document.createElement('li');
    li.className = tone;
    li.innerHTML = html;
    this.list.append(li);
    return li;
  }

  done(text: string, actionsHtml = '', sub = '') {
    this.el.hidden = false;
    this.el.dataset.state = 'done';
    this.set(1, text, sub);
    this.actions.innerHTML = actionsHtml;
  }

  fail(message: string) {
    this.el.hidden = false;
    this.el.dataset.state = 'failed';
    this.el.classList.remove('is-indeterminate');
    this.text.textContent = '沒有完成';
    this.sub.textContent = message;
    this.sub.hidden = false;
    this.details.open = this.list.children.length > 0;
  }

  /** Replace the actions row (links / buttons, HTML). */
  setActions(html: string) {
    this.actions.innerHTML = html;
  }

  hide() {
    this.el.hidden = true;
  }
}

export const duration = (ms: number) => {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s} 秒` : `${Math.floor(s / 60)} 分 ${s % 60} 秒`;
};
