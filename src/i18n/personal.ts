import type { Locale } from './ui';

/**
 * UI text for the Personal World (/personal/). Kept apart from ui.ts so the
 * Professional bundle of strings stays as it is. Every locale must match the
 * shape of `en` (enforced by the PersonalUI type).
 *
 * Only facts go here. Personal stories, places and captions belong in content
 * collections, written by Chi-Mao, never invented.
 */
const en = {
  meta: {
    title: '52Hz Fan · Beyond the Code',
    description: 'The personal side of Chi-Mao (Jonathan) Fan: photography, travel, Ajie the orange tabby, and a few things worth finding.',
  },
  nav: {
    home: 'Home',
    gallery: 'Gallery',
    journey: 'Journey',
    companion: 'Companion',
    achievements: 'Achievements',
    back: 'Professional',
    backLabel: 'Back to the professional site',
    brandLabel: '52Hz Fan, personal world home',
  },
  /** "Go Deeper?" section on the professional home page. */
  deeper: {
    kicker: "You've seen what I do",
    title: 'Want to know me better?',
    lead: "Beyond the algorithms, there's a whole other world",
    cta: 'Go Deeper?',
    diving: 'Diving to the personal world…',
    skip: 'Skip',
  },
  hero: {
    eyebrow: 'Personal world',
    title: '52Hz Fan',
    subtitle: 'Beyond the Code',
    tagline: "Beyond the algorithms, there's a whole other world.",
    explore: 'Pick a star to explore',
    scroll: 'Dive',
  },
  chapters: {
    gallery: { name: 'The Gallery', kind: 'Photography', blurb: 'Night skies, city lights and small everyday moments, seen through a lens.' },
    journey: { name: 'The Journey', kind: 'Adventures', blurb: 'First times and journeys worth remembering.' },
    companion: { name: 'Ajie', kind: 'Orange tabby', blurb: 'Ajie, the orange tabby who runs the house.' },
    secrets: { name: 'Achievements', kind: '52Hz Logbook', blurb: 'Badges you earn by exploring this site.' },
  },
  chaptersHeading: 'Four ways in',
  whale: {
    kicker: 'Why 52Hz',
    title: 'A song on its own frequency',
    body: [
      'In 1989, U.S. Navy hydrophones in the North Pacific began picking up a whale call at around 52 hertz, well above the low calls of the blue and fin whales it most resembles.',
      'The same voice has been heard season after season since, never matched to any other whale. People started calling it the loneliest whale in the world.',
    ],
    axis: 'Call frequency (Hz)',
    blue: 'Blue whale',
    fin: 'Fin whale',
    lone: '52Hz whale',
  },
  frequencies: {
    kicker: 'Off the clock',
    title: 'Other frequencies',
  },
  gallery: {
    filter: 'Filter albums',
    all: 'All',
    categories: { astro: 'Astrophotography', drone: 'Drone', landscape: 'Landscapes', city: 'City & Night', everyday: 'Everyday Moments' },
  },
  stub: {
    soon: 'This chapter is still being written.',
    back: 'Back to the surface',
  },
  /** Shared by the Ajie and Journey posts. */
  posts: {
    play: 'Play video',
    prev: 'Previous post',
    next: 'Next post',
    sound: 'Sound on or off',
    close: 'Close',
    photos: (n: number) => `${n} photo${n === 1 ? '' : 's'}`,
    video: 'Video',
    empty: 'The first post is on its way.',
  },
  ajie: {
    adopted: 'Adopted',
    born: 'Born',
    posts: 'Posts',
    open: 'Open post',
  },
  journey: {
    first: 'First time',
    empty: 'The first milestone is on its way.',
    categories: { run: 'Running', dive: 'Diving', jump: 'Jumping', hike: 'Hiking', ride: 'Riding', travel: 'Travel', other: 'Milestone' },
  },
  passport: {
    kicker: '52Hz Logbook',
    lead: 'Badges you earn by exploring this site. They are kept in this browser only.',
    progress: (n: number | string, total: number) => `${n} of ${total} badges`,
    locked: '???',
    unlockedOn: 'Earned',
    toast: 'New achievement',
    /** Toast line; {name} is replaced with the badge name. */
    earned: 'Earned the “{name}” badge',
    view: 'Open logbook',
    reset: 'Reset logbook',
    resetConfirm: 'Tap again to erase every badge',
    unavailable: 'This browser blocks local storage, so badges cannot be saved here. Everything else works as usual.',
    detail: { collected: 'Earned', locked: 'Not yet', how: 'How to get it', progress: 'Progress', close: 'Close' },
    items: {
      'deep-diver': { name: 'Deep Diver', desc: 'Took the plunge from the professional site into this one.', hint: 'Some doors on the surface lead down.' },
      'whale-watcher': { name: 'Whale Watcher', desc: 'Saw the humpback breach.', hint: 'Keep an eye on the sea.' },
      stargazer: { name: 'Stargazer', desc: 'Caught a shooting star before it faded.', hint: 'On a clear night, look up and be quick.' },
      explorer: { name: 'Explorer', desc: 'Opened every chapter of this world.', hint: 'There are four ways in.' },
      polyglot: { name: 'Polyglot', desc: 'Read the site in all four of its languages.', hint: 'This site speaks more than one language.' },
      'tide-turner': { name: 'Tide Turner', desc: 'Watched both the sunrise and the moonlit night over the sea.', hint: 'Night and day each have their view.' },
      researcher: { name: 'Researcher', desc: 'Read three paper abstracts on the professional site.', hint: 'The surface has its own reading list.' },
      'lonely-whale': { name: 'The 52Hz Whale', desc: 'Earned every other badge. You are on the same frequency.', hint: 'Earn every other badge.' },
    },
  },
};

