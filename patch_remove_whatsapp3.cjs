const fs = require('fs');

function fixDash() {
  let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
  
  const badStart = content.indexOf('{whatsappContacts.map((c, i) => (');
  if (badStart !== -1) {
    const startToRemove = content.lastIndexOf('                    {whatsappContacts', badStart);
    const endToRemove = content.indexOf('</button>\n          </div>\n        </div>\n      )}') + '</button>\n          </div>\n        </div>\n      )}'.length;
    
    if (startToRemove !== -1 && endToRemove !== -1) {
      content = content.substring(0, startToRemove) + content.substring(endToRemove);
      fs.writeFileSync('src/components/Dashboard.tsx', content);
      console.log('Dash fixed the rest');
    }
  }
}

fixDash();
