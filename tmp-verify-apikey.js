const fs = require('fs');

const files = [
  'models/ApiKey.js',
  'middleware/apiKeyAuth.js',
  'controllers/apiKeyController.js',
  'routes/apiKeyRoutes.js',
  'server.js'
];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  console.log(`${file}: ${content.includes('usedRequests') ? 'ok' : 'missing usedRequests'}`);
}
console.log('verification complete');
