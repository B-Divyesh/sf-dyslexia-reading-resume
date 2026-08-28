import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
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

const downloads = resolve(root, 'dist/site/downloads');
mkdirSync(downloads, { recursive: true });
const zipPath = resolve(downloads, 'reading-resume-chrome.zip');
if (existsSync(zipPath)) rmSync(zipPath);
execFileSync('zip', ['-qr', zipPath, '.'], { cwd: resolve(root, 'dist/extension/chrome-mv3') });
console.log(`Packaged extension: ${zipPath}`);
