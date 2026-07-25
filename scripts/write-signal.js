const fs = require('fs');
const path = require('path');
const signalName = process.argv[2];
if (!signalName) {
  console.error('Usage: node write-signal.js <signal-name>');
  process.exit(1);
}
const signalPath = path.resolve(__dirname, '..', 'code', signalName);
fs.writeFileSync(signalPath, 'run', 'utf8');
console.log(`Signal file written: ${signalPath}`);
