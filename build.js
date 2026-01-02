/**
 * Build script for optimization
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Minify CSS
execSync('npx css-minify -f css/styles.css -o dist/css');
execSync('npx css-minify -f css/loader.css -o dist/css');

// Optimize images (requires imagemin-cli)
execSync('npx imagemin images/* --out-dir=dist/images');

// Bundle JS (if you decide to use a bundler)
execSync('npx esbuild js/*.js --bundle --minify --outdir=dist/js');
