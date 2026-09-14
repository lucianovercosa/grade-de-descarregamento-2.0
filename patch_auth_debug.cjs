const fs = require('fs');
let code = fs.readFileSync('src/AuthContext.tsx', 'utf8');

if (!code.includes('console.log("Auth State Changed:", fbUser);')) {
    code = code.replace(
        "const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {",
        "const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {\n      console.log(\"Auth State Changed:\", fbUser);"
    );
    code = code.replace(
        "if (userDoc.exists()) {",
        "console.log(\"User doc exists?\", userDoc.exists(), userDoc.data && userDoc.data());\n          if (userDoc.exists()) {"
    );
    code = code.replace(
        "setUser({",
        "console.log(\"Setting user state...\");\n            setUser({"
    );
    fs.writeFileSync('src/AuthContext.tsx', code);
    console.log('patched AuthContext for debugging');
}
