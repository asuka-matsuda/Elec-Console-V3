const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (let file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!filePath.includes('tools')) walk(filePath, files);
    } else if (file.endsWith('.vue')) {
      files.push(filePath);
    }
  }
  return files;
}

const files = walk(path.join(process.cwd(), 'app/components'));
const targets = [];
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('display: flex') && !file.includes('AppModal.vue')) {
    targets.push(path.basename(file));
  }
});
console.log(targets.join(', '));
