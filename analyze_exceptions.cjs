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
const exceptions = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('display: flex')) {
      // Look ahead to capture properties within the block
      let direction = 'row';
      let align = 'stretch';
      let justify = 'flex-start';
      let blockLines = [];
      
      for (let j = i + 1; j < i + 10 && j < lines.length; j++) {
        const line = lines[j];
        if (line.includes('{') || line.includes('display:')) break; // Next block started
        blockLines.push(line.trim());
        
        const dirMatch = line.match(/flex-direction:\s*([^;]+);/);
        if (dirMatch) direction = dirMatch[1].trim();
        
        const alignMatch = line.match(/align-items:\s*([^;]+);/);
        if (alignMatch) align = alignMatch[1].trim();
        
        const justifyMatch = line.match(/justify-content:\s*([^;]+);/);
        if (justifyMatch) justify = justifyMatch[1].trim();
        
        if (line.includes('}')) break;
      }
      
      // Filter out the main common patterns
      const isCommon = 
        (direction === 'column' && justify === 'flex-start' && align === 'stretch') ||
        (direction === 'row' && justify === 'flex-start' && align === 'center') ||
        (direction === 'row' && justify === 'flex-start' && align === 'stretch');
        
      if (!isCommon && !file.includes('_mixins.scss')) {
        // Find the CSS selector/class name (look behind)
        let selector = 'unknown';
        for (let k = i - 1; k >= Math.max(0, i - 5); k--) {
          if (lines[k].includes('{')) {
            selector = lines[k].replace('{', '').trim();
            break;
          }
        }
        
        exceptions.push({
          file: path.relative(process.cwd(), file),
          selector,
          direction,
          justify,
          align,
          line: i + 1
        });
      }
    }
  }
});

// Group by pattern
const grouped = {};
exceptions.forEach(ex => {
  const key = `[${ex.direction}] justify: ${ex.justify}, align: ${ex.align}`;
  if (!grouped[key]) grouped[key] = [];
  grouped[key].push(ex);
});

console.log(JSON.stringify(grouped, null, 2));
