const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (let file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('.git')) {
        walk(filePath, files);
      }
    } else if (file.endsWith('.vue')) {
      files.push(path.relative(process.cwd(), filePath).replace(/\\/g, '/'));
    }
  }
  return files;
}

const components = walk(path.join(process.cwd(), 'app/components'));
const pages = walk(path.join(process.cwd(), 'app/pages'));

console.log("=== Components ===");
console.log(components.join('\n'));
console.log("=== Pages ===");
console.log(pages.join('\n'));
