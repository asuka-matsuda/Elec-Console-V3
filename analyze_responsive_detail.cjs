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
  if (content.includes('@include cq') && content.includes('flex-direction')) {
    console.log("File:", path.basename(file));
    const lines = content.split('\n');
    let printing = false;
    for(let i=0; i<lines.length; i++) {
      if (lines[i].includes('display: flex')) printing = true;
      if (printing) console.log(lines[i]);
      if (printing && lines[i].includes('}')) {
        // Look ahead for cq
        let hasCq = false;
        for(let j=i+1; j<i+15 && j<lines.length; j++) {
           if(lines[j].includes('@include cq')) hasCq = true;
           if(hasCq && lines[j].includes('}')) {
             for(let k=i+1; k<=j; k++) console.log(lines[k]);
             console.log("---");
             break;
           }
        }
        printing = false;
      }
    }
  }
});
