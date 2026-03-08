// cleanup-modals.js
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, 'src'); // adjust if needed
const filesToDelete = [
  'components/modals/CreateEventModal.jsx',
  'components/modals/TimeSelectModal.jsx',
];

// Step 1: Delete legacy modal files
filesToDelete.forEach((file) => {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`🗑️ Deleted: ${filePath}`);
  }
});

// Step 2: Regex patterns to clean code
const patterns = [
  // import lines
  { regex: /import\s+.*(CreateEventModal|TimeSelectModal).*;?\n?/g, replacement: '' },

  // JSX usage (self-closing + wrapped)
  { regex: /<\s*(CreateEventModal|TimeSelectModal)[^>]*>(.*?)<\/\s*\1\s*>/gs, replacement: '' },
  { regex: /<\s*(CreateEventModal|TimeSelectModal)[^>]*\/>/g, replacement: '' },

  // useState hooks + showModal flags
  {
    regex: /const\s*\[[^\]]*(CreateEvent|TimeSelect)[^\]]*\]\s*=\s*useState\(.*?\);\n?/g,
    replacement: '',
  },
  { regex: /show(CreateEvent|TimeSelect)Modal/g, replacement: '' },

  // window event listeners
  {
    regex: /window\.addEventListener\(["']calendar-(time-picked|create-event)["'].*\);\n?/g,
    replacement: '',
  },
];

// Step 3: Recursively process .js/.jsx files
function walkDir(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (/\.(jsx?|tsx?)$/.test(file)) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      let original = content;
      patterns.forEach(({ regex, replacement }) => {
        content = content.replace(regex, replacement);
      });
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`✂️ Cleaned: ${fullPath}`);
      }
    }
  });
}

walkDir(projectRoot);
console.log('✅ Cleanup complete!');

// ▶️ How to run
// Save this file as cleanup-modals.js in your project root.
// Run it with:
//   node cleanup-modals.js
