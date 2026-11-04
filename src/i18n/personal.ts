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
    title: '52Hz · Beyond the Code',
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
    brandLabel: '52Hz, personal world home',
  },
  /** "Go Deeper?" section on the professional home page. */
  deeper: {
    kicker: "You've seen what I do.",
    title: "But there's more to who I am.",
    lead: "Beyond the algorithms, there's a whole other world.",
    cta: 'Go Deeper?',
    signal: 'signal',
    song: 'song',
    diving: 'Diving to the personal world…',
    skip: 'Skip',
  },
  hero: {
    eyebrow: 'Personal world',
    title: '52Hz',
    subtitle: 'Beyond the Code',
    tagline: "Beyond the algorithms, there's a whole other world.",
    explore: 'Pick a star to explore',
    scroll: 'Dive',
  },
  chapters: {
    gallery: { name: 'The Gallery', kind: 'Photography', blurb: 'Night skies, city lights and small everyday moments, seen through a lens.' },
    journey: { name: 'The Journey', kind: 'Adventures', blurb: 'Places visited and trails walked, pinned on a globe.' },
    companion: { name: 'The Companion', kind: 'Ajie', blurb: 'Ajie, the orange tabby who runs the house.' },
    secrets: { name: 'The Secrets', kind: 'Explorer Passport', blurb: 'Some things on this site only show up if you go looking.' },
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
  stub: {
    soon: 'This chapter is still being written.',
    back: 'Back to the surface',
  },
};

export type PersonalUI = typeof en;

const zhTw: PersonalUI = {
  meta: {
    title: '52Hz · 程式碼之外',
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
    brandLabel: '52Hz，個人世界首頁',
  },
  deeper: {
    kicker: '你已經看過我在做什麼。',
    title: '但我不只是這樣。',
    lead: '在演算法之外，還有另一個世界。',
    cta: '再深入一點？',
    signal: '訊號',
    song: '歌聲',
    diving: '正在潛入個人世界…',
    skip: '略過',
  },
  hero: {
    eyebrow: '個人世界',
    title: '52Hz',
    subtitle: '程式碼之外',
    tagline: '在演算法之外，還有另一個世界。',
    explore: '選一顆星星開始探索',
    scroll: '下潛',
  },
  chapters: {
    gallery: { name: '相簿', kind: '攝影', blurb: '星空、城市燈火與日常裡的小片刻，透過鏡頭留下來。' },
    journey: { name: '旅程', kind: '冒險', blurb: '去過的地方、走過的路，標記在一顆地球上。' },
    companion: { name: '夥伴', kind: '阿桔', blurb: '阿桔，家裡真正的主人，一隻橘色虎斑貓。' },
    secrets: { name: '秘密', kind: '探索護照', blurb: '這個網站有些東西，只有主動去找才會出現。' },
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
  stub: {
    soon: '這一章還在撰寫中。',
    back: '回到水面',
  },
};

const zhCn: PersonalUI = {
  meta: {
    title: '52Hz · 代码之外',
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
    brandLabel: '52Hz，个人世界首页',
  },
  deeper: {
    kicker: '你已经看过我在做什么。',
    title: '但我不只是这样。',
    lead: '在算法之外，还有另一个世界。',
    cta: '再深入一点？',
    signal: '信号',
    song: '歌声',
    diving: '正在潜入个人世界…',
    skip: '跳过',
  },
  hero: {
    eyebrow: '个人世界',
    title: '52Hz',
    subtitle: '代码之外',
    tagline: '在算法之外，还有另一个世界。',
    explore: '选一颗星星开始探索',
    scroll: '下潜',
  },
  chapters: {
    gallery: { name: '相册', kind: '摄影', blurb: '星空、城市灯火与日常里的小片刻，通过镜头留下来。' },
    journey: { name: '旅程', kind: '冒险', blurb: '去过的地方、走过的路，标记在一颗地球上。' },
    companion: { name: '伙伴', kind: '阿桔', blurb: '阿桔，家里真正的主人，一只橘色虎斑猫。' },
    secrets: { name: '秘密', kind: '探索护照', blurb: '这个网站有些东西，只有主动去找才会出现。' },
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
  stub: {
    soon: '这一章还在撰写中。',
    back: '回到水面',
  },
};

const ja: PersonalUI = {
  meta: {
    title: '52Hz · コードの向こう側',
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
    brandLabel: '52Hz、パーソナルワールドのホーム',
  },
  deeper: {
    kicker: '私の仕事はもうご覧いただきました。',
    title: 'でも、それだけが私ではありません。',
    lead: 'アルゴリズムの向こうに、もうひとつの世界があります。',
    cta: 'もっと深く？',
    signal: 'シグナル',
    song: 'うた',
    diving: 'パーソナルワールドへ潜っています…',
    skip: 'スキップ',
  },
  hero: {
    eyebrow: 'パーソナルワールド',
    title: '52Hz',
    subtitle: 'コードの向こう側',
    tagline: 'アルゴリズムの向こうに、もうひとつの世界があります。',
    explore: '星をひとつ選んで探検しよう',
    scroll: '潜る',
  },
  chapters: {
    gallery: { name: 'ギャラリー', kind: '写真', blurb: '星空、街の灯り、日常のささやかな瞬間をレンズ越しに。' },
    journey: { name: '旅', kind: '冒険', blurb: '訪れた場所と歩いた道を、地球儀の上に。' },
    companion: { name: '相棒', kind: 'アジエ', blurb: '家の本当の主、茶トラ猫のアジエ。' },
    secrets: { name: '秘密', kind: '探検パスポート', blurb: 'このサイトには、探さないと見つからないものがあります。' },
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
  stub: {
    soon: 'この章はまだ執筆中です。',
    back: '水面に戻る',
  },
};

export const personalUi: Record<Locale, PersonalUI> = { en, 'zh-tw': zhTw, 'zh-cn': zhCn, ja };

/** Chapters of the personal world, in display order. `path` is locale-agnostic. */
export const chapters = [
  { id: 'gallery', path: '/gallery/', nav: 'gallery' },
  { id: 'journey', path: '/personal/journey/', nav: 'journey' },
  { id: 'companion', path: '/personal/companion/', nav: 'companion' },
  { id: 'secrets', path: '/personal/achievements/', nav: 'achievements' },
] as const;
export type ChapterId = (typeof chapters)[number]['id'];
