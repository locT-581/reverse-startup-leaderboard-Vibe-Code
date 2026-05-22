import * as path from 'path';
import * as fs from 'fs';

// Try to load env variables from .env.local or .env files in common locations
const envNames = ['.env.local', '.env'];
const searchDirs = [
  process.cwd(),
  path.join(process.cwd(), 'apps/backend'),
  path.join(__dirname, '..'),
  path.join(__dirname, '../..'),
  path.join(__dirname, '../../..'),
];

let loaded = false;
for (const dir of searchDirs) {
  for (const name of envNames) {
    const envPath = path.join(dir, name);
    if (fs.existsSync(envPath) && fs.statSync(envPath).isFile()) {
      try {
        if (typeof process.loadEnvFile === 'function') {
          process.loadEnvFile(envPath);
          console.log(`[EnvLoader] Loaded environment from: ${envPath}`);
          loaded = true;
          break;
        }
      } catch (e) {
        console.error(`[EnvLoader] Error loading ${envPath}:`, e);
      }
    }
  }
  if (loaded) break;
}
