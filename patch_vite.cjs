const fs = require('fs');
let config = fs.readFileSync('vite.config.ts', 'utf8');

config = config.replace(
  "alias: {",
  `alias: [
        { find: /^firebase\\/(.*)/, replacement: path.resolve(__dirname, 'src/lib/firebase-mock.ts') },
        { find: '@', replacement: path.resolve(__dirname, '.') }
      ]
    }, //`
);

// We need to carefully replace alias Object with Array
config = config.replace(/alias:\s*\{[\s\S]*?\}/, `alias: [
        { find: /^firebase\\/(.*)/, replacement: path.resolve(__dirname, 'src/lib/firebase-mock.ts') },
        { find: '@', replacement: path.resolve(__dirname, '.') }
      ]`);

fs.writeFileSync('vite.config.ts', config);
console.log('patched vite config');
