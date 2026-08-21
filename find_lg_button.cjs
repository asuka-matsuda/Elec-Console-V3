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
      files.push(filePath);
    }
  }
  return files;
}

const files = walk(path.join(process.cwd(), 'app'));
const usages = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('size="lg"') || content.includes("size='lg'") || content.includes('size="large"')) {
    usages.push(path.relative(process.cwd(), file));
  }
});

console.log(usages.length > 0 ? usages.join('\n') : "No usages found.");
