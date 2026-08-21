const fs = require('fs');
const files = [
  "app/components/AppBadge.vue",
  "app/components/AppBreadcrumb.vue",
  "app/components/AppButton.vue",
  "app/components/AppColorPicker.vue",
  "app/components/AppHeader.vue",
  "app/components/AppIcon.vue",
  "app/components/AppInputGroup.vue",
  "app/components/AppRadioGroup.vue",
  "app/components/AppToggle.vue"
];
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('display: inline-flex')) {
      let isCenter = false;
      let justify = null;
      let gap = null;
      let code = [];
      for(let j=i; j<i+10 && j<lines.length; j++) {
        code.push(lines[j]);
        if(lines[j].includes('align-items: center')) isCenter = true;
        if(lines[j].includes('justify-content:')) justify = lines[j].trim();
        if(lines[j].includes('gap:')) gap = lines[j].trim();
        if(lines[j].includes('}')) break;
      }
      if (isCenter) {
        console.log(`--- ${file}:${i+1} ---`);
        console.log(`justify: ${justify}, gap: ${gap}`);
      }
    }
  }
});
