/**
 * Performs actions that happen after `npm install`, including:
 *
 *  - creating a symlink to the CLI.
 */

const assert = require("assert");
const fs = require('fs');
const package = require("../package.json");
const path = require('path');

// Assuming this is in ROOT/libexec:
let bindir = path.resolve(path.join(__dirname, "..", "node_modules", ".bin"));

let packageName = package.name;
let mainPackageBinName = packageName.toLowerCase();

let rawRelativePathToBin = package.bin[mainPackageBinName];

assert(rawRelativePathToBin);

let relativePathToBin = path.join(...rawRelativePathToBin.split(path.posix.sep))
assert(relativePathToBin);

let absolutePathToBin = path.resolve(relativePathToBin);

let symlinkValue = path.relative(bindir, absolutePathToBin);
assert(symlinkValue.includes(".."));

let symlinkPath = path.join(bindir, packageName);

console.log(`creating symlink: ${symlinkPath} -> ${symlinkValue} (${absolutePathToBin})`);

try {
  fs.unlinkSync(symlinkPath);
} catch (error) {
  // Ignore trying to delete a file that doesn't exist
  if (error.code !== 'ENOENT') {
    throw error;
  }
}

fs.symlinkSync(symlinkValue, symlinkPath);
