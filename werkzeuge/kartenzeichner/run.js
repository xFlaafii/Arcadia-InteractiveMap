const { chromium } = require("playwright");
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => console.log('LOG', m.text()));
  await p.goto('http://127.0.0.1:8765/render.html');
  const url = await p.evaluate(() => window.render());
  fs.writeFileSync('out.jpg', Buffer.from(url.split(',')[1], 'base64'));
  await b.close();
})();
