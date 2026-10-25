const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function testSimpleCdp() {
  const port = 9555;
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

  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  };

  function sendCdp(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCdp('Page.enable');
  await sendCdp('Runtime.enable');
  await sendCdp('DOM.enable');

  const widths = [320, 360, 375, 390, 414, 768];
  const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
  await sendCdp('Emulation.setUserAgentOverride', { userAgent });

  for (const w of widths) {
    console.log(`Auditing /login at ${w}px...`);
    await sendCdp('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: 800,
      deviceScaleFactor: 2,
      mobile: true,
      screenWidth: w,
      screenHeight: 800
    });
    await sendCdp('Page.reload');
    await new Promise(r => setTimeout(r, 1200));

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
            cls: (typeof e.className === 'string' ? e.className : '').slice(0, 50),
            right: Math.round(e.getBoundingClientRect().right),
            overflowPx: Math.round(e.getBoundingClientRect().right - docWidth),
            text: (e.textContent || '').trim().slice(0, 30)
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

    console.log(`Width ${w}px result: count=${evalRes.result.value.count}, scrollWidth=${evalRes.result.value.scrollWidth}, docWidth=${evalRes.result.value.docWidth}`);
    if (evalRes.result.value.count > 0) {
      console.log('Sample overflowing elements:', evalRes.result.value.overflowing.slice(0, 3));
    }
  }

  ws.close();
  chromeProc.kill();
  console.log('CDP multi-width audit completed successfully!');
}

testSimpleCdp().catch(console.error);
