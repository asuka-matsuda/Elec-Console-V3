import { execSync } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';

const startTime = Date.now();

function run(cmd, desc) {
  console.log(`\n⏳ ${desc}...`);
  const t0 = Date.now();
  execSync(cmd, { stdio: 'inherit', shell: true });
  console.log(`✓ 完了 (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}

try {
  console.log('======================================================');
  console.log('   🚀 Elec-Console-V3 超高速ローカルビルドデプロイ    ');
  console.log('======================================================');

  // 1. ローカルビルド
  run('npm run build', '[1/5] ローカルPCでビルド中');

  // 2. 圧縮
  run('tar -czf output.tar.gz -C .output .', '[2/5] 成果物をアーカイブ中 (output.tar.gz)');

  // 3. VPSへ転送
  run('scp output.tar.gz elec-vps:/root/Elec-Console-V3/output.tar.gz', '[3/5] VPS へアーカイブを転送中');

  // 4. VPS側でGit同期 & DB同期 & 解凍 & 再起動
  const vpsCmd = [
    'cd /root/Elec-Console-V3',
    'git pull origin main',
    'npx prisma db push > /dev/null 2>&1 || true',
    'npx prisma generate > /dev/null 2>&1 || true',
    'chmod 666 prisma/dev.db* 2>/dev/null || true',
    'mkdir -p .output',
    'tar -xzf output.tar.gz -C .output',
    'rm -f output.tar.gz',
    'pm2 reload ecosystem.config.cjs --update-env 2>/dev/null || pm2 restart ecosystem.config.cjs',
    'pm2 status elec-console'
  ].join(' && ');

  run(`ssh elec-vps "${vpsCmd}"`, '[4/5] VPS側で展開 & PM2再起動中');

  // 5. 後片付け
  if (existsSync('output.tar.gz')) {
    unlinkSync('output.tar.gz');
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n======================================================');
  console.log(`   ✨ 超高速デプロイ完了！ (所要時間: ${elapsed}秒)`);
  console.log('   公開URL: https://app.mat-ope.com');
  console.log('======================================================\n');
} catch (err) {
  console.error('\n❌ デプロイ中にエラーが発生しました:', err.message);
  if (existsSync('output.tar.gz')) {
    unlinkSync('output.tar.gz');
  }
  process.exit(1);
}
