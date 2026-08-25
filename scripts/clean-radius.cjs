const fs = require('fs');
const path = require('path');

const filesToClean = [
  'app/components/AppDashboardAside.vue',
  'app/pages/settings.vue',
  'app/components/AppInputGroup.vue'
];

for (const relPath of filesToClean) {
  const file = path.join(__dirname, '..', relPath);
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/^\s*border(-[a-z]+)*-radius:\s*0;\s*\n/gm, '');
  fs.writeFileSync(file, content, 'utf8');
}

console.log('Removed redundant border-radius: 0');
