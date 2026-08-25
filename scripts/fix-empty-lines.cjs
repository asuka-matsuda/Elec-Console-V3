const fs = require('fs');
const path = require('path');

function processDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.vue')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Remove double empty lines after category comments
      // e.g. `// --- ボックスモデル ---\n\n  border: ...` -> `// --- ボックスモデル ---\n  border: ...`
      const newContent = content.replace(/(\/\/ --- [^\n]+ ---)\r?\n[ \t]*\r?\n([ \t]*)/g, '$1\n$2');
      
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log('Fixed empty lines in:', fullPath);
      }
    }
  });
}

processDir('app');
