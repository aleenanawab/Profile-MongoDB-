const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function testNavigateCdp() {
  const port = 9444;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(process.env.TEMP || 'C:\\temp', `chrome-cdp-${Date.now()}`);
  
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 300));
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

  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  let msgId = 1;
  const pending = new Map();
  const eventListeners = [];

  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
    for (const listener of eventListeners) {
      listener(msg);
    }
  };

  function sendCdp(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  function waitForEvent(eventName, timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${eventName}`)), timeoutMs);
      const listener = (msg) => {
        if (msg.method === eventName) {
          clearTimeout(timer);
          const idx = eventListeners.indexOf(listener);
          if (idx !== -1) eventListeners.splice(idx, 1);
          resolve(msg.params);
        }
      };
      eventListeners.push(listener);
    });
  }

  await sendCdp('Page.enable');
  await sendCdp('Runtime.enable');
  await sendCdp('DOM.enable');

  const widths = [320, 360, 375, 390, 414, 768];
  for (const w of widths) {
    console.log(`\nTesting width: ${w}px...`);
    await sendCdp('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: 800,
      deviceScaleFactor: 1,
      mobile: true
    });

    const loadPromise = waitForEvent('Page.loadEventFired', 8000);
    await sendCdp('Page.navigate', { url: 'http://localhost:3000/login' });
    await loadPromise;
    await new Promise(r => setTimeout(r, 600)); // wait for layout/render

    const evalRes = await sendCdp('Runtime.evaluate', {
      expression: `
        (() => {
          const docWidth = document.documentElement.clientWidth;
          const scrollWidth = document.documentElement.scrollWidth;
          const overflowing = [...document.querySelectorAll('*')].filter(e => {
            const r = e.getBoundingClientRect();
            return r.right > docWidth;
          }).map(e => ({
            tag: e.tagName,
            id: e.id,
            cls: (typeof e.className === 'string' ? e.className : '').slice(0, 60),
            right: Math.round(e.getBoundingClientRect().right),
            overflowPx: Math.round(e.getBoundingClientRect().right - docWidth)
          }));
          return {
            docWidth,
            scrollWidth,
            hasHScroll: scrollWidth > docWidth,
            count: overflowing.length,
            overflowing
          };
        })()
      `,
      returnByValue: true
    });

    console.log(`Result at ${w}px:`, JSON.stringify(evalRes.value, null, 2));

    const ss = await sendCdp('Page.captureScreenshot', { format: 'png' });
    const ssFile = path.join(__dirname, `login_before_${w}px.png`);
    fs.writeFileSync(ssFile, Buffer.from(ss.data, 'base64'));
    console.log(`Captured screenshot: ${ssFile}`);
  }

  ws.close();
  chromeProc.kill();
  console.log('\nAll widths audited for /login successfully!');
}

testNavigateCdp().catch(console.error);
