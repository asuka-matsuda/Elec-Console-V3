const fs = require('fs');

let content = fs.readFileSync('app/components/tools/AppVoltageResult.vue', 'utf8');

// 1. font-size: var(...) を @extend %text-* に置換
content = content.replace(/font-size:\s*var\(--font-size-([a-z0-9]+)\);/g, '@extend %text-$1;');

// 2. inline style の置き換え（class重複を避ける）
content = content.replace('class="value-sep" style="margin-left: 0.5rem"', 'class="value-sep c-voltage-result__drop-paren"');
content = content.replace('class="value-text" :class="mainStatusClass" style="font-size: 1.25rem"', 'class="value-text c-voltage-result__drop-percent" :class="mainStatusClass"');
content = content.replace('class="value-unit" style="font-size: 1rem"', 'class="value-unit c-voltage-result__drop-unit"');
content = content.replace('class="value-text" style="font-size: 1.25rem;"', 'class="value-text c-voltage-result__drop-cable"');

// 3. CSSクラス定義の追加
if (!content.includes('&__drop-paren')) {
  content = content.replace('.c-voltage-result {', '.c-voltage-result {\n  &__drop-paren { margin-left: var(--space-2); }\n  &__drop-percent { @extend %text-xl; }\n  &__drop-unit { @extend %text-md; }\n  &__drop-cable { @extend %text-xl; }');
}

fs.writeFileSync('app/components/tools/AppVoltageResult.vue', content, 'utf8');
