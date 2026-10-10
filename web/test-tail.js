const fs = require('fs');
const logPath = '.hermes-backend/logs/agent.log';
let currSize = fs.statSync(logPath).size;
console.log("Watching...");
const watcher = fs.watch(logPath, (eventType) => {
  if (eventType === 'change') {
    const stat = fs.statSync(logPath);
    if (stat.size > currSize) {
      const buffer = Buffer.alloc(stat.size - currSize);
      const fd = fs.openSync(logPath, 'r');
      fs.readSync(fd, buffer, 0, buffer.length, currSize);
      fs.closeSync(fd);
      currSize = stat.size;
      console.log("NEW TEXT:", buffer.toString().trim());
    }
  }
});
setTimeout(() => watcher.close(), 1000);
