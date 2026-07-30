const { spawn } = require('child_process');
const fs = require('fs');

console.log('Starting Pinggy SSH tunnel over port 443...');

const ssh = spawn('ssh', [
  '-tt',
  '-p', '443',
  '-o', 'StrictHostKeyChecking=no',
  '-R', '80:localhost:5000',
  'a.pinggy.io'
]);

ssh.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('STDOUT:', output);
  
  // Look for http:// or https:// in the output
  const urls = output.match(/https?:\/\/[^\s]+/g);
  if (urls && urls.length > 0) {
    const cleanUrl = urls[0].trim().replace(/\u001b\[[0-9;]*m/g, ''); // strip any ansi colors
    console.log('Found URL:', cleanUrl);
    fs.writeFileSync('tunnel_url.txt', cleanUrl);
  }
});

ssh.stderr.on('data', (data) => {
  console.error('STDERR:', data.toString());
});

ssh.on('close', (code) => {
  console.log(`SSH process exited with code ${code}`);
});

// Keep alive
setInterval(() => {}, 1000);
