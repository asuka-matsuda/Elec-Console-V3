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
let matches = 0;
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('flex-direction: row;') || content.includes('flex-direction: column;')) {
    if (content.includes('@include cq') || content.includes('@include mq')) {
      matches++;
      // console.log(file);
    }
  }
});
console.log(`Responsive flex changes found in approx ${matches} files.`);
