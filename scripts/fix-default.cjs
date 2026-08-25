const fs = require('fs');
let c = fs.readFileSync('app/layouts/default.vue', 'utf8');
c = c.replace(/`n[ \t]*/g, '\n  ');
fs.writeFileSync('app/layouts/default.vue', c, 'utf8');
