const fs = require('fs');
const p = 'frontend/lib/auth.js';
console.log(fs.readFileSync(p, 'utf8').split('\n').join(' | '));
