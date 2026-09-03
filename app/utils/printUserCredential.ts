/**
 * ユーザーのログイン情報（ID/パスワード等）を印刷用ウィンドウで表示するユーティリティ
 */
export const printUserCredential = (user: {
  lastName: string
  firstName: string
  loginId: string
  initialPassword?: string
}) => {
  const printWindow = window.open('', '_blank')

  if (!printWindow) {
    alert('ポップアップブロックを解除してください。')

    return
  }

  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <title>ログイン情報</title>
      <style>
        @page { margin: 20mm; }
        body {
          font-family: "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif;
          color: #111;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
          margin-bottom: 20px;
          display: inline-block;
        }
        .box {
          border: 2px solid #333;
          border-radius: 8px;
          padding: 30px;
          margin: 0 auto 30px auto;
          max-width: 500px;
          background: #fafafa;
        }
        .item {
          margin-bottom: 25px;
        }
        .item:last-child {
          margin-bottom: 0;
        }
        .label {
          font-size: 14px;
          color: #555;
          margin-bottom: 8px;
          font-weight: bold;
        }
        .value {
          font-size: 20px;
          font-weight: bold;
          padding-bottom: 5px;
          border-bottom: 1px dashed #ccc;
        }
        .password {
          font-family: monospace;
          font-size: 28px;
          letter-spacing: 3px;
          color: #d32f2f;
        }
        .notice {
          font-size: 14px;
          font-weight: bold;
          border: 2px dashed #d32f2f;
          padding: 15px;
          color: #d32f2f;
          max-width: 500px;
          margin: 0 auto;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">ログイン情報のご案内</div>
        <p>以下の情報を使用してログインしてください。</p>
      </div>
      
      <div class="box">
        <div class="item">
          <div class="label">氏名</div>
          <div class="value">${user.lastName} ${user.firstName}</div>
        </div>
        <div class="item">
          <div class="label">ログインID</div>
          <div class="value">${user.loginId}</div>
        </div>
        <div class="item">
          <div class="label">初期パスワード</div>
          <div class="value password">${user.initialPassword || '（既に設定済みです）'}</div>
        </div>
      </div>
      
      <div class="notice">
        【重要】<br>
        ※ セキュリティのため、初回ログイン時にパスワードの変更が求められます。<br>
        ※ この用紙はパスワード変更後、速やかに破棄してください。
      </div>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.onload = () => {
    printWindow.print()
  }
}
