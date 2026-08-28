import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const sourceImage = resolve(root, 'assets/src/reading-coordinate.png');
const publicImages = resolve(root, 'site/public/images');
mkdirSync(publicImages, { recursive: true });

const iconSource = resolve(root, 'public/icon.svg');
const iconDir = resolve(root, 'public/icon');
mkdirSync(iconDir, { recursive: true });

await Promise.all([
  sharp(sourceImage).resize({ width: 800 }).avif({ quality: 48 }).toFile(resolve(publicImages, 'reading-coordinate-800.avif')),
  sharp(sourceImage).resize({ width: 1400 }).avif({ quality: 52 }).toFile(resolve(publicImages, 'reading-coordinate-1400.avif')),
  ...[16, 32, 48, 128].map((size) => sharp(iconSource).resize(size, size).png().toFile(resolve(iconDir, `${size}.png`)))
]);

const dist = resolve(root, 'dist');
rmSync(dist, { recursive: true, force: true });
execFileSync('npx', ['wxt', 'build'], { cwd: root, stdio: 'inherit' });
execFileSync('npx', ['vite', 'build', '--config', 'site/vite.config.ts'], { cwd: root, stdio: 'inherit' });

const siteOutput = resolve(dist, 'site');
const cacheWorker = resolve(siteOutput, 'sw.js');
const workerSource = readFileSync(cacheWorker, 'utf8');
if (!workerSource.includes('__BUILD_VERSION__')) throw new Error('Service worker cache-version token is missing.');
const fileHash = createHash('sha256');
function hashOutput(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) hashOutput(path);
    else if (statSync(path).isFile() && path !== cacheWorker) {
      fileHash.update(relative(siteOutput, path));
      fileHash.update(readFileSync(path));
    }
  }
}
hashOutput(siteOutput);
const buildVersion = fileHash.digest('hex').slice(0, 12);
writeFileSync(cacheWorker, workerSource.replace('__BUILD_VERSION__', buildVersion));

const downloads = resolve(root, 'dist/site/downloads');
mkdirSync(downloads, { recursive: true });
const zipPath = resolve(downloads, 'reading-resume-chrome.zip');
if (existsSync(zipPath)) rmSync(zipPath);
execFileSync('zip', ['-qr', zipPath, '.'], { cwd: resolve(root, 'dist/extension/chrome-mv3') });
const archiveContents = execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' }).split(/\r?\n/);
if (!archiveContents.includes('manifest.json')) throw new Error('Packaged extension ZIP does not contain manifest.json at its root.');
console.log(`Packaged extension: ${zipPath}`);
