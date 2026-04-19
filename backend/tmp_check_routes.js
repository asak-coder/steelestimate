const routes = [
  ['./routes/v1/authRoutes', 'auth'],
  ['./routes/v1/orchestratorRoutes', 'orch'],
  ['./routes/apiKeyRoutes', 'api'],
  ['./routes/paymentRoutes', 'pay'],
  ['./routes/adminRoutes', 'admin']
];

for (const [path, label] of routes) {
  try {
    const mod = require(path);
    console.log(label, typeof mod);
  } catch (error) {
    console.log(label, 'ERROR', error.message);
  }
}
