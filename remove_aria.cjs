const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if(file.endsWith('.vue')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('app/components');
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  
  // Replace role="..."
  content = content.replace(/\s+role="[^"]+"/g, '');
  
  // Replace aria-xyz="..."
  content = content.replace(/\s+aria-[a-z]+="[^"]+"/g, '');
  
  // Replace :aria-xyz="..."
  content = content.replace(/\s+:aria-[a-z]+="[^"]+"/g, '');

  if(content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
    changedCount++;
  }
});

// Fix AppFormGroup.vue CSS selector
let formGroup = fs.readFileSync('app/components/AppFormGroup.vue', 'utf8');
formGroup = formGroup.replace(/\[aria-invalid="true"\]/g, '.is-error');
fs.writeFileSync('app/components/AppFormGroup.vue', formGroup, 'utf8');

console.log('Total files updated: ' + changedCount);
