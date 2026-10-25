const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function testScreenshot() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(process.env.TEMP || 'C:\\temp', 'chrome-cdp-ss-test');
  
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--remote-debugging-port=9222',
    `--user-data-dir=${userDataDir}`,
    'http://localhost:3000/login'
  ]);

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

  await sendCdp('Page.enable');
  await sendCdp('Runtime.enable');
  await sendCdp('DOM.enable');

  await sendCdp('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  });

  const ss = await sendCdp('Page.captureScreenshot', { format: 'png' });
  console.log('Screenshot data length:', ss.data.length);

  ws.close();
  chromeProc.kill();
}

testScreenshot().catch(console.error);