export type PersonalUI = typeof en;

const zhTw: PersonalUI = {
  meta: {
    title: '52Hz Fan · 程式碼之外',
    description: '范植貿（Jonathan）工作之外的另一面：攝影、旅行、橘貓阿桔，以及一些值得探索的小地方。',
  },
  nav: {
    home: '首頁',
    gallery: '相簿',
    journey: '旅程',
    companion: '阿桔',
    achievements: '成就',
    back: '專業',
    backLabel: '返回專業網站',
    brandLabel: '52Hz Fan，個人世界首頁',
  },
  deeper: {
    kicker: '你已經看過我在做什麼',
    title: '想更了解我',
    lead: '在演算法之外，還有另一個世界',
    cta: '再深入一點？',
    diving: '正在潛入個人世界…',
    skip: '略過',
  },
  hero: {
    eyebrow: '個人世界',
    title: '52Hz Fan',
    subtitle: '程式碼之外',
    tagline: '在演算法之外，還有另一個世界。',
    explore: '選一顆星星開始探索',
    scroll: '下潛',
  },
  chapters: {
    gallery: { name: '相簿', kind: '攝影', blurb: '星空、城市燈火與日常裡的小片刻，透過鏡頭留下來。' },
    journey: { name: '旅程', kind: '冒險', blurb: '人生中的第一次，和印象深刻的旅途。' },
    companion: { name: '阿桔', kind: '橘貓', blurb: '阿桔，家裡真正的主人，一隻橘色虎斑貓。' },
    secrets: { name: '成就', kind: '52Hz 航海日誌', blurb: '在網站裡四處探索，就能獲得成就徽章。' },
  },
  chaptersHeading: '四個入口',
  whale: {
    kicker: '為什麼是 52Hz',
    title: '一首只在自己頻率上的歌',
    body: [
      '1989 年，美國海軍在北太平洋的水下聽音器開始收到一段約 52 赫茲的鯨魚叫聲，遠高於與牠最相近的藍鯨和長須鯨的低頻叫聲。',
      '此後每一季都還能聽到同一個聲音，卻從未對應到任何其他鯨魚。人們開始稱牠為「世界上最孤獨的鯨魚」。',
    ],
    axis: '叫聲頻率（Hz）',
    blue: '藍鯨',
    fin: '長須鯨',
    lone: '52Hz 鯨魚',
  },
  frequencies: {
    kicker: '下班之後',
    title: '其他的頻率',
  },
  gallery: {
    filter: '篩選相簿',
    all: '全部',
    categories: { astro: '星空攝影', drone: '空拍', landscape: '風景', city: '城市與夜景', everyday: '日常片刻' },
  },
  stub: {
    soon: '這一章還在撰寫中。',
    back: '回到水面',
  },
  posts: {
    play: '播放影片',
    prev: '上一則',
    next: '下一則',
    sound: '開啟或關閉聲音',
    close: '關閉',
    photos: (n: number) => `${n} 張照片`,
    video: '影片',
    empty: '第一則貼文準備中。',
  },
  ajie: {
    adopted: '領養日',
    born: '生日',
    posts: '貼文',
    open: '打開貼文',
  },
  journey: {
    first: '第一次',
    empty: '第一個里程碑準備中。',
    categories: { run: '跑步', dive: '潛水', jump: '極限挑戰', hike: '登山健行', ride: '騎行', travel: '旅行', other: '里程碑' },
  },
  passport: {
    kicker: '52Hz 航海日誌',
    lead: '在網站裡四處探索，就能獲得成就徽章。紀錄只會存在這個瀏覽器裡。',
    progress: (n: number | string, total: number) => `已獲得 ${n} / ${total} 個成就徽章`,
    locked: '???',
    unlockedOn: '獲得於',
    toast: '獲得新成就',
    /** Toast line; {name} is replaced with the badge name. */
    earned: '獲得「{name}」成就徽章',
    view: '打開航海日誌',
    reset: '重設航海日誌',
    resetConfirm: '再按一次就會清除所有成就徽章',
    unavailable: '這個瀏覽器封鎖了本機儲存，無法保存成就徽章；網站其他功能不受影響。',
    detail: { collected: '已獲得', locked: '尚未取得', how: '取得方式', progress: '進度', close: '關閉' },
    items: {
      'deep-diver': { name: '深潛者', desc: '從工作那一面的網站，一路潛進了這裡。', hint: '水面上有些門，是通往深處的。' },
      'whale-watcher': { name: '賞鯨人', desc: '看到了座頭鯨躍出海面。', hint: '留意一下海面。' },
      stargazer: { name: '觀星者', desc: '在流星消失前抓住了它。', hint: '晴朗的夜裡抬頭看，手要快。' },
      explorer: { name: '探險家', desc: '走遍了這個世界的每個章節。', hint: '進來的路有四條。' },
      polyglot: { name: '多語者', desc: '用四種語言都讀過這個網站。', hint: '這個網站不只說一種語言。' },
      'tide-turner': { name: '晝夜交替', desc: '看過海上的日出，也看過月夜。', hint: '白天和夜晚，各有各的風景。' },
      researcher: { name: '研究者', desc: '在工作頁面讀了三篇論文摘要。', hint: '水面上也有一份閱讀清單。' },
      'lonely-whale': { name: '52Hz 的鯨魚', desc: '獲得了其他所有成就徽章。你和我在同一個頻率上。', hint: '獲得其他所有成就徽章。' },
    },
  },
};

