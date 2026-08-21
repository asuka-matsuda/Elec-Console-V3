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
const issues = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Check if size is defined in Props
  if (content.includes('size?:') || content.includes('size:')) {
    // Check if it has a default size, for example: size: "sm" or size: "md"
    const hasSizeDefault = content.includes('size: "') || content.includes("size: '");
    
    // Check CSS modifiers
    const hasSm = content.includes('&--sm');
    const hasMd = content.includes('&--md');
    const hasLg = content.includes('&--lg');
    
    // If it has a modifier for one size but not for another (which might be the default)
    if ((hasMd || hasLg) && !hasSm && content.includes('sm')) {
      issues.push(path.basename(file) + ": has md/lg but missing --sm modifier");
    } else if ((hasSm || hasLg) && !hasMd && content.includes('md')) {
      issues.push(path.basename(file) + ": has sm/lg but missing --md modifier (might be base)");
    }
  }
});

console.log(issues.join('\n'));
