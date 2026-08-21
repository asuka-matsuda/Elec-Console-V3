const fs = require('fs');
const path = require('path');

// 1. Update _mixins.scss
const mixinPath = path.join(process.cwd(), 'app/assets/scss/foundation/_mixins.scss');
let mixinContent = fs.readFileSync(mixinPath, 'utf8');
const mixinsToAdd = '\n/* Typography Placeholders\n   ========================================================================== */\n%text-2xs {\n  font-size: var(--font-size-2xs);\n  line-height: var(--line-height-base);\n}\n%text-xs {\n  font-size: var(--font-size-xs);\n  line-height: var(--line-height-base);\n}\n%text-sm {\n  font-size: var(--font-size-sm);\n  line-height: var(--line-height-base);\n}\n%text-base {\n  font-size: var(--font-size-base);\n  line-height: var(--line-height-base);\n}\n%text-md {\n  font-size: var(--font-size-md);\n  line-height: var(--line-height-base);\n}\n%text-lg {\n  font-size: var(--font-size-lg);\n  line-height: var(--line-height-tight);\n}\n%text-xl {\n  font-size: var(--font-size-xl);\n  line-height: var(--line-height-tight);\n}\n%text-2xl {\n  font-size: var(--font-size-2xl);\n  line-height: var(--line-height-tight);\n}\n%text-3xl {\n  font-size: var(--font-size-3xl);\n  line-height: var(--line-height-tight);\n}\n%text-4xl {\n  font-size: var(--font-size-4xl);\n  line-height: var(--line-height-tight);\n}\n';
if (!mixinContent.includes('%text-2xs')) {
  fs.writeFileSync(mixinPath, mixinContent + mixinsToAdd, 'utf8');
}

// 2. Replace fonts in all Vue files
const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.vue')) {
      results.push(file);
    }
  });
  return results;
};
const files = walk(path.join(process.cwd(), 'app'));
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/font-size:\s*var\(--font-size-([a-z0-9]+)\);/g, '@extend %text-$1;');
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
  }
});

// 3. Fix AppVoltageResult.vue inline styles
const vResultPath = path.join(process.cwd(), 'app/components/tools/AppVoltageResult.vue');
let vResultContent = fs.readFileSync(vResultPath, 'utf8');
vResultContent = vResultContent
  .replace('style=\"margin-left: 0.5rem\"', 'class=\"c-voltage-result__drop-paren\"')
  .replace('style=\"font-size: 1.25rem\"', 'class=\"c-voltage-result__drop-percent\"')
  .replace('style=\"font-size: 1rem\"', 'class=\"c-voltage-result__drop-unit\"')
  .replace('style=\"font-size: 1.25rem;\"', 'class=\"c-voltage-result__drop-cable\"');
if (!vResultContent.includes('&__drop-paren')) {
  vResultContent = vResultContent.replace('.c-voltage-result {', '.c-voltage-result {\n  &__drop-paren { margin-left: var(--space-2); }\n  &__drop-percent { @extend %text-xl; }\n  &__drop-unit { @extend %text-md; }\n  &__drop-cable { @extend %text-xl; }');
}
fs.writeFileSync(vResultPath, vResultContent, 'utf8');

// 4. Fix weight.vue inline styles
const weightPath = path.join(process.cwd(), 'app/pages/tools/weight.vue');
let weightContent = fs.readFileSync(weightPath, 'utf8');
weightContent = weightContent.replace('<div class=\"l-stack\" style=\"gap: var(--gap-section);\">', '<div class=\"p-weight__sections\">');
if (!weightContent.includes('&__sections {')) {
  weightContent = weightContent.replace('.p-weight {', '.p-weight {\n  &__sections {\n    display: flex;\n    flex-direction: column;\n    gap: var(--gap-section);\n  }');
}
fs.writeFileSync(weightPath, weightContent, 'utf8');

// 5. Fix AppBreadcrumb.vue multiline font-size
const breadcrumbPath = path.join(process.cwd(), 'app/components/AppBreadcrumb.vue');
let breadcrumbContent = fs.readFileSync(breadcrumbPath, 'utf8');
breadcrumbContent = breadcrumbContent.replace(/font-size:\s*var\(\s*--font-size-lg\s*\);/g, '@extend %text-lg;');
breadcrumbContent = breadcrumbContent.replace(/&:not\(:last-child\)::after \{\s*@extend %text-xs;/g, '&:not(:last-child)::after {\n      font-size: var(--font-size-xs);');
fs.writeFileSync(breadcrumbPath, breadcrumbContent, 'utf8');
