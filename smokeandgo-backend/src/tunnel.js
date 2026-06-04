import localtunnel from 'localtunnel';

async function start() {
  try {
    const t1 = await localtunnel({ port: 3000 });
    console.log('LT_BACKEND_URL=' + t1.url);
    t1.on('close', () => process.exit(0));

    const t2 = await localtunnel({ port: 4000 });
    console.log('LT_RECEIVER_URL=' + t2.url);
    t2.on('close', () => process.exit(0));

    // Keep process running
    process.stdin.resume();
  } catch (e) {
    console.error('tunnel error', e);
    process.exit(1);
  }
}

start();
