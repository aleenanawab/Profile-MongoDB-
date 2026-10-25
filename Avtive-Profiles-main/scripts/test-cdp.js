const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function testCdp() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(process.env.TEMP || 'C:\\temp', 'chrome-cdp-test');
  
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--remote-debugging-port=9222',
    `--user-data-dir=${userDataDir}`,
    'http://localhost:3000/login'
  ]);

  // Wait for CDP to be ready
  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const data = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9222/json/list', (res) => {
          let str = '';
          res.on('data', d => str += d);
          res.on('end', () => resolve(str));
        }).on('error', reject);
      });
      const pages = JSON.parse(data);
      if (pages.length > 0 && pages[0].webSocketDebuggerUrl) {
        wsUrl = pages[0].webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    chromeProc.kill();
    throw new Error('CDP failed to initialize');
  }

  console.log('Connected to CDP at:', wsUrl);

  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  let msgId = 1;
  function sendCdp(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  // Set viewport to 390x844
  await sendCdp('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  });

  // Evaluate the user's exact expression
  const evalResult = await sendCdp('Runtime.evaluate', {
    expression: `
      (() => {
        const docWidth = document.documentElement.clientWidth;
        const overflowElements = [...document.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > docWidth);
        return overflowElements.map(e => ({
          tagName: e.tagName,
          id: e.id,
          className: (typeof e.className === 'string' ? e.className : ''),
          right: Math.round(e.getBoundingClientRect().right),
          clientWidth: docWidth,
          overflowPx: Math.round(e.getBoundingClientRect().right - docWidth),
          textSnippet: (e.textContent || '').trim().slice(0, 40)
        }));
      })()
    `,
    returnByValue: true
  });

  console.log('Overflow Elements at 390px on /login:', JSON.stringify(evalResult.result.value, null, 2));

  // Take screenshot
  const screenshotRes = await sendCdp('Page.captureScreenshot', { format: 'png' });
  const outPath = path.join(__dirname, 'cdp_test_login_390.png');
  fs.writeFileSync(outPath, Buffer.from(screenshotRes.data, 'base64'));
  console.log('Saved screenshot to:', outPath);

  ws.close();
  chromeProc.kill();
}

testCdp().catch(console.error);
