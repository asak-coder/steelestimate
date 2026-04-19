const fs = require('fs');
const p = 'backend/routes/v1/authRoutes.js';
console.log(fs.readFileSync(p, 'utf8'));
