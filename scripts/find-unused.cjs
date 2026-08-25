const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      if (!dirFile.includes('node_modules') && !dirFile.includes('.nuxt') && !dirFile.includes('.output')) {
        filelist = walkSync(dirFile, filelist);
      }
    } else {
      if (dirFile.endsWith('.vue')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
};

const appDir = path.join(__dirname, '..', 'app');
const vueFiles = walkSync(appDir);

let unusedCount = 0;

for (const file of vueFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
  const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);

  if (templateMatch && styleMatch) {
    const templateContent = templateMatch[1];
    let styleContent = styleMatch[1];
    
    // Remove comments from style
    styleContent = styleContent.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');

    // Find all BEM element/modifier suffixes in style, e.g. &__header or &--active
    // Also find standard classes .c-something
    const classRegex = /(?:\.|&__)([a-zA-Z0-9_-]+)(?=\s*\{|\s*,|\s*:|\s*\.)/g;
    
    let match;
    const definedClasses = new Set();
    while ((match = classRegex.exec(styleContent)) !== null) {
      definedClasses.add(match[1]);
    }

    const unused = [];
    for (const cls of definedClasses) {
      // Check if cls appears in the template content. This is a very rough heuristic
      // because BEM classes like `c-card__header` will contain `header` string.
      // So we just check if the string `cls` exists in the template.
      if (!templateContent.includes(cls)) {
        // Double check: maybe it's dynamically generated like :class="`is-${type}`"
        // If the class is something like `header`, it should easily match.
        // If it doesn't match at all, it's highly likely unused.
        
        // Wait, some states might be `&.is-active`, which matches `.is-active`. 
        // Our regex matches `\.([a-zA-Z0-9_-]+)`, so it gets `is-active`.
        // If `is-active` isn't in template, maybe it's added by Vue router (like router-link-active)?
        if (cls === 'router-link-active' || cls === 'router-link-exact-active' || cls.startsWith('v-') || cls === 'is-active') {
          continue;
        }
        
        unused.push(cls);
      }
    }

    if (unused.length > 0) {
      console.log(`\n${path.basename(file)}:`);
      console.log(`Possible unused classes/elements: ${unused.join(', ')}`);
      unusedCount += unused.length;
    }
  }
}

console.log(`\nFound ${unusedCount} potentially unused blocks.`);
