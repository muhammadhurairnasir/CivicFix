const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const mappings = [
  { from: /var\(--brand-emphasis\)/g, to: 'var(--primary-hover)' },
  { from: /var\(--brand-subtle\)/g, to: 'var(--surface)' },
  { from: /var\(--border-subtle\)/g, to: 'var(--border)' },
  { from: /var\(--success-bg\)/g, to: 'var(--surface)' },
  { from: /var\(--navy-[0-9]{3}\)/g, to: 'var(--background)' },
  { from: /var\(--danger-[a-z]+\)/g, to: 'var(--status-critical)' },
  { from: /var\(--warning-[a-z]+\)/g, to: 'var(--status-pending)' },
  { from: /var\(--success-[a-z]+\)/g, to: 'var(--status-resolved)' }
];

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(directoryPath, function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    mappings.forEach(mapping => {
      content = content.replace(mapping.from, mapping.to);
    });
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
