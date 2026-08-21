const fs = require('fs');
const glob = require('fs').readdirSync;
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

files.forEach(file => {
  let c = fs.readFileSync(file, 'utf8');
  let original = c;
  
  if(file.includes('AppBadge.vue')) {
    c = c.replace(/padding: var\(--space-1\);/g, 'padding: var(--pad-element);');
  } else if (file.includes('AppColorPicker.vue')) {
    c = c.replace(/padding: var\(--space-3\);/g, 'padding: var(--pad-section);');
  } else if (file.includes('AppDisclaimer.vue')) {
    c = c.replace(/padding: var\(--space-3\);/g, 'padding: var(--pad-section);');
  } else if (file.includes('AppMathBasis.vue')) {
    c = c.replace(/padding: var\(--space-1\);/g, 'padding: var(--pad-element);');
  } else if (file.includes('AppRadioGroup.vue')) {
    c = c.replace(/padding: var\(--space-1\);/g, 'padding: var(--pad-element);');
    c = c.replace(/padding: var\(--space-2\);/g, 'padding: var(--pad-component);');
  } else if (file.includes('AppSelect.vue')) {
    c = c.replace(/padding: var\(--space-2\);/g, 'padding: var(--pad-component);');
  } else if (file.includes('AppTable.vue')) {
    c = c.replace(/padding: var\(--space-3\);/g, 'padding: var(--pad-section);');
  } else if (file.includes('AppHeader.vue')) {
    c = c.replace(/padding: var\(--space-3\);/g, 'padding: var(--pad-section);');
  } else if (file.includes('AppConduitResult.vue') || file.includes('AppVoltageResult.vue')) {
    c = c.replace(/padding: var\(--space-2\);/g, 'padding: var(--pad-component);');
    c = c.replace(/padding: var\(--space-1\) var\(--space-2\);/g, 'padding: var(--pad-element) var(--pad-component);');
    c = c.replace(/padding: var\(--space-2\) var\(--space-3\);/g, 'padding: var(--pad-component) var(--pad-section);');
    c = c.replace(/padding: var\(--space-1\);/g, 'padding: var(--pad-element);');
  }

  if (c !== original) {
    fs.writeFileSync(file, c, 'utf8');
    console.log('Updated ' + path.basename(file));
  }
});
