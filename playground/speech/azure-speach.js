// ===== DOM =====
const $pass   = document.getElementById('pass');
const $btnAuth= document.getElementById('btnAuth');
const $gate   = document.getElementById('gate');
const $btnStart=document.getElementById('btnStart');
const $btnStop = document.getElementById('btnStop');
const $status  = document.getElementById('status');
const $src     = document.getElementById('src');
const $partial = document.getElementById('partial');
const $final   = document.getElementById('final');

const TOKEN_URL = "https://api.52hzfan.com/api/token"

let unlocked = false;
let recognizer = null;
const transcript = [];

// ===== UI helpers =====
document.addEventListener('DOMContentLoaded', () => {
  const view = document.getElementById('viewMode');
  view?.addEventListener('change', renderFinal);
  document.getElementById('partial')?.classList.add('show');
  detectMicrophone();
  document.getElementById('btnProbeMic')?.addEventListener('click', detectMicrophone);
  renderFinal();
});

function setStatus(text, cls){
  $status.textContent = text;
  $status.className = 'pill ' + (cls||'');
}
function showPartial(text){
  if (!text) { $partial.classList.remove('show'); $partial.textContent = ""; return; }
  $partial.textContent = text;
  $partial.classList.add('show');
}
function addUtterance(result) {
  const origText = result.text
  const translations = result.translations.privMap

  if (!origText || origText === "") return 

  transcript.push({
    orig: origText || '',
    en: translations.privValues[0],
    ja: translations.privValues[1],
    ts: Date.now(),
  });

  renderFinal();
}
function renderFinal() {
  const $final = document.getElementById('final');
  if (!$final) return;

  const mode = document.getElementById('viewMode').value;
  const isAtBottom = Math.abs($final.scrollHeight - $final.scrollTop - $final.clientHeight) < 4;

  $final.innerHTML = '';
  for (const item of transcript) {
    const lines = [];
    if (mode === 'all' || mode === 'orig') lines.push({ tag: '原文', text: item.orig });
    if ((mode === 'all' || mode === 'en') && item.en) lines.push({ tag: 'EN', text: item.en });
    if ((mode === 'all' || mode === 'ja') && item.ja) lines.push({ tag: 'JA', text: item.ja });

    for (const { tag, text } of lines) {
      const row = document.createElement('div');
      row.className = 'line';

      const time = document.createElement('span');
      time.className = 'ts';
      time.textContent = formatTime(item.ts);

      const label = document.createElement('span');
      label.className = 'tag';
      label.textContent = `[${tag}]`;

      const content = document.createElement('span');
      content.className = 'msg';
      content.textContent = ' ' + text;

      row.appendChild(time);
      row.appendChild(label);
      row.appendChild(content);
      $final.appendChild(row);
    }
  }

  if (isAtBottom) $final.scrollTop = $final.scrollHeight;
}
function formatTime(ts) {
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function getToken(pwd){
  const r = await fetch(TOKEN_URL, { headers:{'X-Access-Key': pwd}});
  if (!r.ok) throw new Error('token failed ' + r.status);
  return r.json();
}


function formatResetAt(ms) {
  const d = new Date(ms);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function showQuota(q) {
  const $status = document.getElementById('status');
  if ($status) {
    $status.textContent = `${q.used}/${q.limit}（剩 ${q.remaining}） · 重置 ${formatResetAt(q.resetAt)}`;
  }
}

// ===== Auth =====
$btnAuth.addEventListener('click', async () => {
  if ($btnAuth.disabled) return;
  const label = $btnAuth.textContent;
  $btnAuth.dataset.label = label;

  $btnAuth.classList.add('loading');
  $btnAuth.disabled = true;
  $btnAuth.setAttribute('aria-busy', 'true');
  $btnAuth.textContent = '驗證中';

  try {
    // quota
    // try {
    //   const peek = await getToken($pass.value, { peek: true });
    //   if (peek?.quota) showQuota(peek.quota);
    // } catch {}
    // const { token, region, quota } = await getToken($pass.value);
    // if (quota) showQuota(quota);

    await getToken($pass.value);
    unlocked = true;
    $gate.textContent = '已解鎖';
    $gate.className = 'pill ok';
    $btnStart.disabled = false;
    setStatus('準備完成', 'ok');

    // breathing start button
    setTimeout(() => $btnStart.classList.add('cta-pulse'), 150);
  } catch (e) {
    unlocked = false;
    $gate.textContent = '鎖定';
    $gate.className = 'pill';
    $btnStart.disabled = true;
    setStatus('驗證失敗', 'err');
    if (e?.data?.error === 'limit_exceeded') {
      // const q = e.data?.quota;
      // if (q) showQuota(q);
      alert('今日次數已用完，請明天再試。');
    } else {
      alert('密碼錯誤或已過期');
    }
  } finally {
    $btnAuth.classList.remove('loading');
    $btnAuth.disabled = false;
    $btnAuth.removeAttribute('aria-busy');
    $btnAuth.textContent = $btnAuth.dataset.label || '解  鎖';
  }
});

// ===== Start =====
$btnStart.addEventListener('click', async () => {
  if (!unlocked){ alert('請先解鎖'); return; }
  $btnStart.disabled = true; $btnStop.disabled = false; setStatus('連接中','warn');

  try {
    const { token, region } = await getToken($pass.value);

    // Speech Translation 設定
    const cfg = SpeechSDK.SpeechTranslationConfig.fromAuthorizationToken(token, region);
    cfg.speechRecognitionLanguage = "zh-TW"
    
    const targets = ["en", "ja"]
    targets.forEach(t => cfg.addTargetLanguage(t));

    applySpeechTuning(cfg);

    const selectedId = getSelectedMicId();
    let audioConfig;
    if (!selectedId || selectedId === 'default') {
      audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    } else {
      audioConfig = SpeechSDK.AudioConfig.fromMicrophoneInput(selectedId);
    }

    // recognizer
    recognizer = new SpeechSDK.TranslationRecognizer(cfg, audioConfig);

    // PhraseList（專有名詞提示）
    // const plist = new SpeechSDK.PhraseListGrammar(recognizer);
    // $phrases.value.split(',').map(s=>s.trim()).filter(Boolean).forEach(p => plist.addPhrase(p));

    // 事件
    recognizer.sessionStarted = () => setStatus('開始說話','ok');
    recognizer.sessionStopped = () => {
      document.querySelector('.mic')?.classList.remove('live');
      setStatus('停止','');
    }
    recognizer.canceled = (s, e) => { 
      console.error(`[error] ${e.reason} ${e.errorDetails||''}`); 
      document.querySelector('.mic')?.classList.remove('live');
      stop(); 
    };

    recognizer.recognizing = (s, e) => {
      showPartial(e.result.text);  // partial 當過場動畫
    };
    recognizer.recognized = (s, e) => {
      showPartial('');
      const reasonName = SpeechSDK.ResultReason[e.result?.reason];

      if (reasonName === "TranslatedSpeech") {
        addUtterance(e.result);
        return;
      }

      if (reasonName === "RecognizedSpeech") {
        console.error(e.result.text, {});
        return;
      }

      if (reasonName === "NoMatch") {
        console.log('[nomatch]', e.result?.noMatchDetails);
        return;
      }
    };

    recognizer.startContinuousRecognitionAsync();
    document.querySelector('.mic')?.classList.add('live');
  } catch (err) {
    console.error(`[Error] ${err.message || err}`);
    setStatus('發生錯誤','err');
    $btnStart.disabled = false; $btnStop.disabled = true;
  }
});

// ===== Stop =====
function stop(){
  if (!recognizer) return;
  const r = recognizer; recognizer = null;
  r.stopContinuousRecognitionAsync(
    ()=>{ setStatus('停止',''); $btnStart.disabled=false; $btnStop.disabled=true; showPartial(''); },
    (e)=>{ console.error('[stop error] ' + (e?.errorDetails||'')); setStatus('已停止',''); $btnStart.disabled=false; $btnStop.disabled=true; showPartial(''); }
  );
}
$btnStop.addEventListener('click', stop);


const TUNE_KEY = 'speech_tuning_v1';
const defaults = { stable: 3, segSil: 1000, initSil: 5000 };
let tuning = { ...defaults, ...JSON.parse(localStorage.getItem(TUNE_KEY) || '{}') };

// 綁定 UI
(function bindTuningUI(){
  const elStable = document.getElementById('stableThr');
  const elSeg    = document.getElementById('segSil');
  const elInit   = document.getElementById('initSil');

  const vStable  = document.getElementById('val-stable');
  const vSeg     = document.getElementById('val-sil');
  const vInit    = document.getElementById('val-init');

  // 初始化數值
  if (elStable) elStable.value = String(tuning.stable);
  if (elSeg)    elSeg.value    = String(tuning.segSil);
  if (elInit)   elInit.value   = String(tuning.initSil);

  if (vStable) vStable.textContent = String(tuning.stable);
  if (vSeg)    vSeg.textContent    = String(tuning.segSil);
  if (vInit)   vInit.textContent   = String(tuning.initSil);

  // 變更時更新顯示
  elStable?.addEventListener('input', e => (vStable.textContent = (tuning.stable = Number(e.target.value)), vStable.textContent));
  elSeg?.addEventListener('input', e => (vSeg.textContent    = (tuning.segSil = Number(e.target.value)),    vSeg.textContent));
  elInit?.addEventListener('input', e => (vInit.textContent  = (tuning.initSil = Number(e.target.value)),   vInit.textContent));

  // 套用／重設
  document.getElementById('btnApplyCfg')?.addEventListener('click', () => {
    localStorage.setItem(TUNE_KEY, JSON.stringify(tuning));
  });

  document.getElementById('btnResetCfg')?.addEventListener('click', () => {
    tuning = { ...defaults };
    if (elStable) elStable.value = String(tuning.stable);
    if (elSeg)    elSeg.value    = String(tuning.segSil);
    if (elInit)   elInit.value   = String(tuning.initSil);
    if (vStable) vStable.textContent = String(tuning.stable);
    if (vSeg)    vSeg.textContent    = String(tuning.segSil);
    if (vInit)   vInit.textContent   = String(tuning.initSil);
    localStorage.setItem(TUNE_KEY, JSON.stringify(tuning));
  });
})();

// ---------- 建立 SpeechConfig 時套用調校 ----------
function applySpeechTuning(cfg){
  cfg.setProperty(SpeechSDK.PropertyId.SpeechServiceConnection_LanguageIdMode, "Continuous");
  // 1) 連續 partial 的穩定門檻（1~5；越大越「穩」才推送）
  cfg.setProperty(SpeechSDK.PropertyId.SpeechServiceResponse_StablePartialResultThreshold, String(tuning.stable));
  // 2) 語音片段切段的靜音時間（ms；越小切得越頻繁）
  cfg.setProperty(SpeechSDK.PropertyId.Speech_SegmentationSilenceTimeoutMs, String(tuning.segSil));
  // 3) 開頭可容忍的靜音（ms；越小越快判定無聲啟動/超時）
  cfg.setProperty(SpeechSDK.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, String(tuning.initSil));
}

// ===== 麥克風偵測 =====
async function detectMicrophone() {
  const $status = document.getElementById('micStatus');

  // 安全預設
  setMicPill('warn', '檢測中…');

  // 1) 先試 Permission API（不是所有瀏覽器都支援）
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const res = await navigator.permissions.query({ name: 'microphone' });
      if (res.state === 'denied') {
        setMicPill('err', '已封鎖');
        return;
      }
      // 'granted' 或 'prompt' 都繼續做 getUserMedia 確認可用設備
    }
  } catch { /* ignore */ }

  // 2) 真的要拿到裝置（拿完就停掉）
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stopStream(stream);

    // 3) 列出 audioinput 裝置數（若需要可填入你的下拉）
    const devs = await navigator.mediaDevices.enumerateDevices();
    const mics = devs.filter(d => d.kind === 'audioinput');

    if (mics.length === 0) {
      setMicPill('err', '未找到裝置');
    } else {
      setMicPill('ok', `已就緒（${mics.length}）`);
    }
  } catch (e) {
    // 使用者拒絕或硬體/權限問題
    setMicPill('err', '無權限或裝置不可用');
  }

  function stopStream(s) { s.getTracks().forEach(t => t.stop()); }
  function setMicPill(kind, text){
    const cls = { ok:'ok', warn:'warn', err:'err' }[kind] || 'warn';
    $status.classList.remove('ok','warn','err');
    $status.classList.add(cls);
    $status.textContent = text;
  }
}

