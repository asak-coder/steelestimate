const fs = require('fs');

const file = 'frontend/package.json';

const content = fs.readFileSync(file, 'utf8');

if (content.charCodeAt(0) === 0xFEFF) {
  console.error('❌ BOM detected in package.json');
  process.exit(1);
}

JSON.parse(content);

console.log('✅ JSON valid');