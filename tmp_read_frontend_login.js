const fs = require('fs');
const p = 'frontend/app/admin/login/page.js';
console.log(fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : 'MISSING');
