const fs = require('fs');
let content = fs.readFileSync('./app/utils/data/cableData.ts', 'utf8');

content = content.replace(/\{\s*category:\s*'([^']+)',\s*cores:\s*'([^']+)',\s*size:\s*'([^']+)',\s*unit:\s*'([^']+)',\s*ampacity:\s*'([^']+)',/g, (match, category, cores, size, unit, ampacity) => {
    let nameStr = `${size} ${unit}`;
    if (cores !== '-') nameStr += ` (${cores})`;
    if (ampacity !== '-') nameStr += ` - 許容電流: ${ampacity}A`;
    return `{\n        name: '${nameStr}',\n        category: '${category}',\n        cores: '${cores}',\n        size: '${size}',\n        unit: '${unit}',\n        ampacity: '${ampacity}',`;
});

fs.writeFileSync('./app/utils/data/cableData.ts', content, 'utf8');
console.log('Done');