const MIC_KEY = 'speech_mic_device_id';

/** 偵測麥克風（授權 + 列出裝置 + 填入下拉） */
async function detectMicrophoneAndPopulate() {
  setMicPill('warn', '檢測中…');

  try {
    // 先要一次權限，這樣 enumerateDevices 才會有裝置名稱
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stopStream(stream);

    const devices = await navigator.mediaDevices.enumerateDevices();
    const mics = devices.filter(d => d.kind === 'audioinput');

    if (mics.length === 0) {
      setMicPill('err', '未找到裝置');
      fillMicDropdown([]); // 清空
      return;
    }

    setMicPill('ok', `已就緒（${mics.length}）`);
    fillMicDropdown(mics);
  } catch (err) {
    setMicPill('err', '無權限或裝置不可用');
    fillMicDropdown([]); // 清空
  }
}

function stopStream(s) { try { s.getTracks().forEach(t => t.stop()); } catch(_){} }

function setMicPill(kind, text){
  const el = document.getElementById('micStatus');
  if (!el) return;
  el.classList.remove('ok','warn','err');
  el.classList.add(kind === 'ok' ? 'ok' : kind === 'err' ? 'err' : 'warn');
  el.textContent = text;
}

/** 將麥克風清單填入下拉，並套用/記住選擇 */
function fillMicDropdown(mics){
  const sel = document.getElementById('micSelect');
  if (!sel) return;

  sel.innerHTML = '';
  // 永遠提供「預設裝置」
  const optDefault = new Option('（系統預設）', 'default');
  sel.add(optDefault);

  mics.forEach(d => {
    const label = d.label || 'Microphone';
    sel.add(new Option(label, d.deviceId));
  });

  // 還原之前的選擇（若已不存在就回到 default）
  const saved = localStorage.getItem(MIC_KEY) || 'default';
  const exists = [...sel.options].some(o => o.value === saved);
  sel.value = exists ? saved : 'default';

  sel.onchange = () => {
    localStorage.setItem(MIC_KEY, sel.value);
  };
}

