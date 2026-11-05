import type { Locale } from './ui';

/**
 * Copy for the error pages (404.html, 500.html). One built file serves every locale, so the page
 * embeds all four and picks one from the URL's locale prefix before first paint.
 * No full stop at the end, like the rest of the site's short copy.
 */
export type ErrorCopy = {
  kicker: string;
  title: string;
  body: string;
  primary: string;
  secondary: string;
};

export const errorCodes = [404, 500] as const;
export type ErrorCode = (typeof errorCodes)[number];

export const errorCopy: Record<ErrorCode, Record<Locale, ErrorCopy>> = {
  404: {
    en: {
      kicker: 'Error 404',
      title: 'No echo at this frequency',
      body: "The page you were looking for isn't here. It may have moved, or the address may be mistyped",
      primary: 'Back to home',
      secondary: 'Visit 52Hz Fan',
    },
    'zh-tw': {
      kicker: '錯誤 404',
      title: '這個頻率沒有回音',
      body: '你要找的頁面不在這裡，可能已經搬走，或網址打錯了',
      primary: '回到首頁',
      secondary: '前往 52Hz Fan',
    },
    'zh-cn': {
      kicker: '错误 404',
      title: '这个频率没有回音',
      body: '你要找的页面不在这里，可能已经搬走，或网址输错了',
      primary: '回到首页',
      secondary: '前往 52Hz Fan',
    },
    ja: {
      kicker: 'エラー 404',
      title: 'この周波数に応答はありません',
      body: 'お探しのページは見つかりませんでした。移動したか、アドレスが間違っている可能性があります',
      primary: 'ホームに戻る',
      secondary: '52Hz Fan へ',
    },
  },
  500: {
    en: {
      kicker: 'Error 500',
      title: 'The signal broke up',
      body: 'Something went wrong on our side. Please try again in a moment',
      primary: 'Try again',
      secondary: 'Back to home',
    },
    'zh-tw': {
      kicker: '錯誤 500',
      title: '訊號中斷了',
      body: '伺服器端出了點問題，請稍後再試一次',
      primary: '重新整理',
      secondary: '回到首頁',
    },
    'zh-cn': {
      kicker: '错误 500',
      title: '信号中断了',
      body: '服务器端出了点问题，请稍后再试一次',
      primary: '重新加载',
      secondary: '回到首页',
    },
    ja: {
      kicker: 'エラー 500',
      title: '信号が途切れました',
      body: 'サーバー側で問題が発生しました。しばらくしてからもう一度お試しください',
      primary: '再読み込み',
      secondary: 'ホームに戻る',
    },
  },
};
