const fs = require('fs');
let content = fs.readFileSync('src/components/VehicleForm.tsx', 'utf8');

const target = `          const options = {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1200,
            useWebWorker: true
          };`;
const replacement = `          const options = {
            maxSizeMB: 0.1,
            maxWidthOrHeight: 800,
            useWebWorker: true
          };`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/VehicleForm.tsx', content);
  console.log('Success Compression');
} else {
  console.log('Target not found Compression');
}
