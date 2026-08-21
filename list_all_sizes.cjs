const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (let file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, files);
    } else if (file.endsWith('.vue')) {
      files.push(filePath);
    }
  }
  return files;
}

const files = walk(path.join(process.cwd(), 'app/components'));

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('size: "') || content.includes('size?:')) {
    console.log(`--- ${path.basename(file)} ---`);
    const modifiers = [];
    if(content.includes('&--xs')) modifiers.push('xs');
    if(content.includes('&--sm')) modifiers.push('sm');
    if(content.includes('&--md')) modifiers.push('md');
    if(content.includes('&--lg')) modifiers.push('lg');
    if(content.includes('&--xl')) modifiers.push('xl');
    console.log(`Found modifiers: ${modifiers.join(', ')}`);
  }
});
