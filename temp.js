import fs from 'fs';
import path from 'path';

(function main() {
  //read the file temp.txt

  const fileContents = fs.readFileSync('./temp.txt', 'utf8');

  const minified = minimizeDiff(fileContents);

  console.log(minified);
})();

function minimizeDiff(diffContent) {
  const lines = diffContent.split('\n');
  const allowedExtensions = /\.(js|ts|jsx|tsx|svelte|css|html)\b/;
  let result = '';
  let isDeletingFile = false;
  let includeFile = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if the line starts a new file diff
    if (line.startsWith('diff --git')) {
      // Check if the file has an allowed extension
      includeFile = allowedExtensions.test(line);
      isDeletingFile = false;

      if (includeFile) {
        result += line + '\n';
      }
    } else if (includeFile) {
      // Check for file deletion header
      if (line.startsWith('deleted file')) {
        isDeletingFile = true;
        result += line + '\n';
      }

      // If not deleting, include lines until the next file diff
      if (!isDeletingFile && !lines[i + 1]?.startsWith('diff --git')) {
        result += line + '\n';
      }
    }
  }

  return result;
}
