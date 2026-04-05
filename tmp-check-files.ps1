Remove-Item -Force -ErrorAction SilentlyContinue __probe.txt
$files = @(
  "models/User.js",
  "controllers/authController.js",
  "routes/authRoutes.js",
  "mobile-app/src/utils/tokenStorage.js",
  "mobile-app/src/utils/authClient.js",
  "mobile-app/src/utils/authToken.js",
  "mobile-app/src/screens/LoginScreen.js",
  "mobile-app/src/screens/SignupScreen.js"
)
foreach ($file in $files) {
  if (Test-Path $file) {
    Write-Output ("FOUND " + $file)
  } else {
    Write-Output ("MISSING " + $file)
  }
}
