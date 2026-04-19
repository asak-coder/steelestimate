const fs = require('fs');
const p = 'backend/package.json';
const j = JSON.parse(fs.readFileSync(p, 'utf8'));
console.log(JSON.stringify({
  name: j.name,
  scripts: j.scripts,
  dependencies: j.dependencies,
  devDependencies: j.devDependencies
}, null, 2));
