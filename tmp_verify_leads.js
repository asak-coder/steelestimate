try {
  require('./backend/routes/leadRoutes');
  require('./backend/controllers/leadController');
  console.log('backend lead modules ok');
} catch (error) {
  console.error('backend lead modules failed');
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
}
