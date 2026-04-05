const fs = require('fs');

const files = [
  'middleware/auth.js',
  'services/jwtService.js',
  'server.js',
  'models/Lead.js',
  'mobile-app/App.tsx',
  'mobile-app/src/screens/index.js',
  'mobile-app/src/screens/LoadingScreen.js',
  'mobile-app/src/screens/HomeScreen.js',
  'mobile-app/src/screens/EstimateInputScreen.js',
  'mobile-app/src/screens/ResultScreen.js',
  'mobile-app/src/screens/LeadCaptureScreen.js'
];

for (const f of files) {
  console.log('\n===== ' + f + ' =====\n');
  console.log(fs.readFileSync(f, 'utf8'));
}
