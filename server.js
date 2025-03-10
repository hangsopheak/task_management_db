const fs = require('fs');
const path = require('path');
const jsonServer = require('json-server');
const server = jsonServer.create();
const middlewares = jsonServer.defaults();
const port = process.env.PORT || 3000;

// Define paths
const DB_DIR = path.join(__dirname, 'db');
const TEMPLATE_PATH = path.join(__dirname, 'template.json');

// Ensure "db" directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

server.use(middlewares);

// Handle database switching and routing in a single middleware
server.use((req, res, next) => {
  const dbName = req.header('X-DB-NAME');
  
  if (!dbName) {
    return res.status(400).json({ error: 'X-DB-NAME header is required' });
  }
  
  const dbPath = path.join(DB_DIR, `${dbName}.json`);
  
  // Only initialize the DB file if it doesn't exist yet
  if (!fs.existsSync(dbPath)) {
    if (fs.existsSync(TEMPLATE_PATH)) {
      fs.copyFileSync(TEMPLATE_PATH, dbPath);
    } else {
      fs.writeFileSync(dbPath, JSON.stringify({}, null, 2)); // Fallback to empty JSON
    }
  }
  
  // Create a new router for this specific request and use it immediately
  const router = jsonServer.router(dbPath);
  
  // Forward the request to the router
  router(req, res, next);
});

server.listen(port, () => {
  console.log(`JSON Server is running on port ${port}`);
});