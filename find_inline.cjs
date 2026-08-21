const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (let file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, files);
    } else if (file.endsWith('.vue') || file.endsWith('.scss')) {
      files.push(filePath);
    }
  }
  return files;
}

const files = walk(path.join(process.cwd(), 'app'));
const targets = [];
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('display: inline-flex')) {
    targets.push(path.relative(process.cwd(), file));
  }
});
console.log(targets.join('\n'));
