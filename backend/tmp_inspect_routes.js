const routes = require("./routes/apiKeyRoutes");
console.log(routes.stack.length, routes.stack.map((l) => l.name || "anonymous"));
