const fs = require('fs');
let code = fs.readFileSync('src/components/Login.tsx', 'utf8');

// 1. Update imports
code = code.replace(
    "import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';",
    "import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';"
);

// 2. Remove handleGoogleLogin
const handleGoogleLoginStart = code.indexOf('const handleGoogleLogin =');
const handleEmailAuthStart = code.indexOf('const handleEmailAuth =');
if (handleGoogleLoginStart !== -1 && handleEmailAuthStart !== -1) {
    code = code.slice(0, handleGoogleLoginStart) + code.slice(handleEmailAuthStart);
}

// 3. Remove "OU" divider and Google button
const dividerStart = code.indexOf('<div className="relative my-6">');
const sectionEnd = code.indexOf('</section>');

if (dividerStart !== -1 && sectionEnd !== -1) {
    // Keep everything up to the divider, and then the closing </div></section> tag
    code = code.slice(0, dividerStart) + '      </div>\n    </section>\n  );\n}';
}

fs.writeFileSync('src/components/Login.tsx', code);
