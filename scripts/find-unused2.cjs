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

for (const file of vueFiles) {
  const content = fs.readFileSync(file, 'utf8');
  
  // Find <template> and </template> correctly
  const templateStartIndex = content.indexOf('<template>');
  const templateEndIndex = content.lastIndexOf('</template>');
  
  if (templateStartIndex === -1 || templateEndIndex === -1) continue;
  
  const templateContent = content.substring(templateStartIndex, templateEndIndex);
  
  const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  if (!styleMatch) continue;

  let styleContent = styleMatch[1];
  styleContent = styleContent.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');

  const classRegex = /(?:\.|&__)(&?[a-zA-Z0-9_-]+)(?=\s*\{|\s*,|\s*:|\s*\.)/g;
  let match;
  const definedClasses = new Set();
  while ((match = classRegex.exec(styleContent)) !== null) {
    let cls = match[1];
    if (cls.startsWith('&')) continue; // Skip complex BEM for now
    definedClasses.add(cls);
  }

  const unused = [];
  for (const cls of definedClasses) {
    if (cls === 'router-link-active' || cls === 'router-link-exact-active' || cls.startsWith('v-') || cls === 'is-active') {
      continue;
    }
    // Also ignore common dynamic classes if they are short like "md" "sm"
    if (cls.length <= 2) continue;
    
    if (!templateContent.includes(cls)) {
      unused.push(cls);
    }
  }

  if (unused.length > 0) {
    console.log(`\n${path.basename(file)}:`);
    console.log(`Unused: ${unused.join(', ')}`);
  }
}
