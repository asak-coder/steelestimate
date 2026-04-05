const fs = require('fs');

const paths = [
  'server.js',
  'routes/leadRoutes.js',
  'controllers/leadController.js',
  'services/jwtService.js',
  'mobile-app/App.tsx',
  'mobile-app/src/utils/apiClient.js',
  'mobile-app/src/screens/LoginScreen.js',
  'mobile-app/src/screens/SignupScreen.js'
];

for (const p of paths) {
  console.log('\n===== ' + p + ' =====\n');
  console.log(fs.readFileSync(p, 'utf8').slice(0, 3500));
}
