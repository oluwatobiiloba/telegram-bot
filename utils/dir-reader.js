const fs = require('fs');
const path = require('path');
const items = {};

function reader(dirname, baseFile, isRecursive, format) {
  try {
    const filenames = fs.readdirSync(dirname);

    for (let filename of filenames) {
      const fullPath = path.join(dirname, filename);

      if (isRecursive) {
        const fileStat = fs.statSync(fullPath);

        if (fileStat.isDirectory()) {
          reader(fullPath, filename, isRecursive, format);
          continue;
        }
      }

      if (/\.js$/.test(filename) && filename !== baseFile) {
        let content = require(fullPath);

        if (format) {
          content = format(content);
        }

        const key = filename.replace(/([^a-z0-9])|(js)/gim, '').toLowerCase();
        items[key] = content;
      }
    }

    return items;
  } catch (e) {}

  return items;
}

module.exports = (dirname, baseFile, recursive, format) => {
  if (!dirname || !baseFile) throw new Error('Directory name and base file is required');

  const baseFilename = path.basename(baseFile) || 'index.js';

  return reader(dirname, baseFilename, recursive, format);
};
