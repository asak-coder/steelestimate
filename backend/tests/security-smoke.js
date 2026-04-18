const assert = require("assert");
const path = require("path");
const fs = require("fs");

const backendRoot = path.join(__dirname, "..");

function read(filePath) {
  return fs.readFileSync(path.join(backendRoot, filePath), "utf8");
}

function main() {
  const server = read("server.js");
  const authMiddleware = read("middleware/auth.js");
  const authController = read("controllers/authController.js");
  const authRoutes = read("routes/authRoutes.js");
  const v1AuthRoutes = read("routes/v1/authRoutes.js");
  const leadRoutes = read("routes/leadRoutes.js");
  const adminRoutes = read("routes/adminRoutes.js");
  const apiClient = read("../frontend/lib/api.js");
  const authHelpers = read("../frontend/lib/auth.js");
  const loginPage = read("../frontend/app/admin/login/page.js");
  const authGuard = read("../frontend/components/AuthGuard.js");

  assert(server.includes("securityMiddleware"), "server.js should use shared security middleware");
  assert(server.includes("cookieParser()"), "server.js should enable cookie-parser");
  assert(authMiddleware.includes("verifyToken"), "auth middleware should verify JWTs from cookies");
  assert(authMiddleware.includes("req.cookies && req.cookies.authToken"), "auth middleware should read authToken from cookies");
  assert(authController.includes('res.cookie("authToken"'), "login/register should set authToken cookie");
  assert(authController.includes('res.clearCookie("authToken"'), "logout should clear authToken cookie");
  assert(authRoutes.includes("authLimiter"), "auth routes should rate limit auth endpoints");
  assert(v1AuthRoutes.includes("authLimiter"), "v1 auth routes should rate limit auth endpoints");
  assert(leadRoutes.includes("router.use(requireAuth)"), "lead routes should require auth");
  assert(leadRoutes.includes("sensitiveLimiter"), "lead routes should rate limit sensitive endpoints");
  assert(adminRoutes.includes("router.use(requireAuth, requireAdmin, adminLimiter)"), "admin routes should require admin access and rate limit");
  assert(apiClient.includes("credentials: 'include'"), "frontend API client should send credentials");
  assert(!apiClient.includes("Authorization"), "frontend API client should not inject Authorization headers");
  assert(!authHelpers.includes("getStoredToken"), "frontend auth helpers should not expose stored token access");
  assert(!authHelpers.includes("setAuthToken"), "frontend auth helpers should not manually store tokens");
  assert(loginPage.includes("await login(email, password);"), "login page should rely on cookie-based auth");
  assert(!loginPage.includes("setAuthToken"), "login page should not store tokens");
  assert(!authGuard.includes("getStoredToken"), "auth guard should not use localStorage tokens");
  assert(!authGuard.includes("Authorization"), "auth guard should not rely on Authorization headers");

  console.log("Security smoke checks passed.");
}

main();
