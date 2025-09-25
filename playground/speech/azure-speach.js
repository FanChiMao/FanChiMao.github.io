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
// const $phrases = document.getElementById('phrases');

// const TOKEN_URL = location.origin + "/api/token";  // local
const TOKEN_URL = "https://api.52hzfan.com/api/token"

let unlocked = false;
let recognizer = null;

// ===== UI helpers =====
function setStatus(text, cls){
  $status.textContent = text;
  $status.className = 'pill ' + (cls||'');
}
function showPartial(text){
  if (!text) { $partial.classList.remove('show'); $partial.textContent = ""; return; }
  $partial.textContent = text;
  $partial.classList.add('show');
}
function appendFinal(line){
  const div = document.createElement('div');
  div.className = 'line';
  div.textContent = line;
  $final.appendChild(div);
  $final.scrollTop = $final.scrollHeight;
}
async function getToken(pwd){
  const r = await fetch(TOKEN_URL, { headers:{'X-Access-Key': pwd}});
  if (!r.ok) throw new Error('token failed ' + r.status);
  return r.json();
}

// ===== Auth =====
$btnAuth.addEventListener('click', async () => {
  try {
    await getToken($pass.value);
    unlocked = true;
    $gate.textContent = 'unlocked';
    $gate.className = 'pill ok';
    $btnStart.disabled = false;
    setStatus('ready','ok');
  } catch(e) {
    unlocked = false;
    $gate.textContent = 'locked';
    $gate.className = 'pill';
    $btnStart.disabled = true;
    setStatus('auth failed','err');
    alert('密碼錯誤或已過期');
  }
});

// ===== Start =====
$btnStart.addEventListener('click', async () => {
  if (!unlocked){ alert('請先解鎖'); return; }
  $btnStart.disabled = true; $btnStop.disabled = false; setStatus('connecting','warn');

  try {
    const { token, region } = await getToken($pass.value);

    // Speech Translation 設定
    const cfg = SpeechSDK.SpeechTranslationConfig.fromAuthorizationToken(token, region);
    cfg.speechRecognitionLanguage = $src.value; // 預設 zh-TW

    const targets = [...document.querySelectorAll('.tgt:checked')].map(x=>x.value);
    targets.forEach(t => cfg.addTargetLanguage(t));   // 預設 en, ja

    // 調參：partial 穩定、靜音容忍
    cfg.setProperty(SpeechSDK.PropertyId.SpeechServiceResponse_StablePartialResultThreshold, "3");
    cfg.setProperty(SpeechSDK.PropertyId.Speech_SegmentationSilenceTimeoutMs, "1000");
    cfg.setProperty(SpeechSDK.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "5000");

    // 音源：預設麥克風
    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();

    // recognizer（兩參數）
    recognizer = new SpeechSDK.TranslationRecognizer(cfg, audioConfig);

    // PhraseList（專有名詞提示）
    // const plist = new SpeechSDK.PhraseListGrammar(recognizer);
    // $phrases.value.split(',').map(s=>s.trim()).filter(Boolean).forEach(p => plist.addPhrase(p));

    // 事件
    recognizer.sessionStarted = () => setStatus('listening','ok');
    recognizer.sessionStopped = () => setStatus('stopped','');
    recognizer.canceled = (s, e) => { appendFinal(`[error] ${e.reason} ${e.errorDetails||''}`); stop(); };

    recognizer.recognizing = (s, e) => {
      showPartial(e.result.text);  // partial 當過場動畫
    };
    recognizer.recognized = (s, e) => {
        // 收到一次句子結果就把 partial 清掉
        showPartial('');

        const reason = e.result?.reason;
        const reasonName = SpeechSDK.ResultReason[reason];
        console.log('[recognized]', reason, reasonName, e.result?.text);

        if (reason === RR.TranslatedSpeech) {
            // ✅ 正常：有翻譯
            const tr = e.result.translations;
            const pairs = [...tr.keys()].map(k => `${k}: ${tr.get(k)}`).join(' | ');
            appendFinal(`[原文] ${e.result.text}`);
            if (pairs) appendFinal(`  → ${pairs}`);
            return;
        }

        if (reason === RR.RecognizedSpeech) {
            // 有辨識但（可能因為目標語言空/SDK行為）沒有翻譯，也當作 final 顯示
            appendFinal(`[原文] ${e.result.text}`);
            return;
        }

        if (reason === RR.NoMatch) {
            console.log('[nomatch]', e.result?.noMatchDetails);
            return;
        }

        // 其他情況先記錄
        console.log('[recognized other]', reasonName, e);
    };

    recognizer.startContinuousRecognitionAsync();
  } catch (err) {
    appendFinal(`[fatal] ${err.message || err}`);
    setStatus('error','err');
    $btnStart.disabled = false; $btnStop.disabled = true;
  }
});

// ===== Stop =====
function stop(){
  if (!recognizer) return;
  const r = recognizer; recognizer = null;
  r.stopContinuousRecognitionAsync(
    ()=>{ setStatus('stopped',''); $btnStart.disabled=false; $btnStop.disabled=true; showPartial(''); },
    (e)=>{ appendFinal('[stop error] ' + (e?.errorDetails||'')); setStatus('stopped',''); $btnStart.disabled=false; $btnStop.disabled=true; showPartial(''); }
  );
}
$btnStop.addEventListener('click', stop);
