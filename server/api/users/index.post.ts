import { defineEventHandler, readBody, createError } from 'h3';
import fs from 'fs';
import path from 'path';
import { hashPassword, generateRandomPassword } from '../../utils/password';

// 簡単なひらがな/カタカナ→ローマ字変換関数 (ヘボン式ベース簡易版)
function kanaToRomaji(kana: string): string {
  if (!kana) return "";
  const mapping: Record<string, string> = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'o', 'ん': 'n',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
    'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
    'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
    'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
    'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
    'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
    'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
    'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
    'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
    'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
    'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
    // カタカナ対応
    'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
    'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
    'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
    'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
    'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
    'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
    'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
    'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
    'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
    'ワ': 'wa', 'ヲ': 'o', 'ン': 'n',
    'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge', 'ゴ': 'go',
    'ザ': 'za', 'ジ': 'ji', 'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo',
    'ダ': 'da', 'ヂ': 'ji', 'ヅ': 'zu', 'デ': 'de', 'ド': 'do',
    'バ': 'ba', 'ビ': 'bi', 'ブ': 'bu', 'ベ': 'be', 'ボ': 'bo',
    'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ポ': 'po',
    'キャ': 'kya', 'キュ': 'kyu', 'キョ': 'kyo',
    'シャ': 'sha', 'シュ': 'shu', 'ショ': 'sho',
    'チャ': 'cha', 'チュ': 'chu', 'チョ': 'cho',
    'ニャ': 'nya', 'ニュ': 'nyu', 'ニョ': 'nyo',
    'ヒャ': 'hya', 'ヒュ': 'hyu', 'ヒョ': 'hyo',
    'ミャ': 'mya', 'ミュ': 'myu', 'ミョ': 'myo',
    'リャ': 'rya', 'リュ': 'ryu', 'リョ': 'ryo',
    'ギャ': 'gya', 'ギュ': 'gyu', 'ギョ': 'gyo',
    'ジャ': 'ja', 'ジュ': 'ju', 'ジョ': 'jo',
    'ビャ': 'bya', 'ビュ': 'byu', 'ビョ': 'byo',
    'ピャ': 'pya', 'ピュ': 'pyu', 'ピョ': 'pyo'
  };

  let result = "";
  let i = 0;
  while (i < kana.length) {
    // 2文字マッチを先に試す
    if (i < kana.length - 1) {
      const two = kana.substring(i, i + 2);
      if (mapping[two]) {
        result += mapping[two];
        i += 2;
        continue;
      }
    }
    // 1文字マッチ
    const one = kana.charAt(i);
    // 促音「っ/ッ」
    if (one === 'っ' || one === 'ッ') {
      if (i < kana.length - 1) {
        const nextChar = kana.charAt(i + 1);
        let nextRomaji = mapping[nextChar];
        if (!nextRomaji && i < kana.length - 2) {
            nextRomaji = mapping[kana.substring(i+1, i+3)];
        }
        if (nextRomaji && nextRomaji.length > 0) {
            result += nextRomaji.charAt(0); // 次の文字の子音を重ねる
        }
      }
      i++;
      continue;
    }
    // 長音「ー」は省略または無視（今回は無視）
    if (one === 'ー') {
        i++;
        continue;
    }

    result += mapping[one] || one; // マップになければそのまま
    i++;
  }
  return result;
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const dbPath = path.resolve(process.cwd(), 'server/data/users.json');
  
  let users: any[] = [];
  if (fs.existsSync(dbPath)) {
    users = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  }

  // 管理IDの手入力 (body.id)
  if (!body.id) {
    throw createError({ statusCode: 400, statusMessage: '管理ID(id)は必須です' });
  }

  // 重複チェック
  if (users.find(u => u.id === body.id)) {
    throw createError({ statusCode: 409, statusMessage: 'すでに同じ管理IDが登録されています' });
  }

  // カナをローマ字に変換
  const firstRomaji = kanaToRomaji(body.firstNameKana);
  const lastRomaji = kanaToRomaji(body.lastNameKana);

  if (!firstRomaji || !lastRomaji) {
    throw createError({ statusCode: 400, statusMessage: 'ふりがなが不正か、入力されていません' });
  }

  // ログインID自動生成 (名の1文字目-姓+ランダム4桁)
  const firstLetter = firstRomaji.charAt(0).toLowerCase();
  const lastNameStr = lastRomaji.toLowerCase();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const generatedLoginId = `${firstLetter}-${lastNameStr}${randomNum}`;
  
  // ランダムな初期パスワードの生成とハッシュ化
  const generatedPassword = generateRandomPassword();
  const hashedPassword = hashPassword(generatedPassword);

  const newUser = {
    ...body,
    loginId: generatedLoginId,
    password: hashedPassword,
    lastLoginAt: null,
    isActive: true,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  fs.writeFileSync(dbPath, JSON.stringify(users, null, 2), 'utf-8');

  const safeUser = { ...newUser };
  delete safeUser.password;
  // 管理者へ1度だけ表示するために平文の初期パスワードをレスポンスに含める
  return { ...safeUser, initialPassword: generatedPassword };
});
