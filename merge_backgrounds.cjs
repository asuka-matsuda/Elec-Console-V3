const fs = require('fs');

const bgPath = 'app/assets/scss/foundation/_backgrounds.scss';
const basePath = 'app/assets/scss/foundation/_base.scss';
const themesPath = 'app/assets/scss/foundation/_themes.scss';
const indexPath = 'app/assets/scss/foundation/_index.scss';

let bgContent = fs.readFileSync(bgPath, 'utf8');

// Extract Variables and Base
const baseGlowsMatch = bgContent.match(/\$base-glows:[\s\S]*?\);\r?\n/);
const bodyBgMatch = bgContent.match(/body \{[\s\S]*?transition: background var\(--duration-modal\) ease; \/\/ 背景の刁E時間\r?\n\}/);

let baseContent = fs.readFileSync(basePath, 'utf8');

// Add functions import to _base.scss if not there
if (!baseContent.includes('@use "functions"')) {
  baseContent = baseContent.replace(/@use "mixins" as \*;\r?\n/, '@use "mixins" as *;\n@use "functions" as *;\n');
}

// Insert baseGlows before /* Base Elements
baseContent = baseContent.replace(/\/\* Base Elements/, baseGlowsMatch[0] + '\n/* Base Elements');

// Insert body bg properties into the existing body { ... }
const bodyInject = `
  background-color: var(--color-main-bg);
  background-image: #{$base-glows};
  background-repeat: no-repeat;
  background-attachment: fixed;
  background-size:
    100% 100%,
    100% 100%;
  transition: background var(--duration-modal) ease;
`;

baseContent = baseContent.replace(/body \{/, 'body {' + bodyInject);
fs.writeFileSync(basePath, baseContent, 'utf8');

// Extract Modifiers and Overrides
const modifiersMatch = bgContent.match(/\/\* Modifiers\r?\n[\s\S]*/);
let themesContent = fs.readFileSync(themesPath, 'utf8');

themesContent += '\n// ==========================================================================\n';
themesContent += '// Background Themes\n';
themesContent += '// ==========================================================================\n';
themesContent += modifiersMatch[0].replace(/\/\* Modifiers[\s\S]*?=\*\/[\r\n]*/, '');

fs.writeFileSync(themesPath, themesContent, 'utf8');

// Delete backgrounds.scss
fs.unlinkSync(bgPath);

// Remove forward from index.scss
let indexContent = fs.readFileSync(indexPath, 'utf8');
indexContent = indexContent.replace(/@forward "backgrounds";\r?\n?/g, '');
fs.writeFileSync(indexPath, indexContent, 'utf8');
