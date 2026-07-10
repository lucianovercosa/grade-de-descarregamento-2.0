const fs = require('fs');

function removeBlock(content, startStr, endStr) {
  const startIdx = content.indexOf(startStr);
  if (startIdx === -1) return content;
  const endIdx = content.indexOf(endStr, startIdx);
  if (endIdx === -1) return content;
  return content.slice(0, startIdx) + content.slice(endIdx + endStr.length);
}

function patchDash() {
  let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
  content = removeBlock(content, '{alertVehicle && (', '      )}'); // This might remove something else if not careful
  const fix = content.indexOf('{alertVehicle && (');
  if (fix !== -1) {
    const start = fix;
    const end = content.indexOf('</div>\n        </div>\n      )}', start) + '</div>\n        </div>\n      )}'.length;
    content = content.substring(0, start) + content.substring(end);
  }
  
  content = content.replace(/const \[alertVehicle\, setAlertVehicle\] \= useState\<Vehicle \| null\>\(null\)\;/g, '');
  content = content.replace(/setAlertVehicle\(\{ \.\.\.updatedVehicle\, progress_status\: nextStatus \}\)\;/g, '');
  fs.writeFileSync('src/components/Dashboard.tsx', content);
  console.log('Dash patched 2');
}

function patchForm() {
  let content = fs.readFileSync('src/components/VehicleForm.tsx', 'utf8');
  const fix = content.indexOf('if (alertVehicle) {');
  if (fix !== -1) {
    const start = fix;
    const end = content.indexOf('    );\n  }', start) + '    );\n  }'.length;
    content = content.substring(0, start) + content.substring(end);
  }
  
  content = content.replace(/const \[alertVehicle\, setAlertVehicle\] \= useState\<Vehicle \| null\>\(null\)\;/g, '');
  content = content.replace(/setAlertVehicle\(dataToSave as Vehicle\)\;/g, '');
  fs.writeFileSync('src/components/VehicleForm.tsx', content);
  console.log('Form patched 2');
}

patchDash();
patchForm();
