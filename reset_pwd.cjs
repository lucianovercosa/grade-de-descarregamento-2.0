const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('data/local.db');

async function reset() {
  const hash = await bcrypt.hash('123456', 10);
  db.run("UPDATE users SET password = ? WHERE email = 'admin@local.com'", [hash], function(err) {
    if (err) console.error(err);
    else console.log("Password reset successfully. Rows affected:", this.changes);
  });
}

reset();
