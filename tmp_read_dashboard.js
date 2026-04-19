const fs = require('fs');
const p = 'frontend/app/admin/dashboard/page.js';
console.log(fs.readFileSync(p, 'utf8'));
