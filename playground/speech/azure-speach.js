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

async function getToken(pass, { peek = false } = {}) {
  const url = '/api/token' + (peek ? '?peek=1' : '');
  const res = await fetch(url, { headers: { 'X-Access-Key': pass || '' } });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data?.error || 'token_failed'), { data, status: res.status });
  return data; // peek: { quota }, 正常: { token, region, quota }
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

    // 調參：partial 穩定、靜音容忍
    cfg.setProperty(SpeechSDK.PropertyId.SpeechServiceConnection_LanguageIdMode, "Continuous");
    cfg.setProperty(SpeechSDK.PropertyId.SpeechServiceResponse_StablePartialResultThreshold, "2");
    // cfg.setProperty(SpeechSDK.PropertyId.Speech_SegmentationSilenceTimeoutMs, "1000");
    // cfg.setProperty(SpeechSDK.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "5000");

    // 音源：預設麥克風
    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();

    // recognizer
    recognizer = new SpeechSDK.TranslationRecognizer(cfg, audioConfig);

    // PhraseList（專有名詞提示）
    // const plist = new SpeechSDK.PhraseListGrammar(recognizer);
    // $phrases.value.split(',').map(s=>s.trim()).filter(Boolean).forEach(p => plist.addPhrase(p));

    // 事件
    recognizer.sessionStarted = () => setStatus('開始說話','ok');
    recognizer.sessionStopped = () => setStatus('停止','');
    recognizer.canceled = (s, e) => { console.error(`[error] ${e.reason} ${e.errorDetails||''}`); stop(); };

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
