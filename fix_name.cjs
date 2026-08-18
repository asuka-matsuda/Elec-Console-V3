const fs = require('fs');
let content = fs.readFileSync('./app/utils/data/cableData.ts', 'utf8');

content = content.replace(/name:\s*'[^']+',\s*category:\s*'([^']+)',\s*cores:\s*'([^']+)',\s*size:\s*'([^']+)',\s*unit:\s*'([^']+)',/g, (match, category, cores, size, unit) => {
    let nameStr = `${category} ${size}${unit}`;
    if (cores !== '-' && cores !== '') {
        nameStr += ` ${cores}`;
    }
    return `name: '${nameStr}',\n        category: '${category}',\n        cores: '${cores}',\n        size: '${size}',\n        unit: '${unit}',`;
});

fs.writeFileSync('./app/utils/data/cableData.ts', content, 'utf8');
console.log('Done');