const zhCn: PersonalUI = {
  meta: {
    title: '52Hz Fan · 代码之外',
    description: '范植贸（Jonathan）工作之外的另一面：摄影、旅行、橘猫阿桔，以及一些值得探索的小地方。',
  },
  nav: {
    home: '首页',
    gallery: '相册',
    journey: '旅程',
    companion: '阿桔',
    achievements: '成就',
    back: '专业',
    backLabel: '返回专业网站',
    brandLabel: '52Hz Fan，个人世界首页',
  },
  deeper: {
    kicker: '你已经看过我在做什么',
    title: '想更了解我',
    lead: '在算法之外，还有另一个世界',
    cta: '再深入一点？',
    diving: '正在潜入个人世界…',
    skip: '跳过',
  },
  hero: {
    eyebrow: '个人世界',
    title: '52Hz Fan',
    subtitle: '代码之外',
    tagline: '在算法之外，还有另一个世界。',
    explore: '选一颗星星开始探索',
    scroll: '下潜',
  },
  chapters: {
    gallery: { name: '相册', kind: '摄影', blurb: '星空、城市灯火与日常里的小片刻，通过镜头留下来。' },
    journey: { name: '旅程', kind: '冒险', blurb: '人生中的第一次，和印象深刻的旅途。' },
    companion: { name: '阿桔', kind: '橘猫', blurb: '阿桔，家里真正的主人，一只橘色虎斑猫。' },
    secrets: { name: '成就', kind: '52Hz 航海日志', blurb: '在网站里四处探索，就能获得成就徽章。' },
  },
  chaptersHeading: '四个入口',
  whale: {
    kicker: '为什么是 52Hz',
    title: '一首只在自己频率上的歌',
    body: [
      '1989 年，美国海军在北太平洋的水下听音器开始收到一段约 52 赫兹的鲸鱼叫声，远高于与它最相近的蓝鲸和长须鲸的低频叫声。',
      '此后每一季都还能听到同一个声音，却从未对应到任何其他鲸鱼。人们开始称它为“世界上最孤独的鲸鱼”。',
    ],
    axis: '叫声频率（Hz）',
    blue: '蓝鲸',
    fin: '长须鲸',
    lone: '52Hz 鲸鱼',
  },
  frequencies: {
    kicker: '下班之后',
    title: '其他的频率',
  },
  gallery: {
    filter: '筛选相册',
    all: '全部',
    categories: { astro: '星空摄影', drone: '航拍', landscape: '风景', city: '城市与夜景', everyday: '日常片刻' },
  },
  stub: {
    soon: '这一章还在撰写中。',
    back: '回到水面',
  },
  posts: {
    play: '播放视频',
    prev: '上一则',
    next: '下一则',
    sound: '开启或关闭声音',
    close: '关闭',
    photos: (n: number) => `${n} 张照片`,
    video: '视频',
    empty: '第一则帖子准备中。',
  },
  ajie: {
    adopted: '领养日',
    born: '生日',
    posts: '帖子',
    open: '打开帖子',
  },
  journey: {
    first: '第一次',
    empty: '第一个里程碑准备中。',
    categories: { run: '跑步', dive: '潜水', jump: '极限挑战', hike: '登山徒步', ride: '骑行', travel: '旅行', other: '里程碑' },
  },
  passport: {
    kicker: '52Hz 航海日志',
    lead: '在网站里四处探索，就能获得成就徽章。记录只会保存在这个浏览器里。',
    progress: (n: number | string, total: number) => `已获得 ${n} / ${total} 个成就徽章`,
    locked: '???',
    unlockedOn: '获得于',
    toast: '获得新成就',
    /** Toast line; {name} is replaced with the badge name. */
    earned: '获得「{name}」成就徽章',
    view: '打开航海日志',
    reset: '重置航海日志',
    resetConfirm: '再按一次就会清除所有成就徽章',
    unavailable: '这个浏览器屏蔽了本地存储，无法保存成就徽章；网站其他功能不受影响。',
    detail: { collected: '已获得', locked: '尚未获得', how: '获得方式', progress: '进度', close: '关闭' },
    items: {
      'deep-diver': { name: '深潜者', desc: '从工作那一面的网站，一路潜进了这里。', hint: '水面上有些门，是通往深处的。' },
      'whale-watcher': { name: '观鲸人', desc: '看到了座头鲸跃出海面。', hint: '留意一下海面。' },
      stargazer: { name: '观星者', desc: '在流星消失前抓住了它。', hint: '晴朗的夜里抬头看，手要快。' },
      explorer: { name: '探险家', desc: '走遍了这个世界的每个章节。', hint: '进来的路有四条。' },
      polyglot: { name: '多语者', desc: '用四种语言都读过这个网站。', hint: '这个网站不只说一种语言。' },
      'tide-turner': { name: '昼夜交替', desc: '看过海上的日出，也看过月夜。', hint: '白天和夜晚，各有各的风景。' },
      researcher: { name: '研究者', desc: '在工作页面读了三篇论文摘要。', hint: '水面上也有一份阅读清单。' },
      'lonely-whale': { name: '52Hz 的鲸鱼', desc: '获得了其他所有成就徽章。你和我在同一个频率上。', hint: '获得其他所有成就徽章。' },
    },
  },
};

