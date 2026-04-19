const fs = require('fs');
const p = 'backend/controllers/authController.js';
console.log(fs.readFileSync(p, 'utf8'));
