const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function testCleanCdp() {
  const port = 9333;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(process.env.TEMP || 'C:\\temp', `chrome-cdp-${Date.now()}`);
  
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    'http://localhost:3000/login'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 400));
    try {
      const data = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${port}/json/list`, (res) => {
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
    return new Promise((resolve, reject) => {
      const id = msgId++;
      const timeout = setTimeout(() => reject(new Error(`Timeout on ${method}`)), 10000);
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          clearTimeout(timeout);
          ws.removeEventListener('message', handler);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCdp('Page.enable');
  await sendCdp('Runtime.enable');
  await sendCdp('DOM.enable');

  // Set viewport to 320x568
  await sendCdp('Emulation.setDeviceMetricsOverride', {
    width: 320,
    height: 568,
    deviceScaleFactor: 1,
    mobile: true
  });

  await new Promise(r => setTimeout(r, 1000));

  const evalResult = await sendCdp('Runtime.evaluate', {
    expression: `
      (() => {
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const elements = [...document.querySelectorAll('*')];
        const overflowing = elements.filter(e => {
          const r = e.getBoundingClientRect();
          return r.right > docWidth;
        }).map(e => ({
          tag: e.tagName,
          id: e.id,
          cls: (typeof e.className === 'string' ? e.className : '').slice(0, 50),
          right: Math.round(e.getBoundingClientRect().right),
          docWidth,
          overflow: Math.round(e.getBoundingClientRect().right - docWidth)
        }));
        return { docWidth, scrollWidth, hasHScroll: scrollWidth > docWidth, overflowCount: overflowing.length, sample: overflowing.slice(0, 5) };
      })()
    `,
    returnByValue: true
  });

  console.log('Audit 320px /login:', JSON.stringify(evalResult.result.value, null, 2));

  const ss = await sendCdp('Page.captureScreenshot', { format: 'png' });
  const ssPath = path.join(__dirname, 'test_cdp_320.png');
  fs.writeFileSync(ssPath, Buffer.from(ss.data, 'base64'));
  console.log('Saved screenshot 320px to:', ssPath);

  ws.close();
  chromeProc.kill();
  console.log('Done cleanly!');
}

testCleanCdp().catch(console.error);