// 首次載入 & 重新偵測 & 裝置變動時更新
document.addEventListener('DOMContentLoaded', () => {
  detectMicrophoneAndPopulate();
  document.getElementById('btnProbeMic')?.addEventListener('click', detectMicrophoneAndPopulate);
  if (navigator.mediaDevices?.addEventListener) {
    navigator.mediaDevices.addEventListener('devicechange', detectMicrophoneAndPopulate);
  }
});

/** 取得目前選定裝置的 deviceId（或 'default'） */
function getSelectedMicId(){
  return (document.getElementById('micSelect')?.value) || localStorage.getItem(MIC_KEY) || 'default';
}


(function bindUtilities(){
  const finalBox = document.getElementById('final');
  document.getElementById('btnClear')?.addEventListener('click', () => {
    finalBox.textContent = '';
  });
  document.getElementById('btnExport')?.addEventListener('click', () => {
    const text = finalBox.innerText || '';
    const blob = new Blob([text], {type:'text/plain;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `transcript_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
})();

/* ===== Toast API ===== */
function toast(message, type = 'ok', {timeout = 2200} = {}){
  const container = document.getElementById('toasts') || (() => {
    const c = document.createElement('div'); c.id = 'toasts'; c.className = 'toasts';
    document.body.appendChild(c); return c;
  })();

  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="ico">${type==='ok'?'✓':type==='warn'?'!':'✕'}</span><span class="msg">${message}</span>`;
  container.appendChild(el);

  const t = setTimeout(() => close(), timeout);
  function close(){
    el.style.animation = 'toast-out .18s ease-in forwards';
    setTimeout(() => el.remove(), 180);
    clearTimeout(t);
  }
  // 點一下也能關閉
  el.addEventListener('click', close);
}

/* ===== 把你現有按鈕/流程接上通知 ===== */
// 1) 套用 / 重設（你原本就有的監聽裡面補一行）
document.getElementById('btnApplyCfg')?.addEventListener('click', () => {
  // ...你原本的 localStorage set
  toast('設定已儲存，將在下次「開始」時生效', 'ok');
});
document.getElementById('btnResetCfg')?.addEventListener('click', () => {
  // ...你原本的重設程式
  toast('設定已重設為預設值', 'warn');
});

// 2) 清除 / 匯出
document.getElementById('btnClear')?.addEventListener('click', () => {
  // ...清空 #final
  toast('字幕已清除', 'ok', {timeout: 1600});
});
document.getElementById('btnExport')?.addEventListener('click', () => {
  // ...匯出成功後
  toast('已匯出 .txt', 'ok');
});

// 3) 麥克風偵測結果（在 detectMicrophoneAndPopulate 的分支補）
function setMicPill(kind, text){
  const el = document.getElementById('micStatus');
  if (!el) return;
  el.classList.remove('ok','warn','err');
  el.classList.add(kind === 'ok' ? 'ok' : kind === 'err' ? 'err' : 'warn');
  el.textContent = text;

  // 通知（避免太吵：只有成功或錯誤時提示）
  if (kind === 'ok')   toast(`麥克風已就緒：${text}`, 'ok', {timeout: 1800});
  if (kind === 'err')  toast(`麥克風錯誤：${text}`, 'err', {timeout: 2200});
}

// 4) 開始 / 停止（可選）
function onStarted(){ /* ... */ toast('開始辨識', 'ok', {timeout: 1400}); }
function onStopped(){ /* ... */ toast('已停止', 'warn', {timeout: 1400}); }
