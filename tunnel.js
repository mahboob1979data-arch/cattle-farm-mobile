const localtunnel = require('localtunnel');

(async () => {
  try {
    console.log('Starting localtunnel on port 5000...');
    const tunnel = await localtunnel({ 
      port: 5000
    });

    console.log('Tunnel successfully opened at:', tunnel.url);
    const fs = require('fs');
    fs.writeFileSync('tunnel_url.txt', tunnel.url);

    tunnel.on('close', () => {
      console.log('Tunnel was closed! Exiting process so it can be restarted.');
      process.exit(1);
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err);
      process.exit(1);
    });

    // Keep process alive indefinitely
    setInterval(() => {}, 1000);
  } catch (err) {
    console.error('Failed to open tunnel:', err);
    process.exit(1);
  }
})();
