const fs = require('fs');
let content = fs.readFileSync('src/components/PublicStatus.tsx', 'utf8');
if (!content.includes('import React')) {
  content = content.replace('import { useEffect, useState }', 'import React, { useEffect, useState }');
  fs.writeFileSync('src/components/PublicStatus.tsx', content);
}
console.log('Fixed React');
