const fs = require('fs');
const p = 'frontend/lib/api.js';
console.log(fs.readFileSync(p, 'utf8'));
