const path = require('path');

const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(' --file ')}`;

module.exports = {
  // TypeScript and JavaScript files
  '*.{js,jsx,ts,tsx}': [buildEslintCommand, 'prettier --write'],

  // JSON, CSS, and Markdown files
  '*.{json,css,md}': ['prettier --write'],

  // Type checking
  '*.{ts,tsx}': () => 'tsc --noEmit',
};

