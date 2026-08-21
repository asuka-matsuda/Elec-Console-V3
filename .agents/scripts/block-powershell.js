const fs = require('fs');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(input);
    const args = payload.toolCall && payload.toolCall.args;
    if (args && args.CommandLine) {
      const cmd = args.CommandLine.toLowerCase();
      // ファイルを破壊する恐れのあるコマンドを正規表現などで検知
      const isBlocked = 
        cmd.includes('set-content') ||
        cmd.includes('add-content') ||
        cmd.includes('out-file') ||
        cmd.includes('>') || // リダイレクト（git show > ... 等もブロックされるが安全優先）
        cmd.includes('node -e') ||
        cmd.includes('node --eval') ||
        cmd.includes('sed -i');

      if (isBlocked) {
        console.log(JSON.stringify({
          decision: 'deny',
          reason: 'CRITICAL RULE ENFORCEMENT: Editing or piping to files via terminal commands is strictly prohibited to prevent Mojibake (encoding corruption). You MUST use replace_file_content or write_to_file tools instead.'
        }));
        return;
      }
    }
    
    console.log(JSON.stringify({ decision: 'allow' }));
  } catch(e) {
    console.log(JSON.stringify({ decision: 'allow' }));
  }
});
