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
const patterns = {};

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /display:\s*flex;([^}]+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const block = match[1];
    let direction = 'row';
    let align = 'stretch';
    let justify = 'flex-start';
    
    const dirMatch = block.match(/flex-direction:\s*([^;]+);/);
    if (dirMatch) direction = dirMatch[1].trim();
    
    const alignMatch = block.match(/align-items:\s*([^;]+);/);
    if (alignMatch) align = alignMatch[1].trim();
    
    const justifyMatch = block.match(/justify-content:\s*([^;]+);/);
    if (justifyMatch) justify = justifyMatch[1].trim();
    
    const key = `[${direction}] justify: ${justify}, align: ${align}`;
    if (!patterns[key]) patterns[key] = 0;
    patterns[key]++;
  }
});

const sorted = Object.entries(patterns).sort((a, b) => b[1] - a[1]);
console.log(JSON.stringify(sorted, null, 2));
