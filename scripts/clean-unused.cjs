const fs = require('fs');
const path = require('path');

// 1. settings.vue
const settingsFile = path.join(__dirname, '..', 'app/pages/settings.vue');
let settingsContent = fs.readFileSync(settingsFile, 'utf8');
settingsContent = settingsContent.replace(/\s*&__sub-group\s*\{[\s\S]*?\n\s*\}/, '');
fs.writeFileSync(settingsFile, settingsContent, 'utf8');

// 2. voltage.vue
const voltageFile = path.join(__dirname, '..', 'app/pages/tools/voltage.vue');
let voltageContent = fs.readFileSync(voltageFile, 'utf8');
voltageContent = voltageContent.replace(/\s*\/\*\s*ケーブル種別未選択時にケーブルサイズを無効化\s*\*\/\s*\.l-grid:has\(\.js-field-cableType\s*\[data-placeholder="true"\]\)\s*\.js-field-fixedSize\s*\{[\s\S]*?\n\s*\}/, '');
fs.writeFileSync(voltageFile, voltageContent, 'utf8');

// 3. AppHistoryCard.vue
const historyCardFile = path.join(__dirname, '..', 'app/components/tools/AppHistoryCard.vue');
let historyCardContent = fs.readFileSync(historyCardFile, 'utf8');
historyCardContent = historyCardContent.replace(/\s*&\.is-error\s*\{[\s\S]*?\}\s*\}/, '');
fs.writeFileSync(historyCardFile, historyCardContent, 'utf8');

console.log('Removed unused blocks.');