const ja: PersonalUI = {
  meta: {
    title: '52Hz Fan · コードの向こう側',
    description: '范植貿（Jonathan）の仕事以外の一面。写真、旅、茶トラ猫のアジエ、そして探すと見つかるいくつかのもの。',
  },
  nav: {
    home: 'ホーム',
    gallery: 'ギャラリー',
    journey: '旅',
    companion: 'アジエ',
    achievements: '実績',
    back: 'プロフィール',
    backLabel: 'プロフェッショナルサイトに戻る',
    brandLabel: '52Hz Fan、パーソナルワールドのホーム',
  },
  deeper: {
    kicker: '私の仕事はもうご覧いただきました',
    title: 'もっと私を知りたい？',
    lead: 'アルゴリズムの向こうに、もうひとつの世界があります',
    cta: 'もっと深く？',
    diving: 'パーソナルワールドへ潜っています…',
    skip: 'スキップ',
  },
  hero: {
    eyebrow: 'パーソナルワールド',
    title: '52Hz Fan',
    subtitle: 'コードの向こう側',
    tagline: 'アルゴリズムの向こうに、もうひとつの世界があります。',
    explore: '星をひとつ選んで探検しよう',
    scroll: '潜る',
  },
  chapters: {
    gallery: { name: 'ギャラリー', kind: '写真', blurb: '星空、街の灯り、日常のささやかな瞬間をレンズ越しに。' },
    journey: { name: '旅', kind: '冒険', blurb: '人生ではじめての挑戦と、心に残る旅。' },
    companion: { name: 'アジエ', kind: '茶トラ猫', blurb: '家の本当の主、茶トラ猫のアジエ。' },
    secrets: { name: '実績', kind: '52Hz 航海日誌', blurb: 'サイトを探検して実績バッジを集めよう。' },
  },
  chaptersHeading: '4つの入口',
  whale: {
    kicker: 'なぜ 52Hz なのか',
    title: '自分だけの周波数で歌う声',
    body: [
      '1989年、北太平洋にある米海軍の水中聴音器が、約52ヘルツのクジラの鳴き声を捉え始めました。最も近いシロナガスクジラやナガスクジラの低い声よりもずっと高い音です。',
      'その声は毎シーズン聞こえ続けていますが、ほかのどのクジラとも一致したことはありません。いつしか「世界一孤独なクジラ」と呼ばれるようになりました。',
    ],
    axis: '鳴き声の周波数（Hz）',
    blue: 'シロナガスクジラ',
    fin: 'ナガスクジラ',
    lone: '52Hz のクジラ',
  },
  frequencies: {
    kicker: 'オフの時間',
    title: 'ほかの周波数',
  },
  gallery: {
    filter: 'アルバムを絞り込む',
    all: 'すべて',
    categories: { astro: '星景写真', drone: 'ドローン', landscape: '風景', city: '街と夜景', everyday: '日常のひとこま' },
  },
  stub: {
    soon: 'この章はまだ執筆中です。',
    back: '水面に戻る',
  },
  posts: {
    play: '動画を再生',
    prev: '前の投稿',
    next: '次の投稿',
    sound: '音声のオン／オフ',
    close: '閉じる',
    photos: (n: number) => `写真 ${n} 枚`,
    video: '動画',
    empty: '最初の投稿を準備中です。',
  },
  ajie: {
    adopted: 'お迎えした日',
    born: '誕生日',
    posts: '投稿',
    open: '投稿を開く',
  },
  journey: {
    first: 'はじめて',
    empty: '最初のマイルストーンを準備中です。',
    categories: { run: 'ランニング', dive: 'ダイビング', jump: 'チャレンジ', hike: '登山・ハイキング', ride: 'ライド', travel: '旅', other: 'マイルストーン' },
  },
  passport: {
    kicker: '52Hz 航海日誌',
    lead: 'サイトを探検すると実績バッジがもらえます。記録はこのブラウザにだけ保存されます。',
    progress: (n: number | string, total: number) => `${total} 個中 ${n} 個の実績バッジ`,
    locked: '???',
    unlockedOn: '獲得日',
    toast: '新しい実績',
    /** Toast line; {name} is replaced with the badge name. */
    earned: '「{name}」バッジを獲得',
    view: '航海日誌を開く',
    reset: '航海日誌をリセット',
    resetConfirm: 'もう一度押すとすべてのバッジが消えます',
    unavailable: 'このブラウザではローカルストレージが使えないため、バッジを保存できません。ほかの機能はそのまま使えます。',
    detail: { collected: '獲得済み', locked: '未獲得', how: '入手方法', progress: '進み具合', close: '閉じる' },
    items: {
      'deep-diver': { name: 'ディープダイバー', desc: '仕事側のサイトから、ここまで潜ってきた。', hint: '水面には、深みへ続く扉がある。' },
      'whale-watcher': { name: 'ホエールウォッチャー', desc: 'ザトウクジラのジャンプを見た。', hint: '海から目を離さないで。' },
      stargazer: { name: 'スターゲイザー', desc: '流れ星が消える前につかまえた。', hint: '晴れた夜は空を見上げて、すばやく。' },
      explorer: { name: 'エクスプローラー', desc: 'この世界のすべての章を開いた。', hint: '入り口は四つある。' },
      polyglot: { name: 'ポリグロット', desc: '4つの言語すべてでサイトを読んだ。', hint: 'このサイトは一つの言語だけではない。' },
      'tide-turner': { name: '昼と夜', desc: '海の日の出も、月夜も見た。', hint: '昼にも夜にも、それぞれの景色がある。' },
      researcher: { name: 'リサーチャー', desc: '仕事側のページで論文の概要を3本読んだ。', hint: '水面にも読書リストがある。' },
      'lonely-whale': { name: '52Hz のクジラ', desc: 'ほかのバッジをすべて獲得した。同じ周波数だね。', hint: 'ほかのバッジをすべて獲得する。' },
    },
  },
};

export const personalUi: Record<Locale, PersonalUI> = { en, 'zh-tw': zhTw, 'zh-cn': zhCn, ja };

/** Chapters of the personal world, in display order. `path` is locale-agnostic. */
export const chapters = [
  { id: 'gallery', path: '/personal/gallery/', nav: 'gallery' },
  { id: 'journey', path: '/personal/journey/', nav: 'journey' },
  { id: 'companion', path: '/personal/companion/', nav: 'companion' },
  { id: 'secrets', path: '/personal/achievements/', nav: 'achievements' },
] as const;
export type ChapterId = (typeof chapters)[number]['id'];
