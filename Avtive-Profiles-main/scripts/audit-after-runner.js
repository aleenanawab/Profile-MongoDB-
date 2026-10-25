const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure artifacts screenshot directory exists
const ARTIFACTS_DIR = 'C:\\Users\\PMLS\\.gemini\\antigravity-ide\\brain\\97e7dd29-4f65-4916-a883-a10c8126d196\\audit_after_screenshots';
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json
        });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runAudit() {
  console.log('================================================================');
  console.log('       RESPONSIVE AUDIT (AFTER): MULTI-VIEWPORT VERIFICATION     ');
  console.log('================================================================\n');

  // Step 1: Login to get session cookie
  console.log('--- Step 1: Authenticating test account for protected pages ---');
  const loginRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'test_investigate_123@example.com',
    password: 'Password123!'
  });

  const setCookieHeaders = loginRes.headers['set-cookie'] || [];
  console.log('Cookies received:', setCookieHeaders.length);

  // Parse cookies into name/value pairs for CDP
  const cookiesToSet = [];
  for (const c of setCookieHeaders) {
    const parts = c.split(';')[0].split('=');
    if (parts.length >= 2) {
      cookiesToSet.push({
        name: parts[0].trim(),
        value: parts.slice(1).join('=').trim(),
        domain: 'localhost',
        path: '/'
      });
    }
  }

  // Step 2: Spawn Chrome with CDP
  const port = 9877;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(process.env.TEMP || 'C:\\temp', `chrome-audit-after-${Date.now()}`);

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 300));
    try {
      const data = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${port}/json/list`, res => {
          let str = '';
          res.on('data', d => str += d);
          res.on('end', () => resolve(str));
        }).on('error', reject);
      });
      const pages = JSON.parse(data);
      const pageTarget = pages.find(p => p.type === 'page');
      if (pageTarget && pageTarget.webSocketDebuggerUrl) {
        wsUrl = pageTarget.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    chromeProc.kill();
    throw new Error('Failed to connect to Chrome CDP');
  }

  console.log('Connected to Chrome CDP page target');

  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  let msgId = 1;
  const pending = new Map();
  ws.onmessage = evt => {
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
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`CDP method ${method} timed out`));
      }, 15000);
      pending.set(id, {
        resolve: res => { clearTimeout(timer); resolve(res); },
        reject: err => { clearTimeout(timer); reject(err); }
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCdp('Page.enable');
  await sendCdp('Runtime.enable');
  await sendCdp('DOM.enable');
  await sendCdp('Network.enable');

  // The pages to audit per the user's specification
  const pagesToAudit = [
    { name: 'Register', path: '/register', requiresAuth: false },
    { name: 'Login', path: '/login', requiresAuth: false },
    { name: 'Role Selection', path: '/onboarding/role', requiresAuth: true },
    { name: 'Theme Selection', path: '/onboarding/theme', requiresAuth: true },
    { name: 'Create Profile', path: '/create-profile', requiresAuth: true },
    { name: 'Dashboard', path: '/dashboard', requiresAuth: true },
    { name: 'Profile View', path: '/profile/test-mobile-user', requiresAuth: true },
    { name: 'Profile Edit', path: '/profile/test-mobile-user/edit', requiresAuth: true },
    { name: 'Share & Visibility', path: '/profile/test-mobile-user/share', requiresAuth: true },
    { name: 'Company Invite', path: '/company/invite', requiresAuth: true }
  ];

  const viewports = [320, 360, 375, 390, 414, 768];
  const auditReport = {};

  for (const page of pagesToAudit) {
    console.log(`\n========================================================`);
    console.log(`Auditing Page: ${page.name} (${page.path})`);
    console.log(`========================================================`);
    auditReport[page.name] = {
      path: page.path,
      viewports: {}
    };

    // Clear or inject cookies depending on auth requirement
    if (page.requiresAuth) {
      for (const cookie of cookiesToSet) {
        await sendCdp('Network.setCookie', cookie);
      }
    } else {
      await sendCdp('Network.clearBrowserCookies');
    }

    for (const width of viewports) {
      const height = width === 320 ? 568 : (width === 360 ? 640 : (width === 375 ? 667 : (width === 390 ? 844 : (width === 414 ? 896 : 1024))));
      
      // 1. Set viewport
      await sendCdp('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 2,
        mobile: width < 768,
        screenWidth: width,
        screenHeight: height
      });

      // 2. Navigate to page
      const targetUrl = `http://localhost:3000${page.path}`;
      await sendCdp('Page.navigate', { url: targetUrl });

      // 3. Wait for hydration & layout stability
      await new Promise(r => setTimeout(r, 1500));

      // 4. Run the user's EXACT querySelectorAll overflow filter snippet
      const overflowResult = await sendCdp('Runtime.evaluate', {
        expression: `
          (() => {
            const docWidth = document.documentElement.clientWidth;
            const scrollWidth = document.documentElement.scrollWidth;
            const hasHScroll = scrollWidth > docWidth;

            // Exact expression requested by user:
            const allElements = [...document.querySelectorAll('*')];
            const rawOverflowing = allElements.filter(e => e.getBoundingClientRect().right > docWidth);

            const details = rawOverflowing.map(e => {
              const r = e.getBoundingClientRect();
              const style = window.getComputedStyle(e);
              return {
                tag: e.tagName.toLowerCase(),
                id: e.id || null,
                className: (typeof e.className === 'string' ? e.className : '').trim(),
                right: Math.round(r.right),
                width: Math.round(r.width),
                clientWidth: docWidth,
                overflowPx: Math.round(r.right - docWidth),
                textSnippet: (e.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 40),
                cssWidth: style.width,
                cssMaxWidth: style.maxWidth,
                cssPosition: style.position,
                cssOverflow: style.overflow
              };
            });

            // Tap target audit (< 44x44px)
            const clickableElements = [...document.querySelectorAll('button, a, input[type=\"submit\"], input[type=\"button\"]')];
            const smallTapTargets = clickableElements.filter(el => {
              const r = el.getBoundingClientRect();
              return (r.width > 0 && r.height > 0) && (r.width < 44 || r.height < 44);
            }).map(el => ({
              tag: el.tagName.toLowerCase(),
              text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30),
              width: Math.round(el.getBoundingClientRect().width),
              height: Math.round(el.getBoundingClientRect().height)
            }));

            // Input font size audit (< 16px causes iOS zoom)
            const inputs = [...document.querySelectorAll('input, select, textarea')];
            const smallFontInputs = inputs.filter(inp => {
              const fs = parseFloat(window.getComputedStyle(inp).fontSize);
              return fs < 16;
            }).map(inp => ({
              type: inp.getAttribute('type') || inp.tagName.toLowerCase(),
              placeholder: inp.getAttribute('placeholder') || null,
              name: inp.getAttribute('name') || null,
              fontSize: window.getComputedStyle(inp).fontSize
            }));

            return {
              docWidth,
              scrollWidth,
              hasHScroll,
              overflowCount: rawOverflowing.length,
              elements: details,
              smallTapTargetCount: smallTapTargets.length,
              smallTapTargets: smallTapTargets.slice(0, 6),
              smallFontInputCount: smallFontInputs.length,
              smallFontInputs: smallFontInputs.slice(0, 6)
            };
          })()
        `,
        returnByValue: true
      });

      const data = overflowResult.result.value;

      // 5. Take screenshot
      const ssRes = await sendCdp('Page.captureScreenshot', { format: 'png' });
      const safePageName = page.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const ssFileName = `${safePageName}_${width}px.png`;
      const ssPath = path.join(ARTIFACTS_DIR, ssFileName);
      fs.writeFileSync(ssPath, Buffer.from(ssRes.data, 'base64'));

      console.log(`[${page.name} @ ${width}px] clientWidth=${data.docWidth}, scrollWidth=${data.scrollWidth}, hasHScroll=${data.hasHScroll}, overflowElements=${data.overflowCount}, smallTapTargets=${data.smallTapTargetCount}, smallFontInputs=${data.smallFontInputCount}`);
      if (data.overflowCount > 0) {
        console.log(`  -> Top overflowing element: <${data.elements[0].tag}> class="${data.elements[0].className}" overflowPx=${data.elements[0].overflowPx}`);
      }

      auditReport[page.name].viewports[`${width}px`] = {
        docWidth: data.docWidth,
        scrollWidth: data.scrollWidth,
        hasHorizontalScroll: data.hasHScroll,
        overflowElementsCount: data.overflowCount,
        overflowingElements: data.elements,
        smallTapTargetCount: data.smallTapTargetCount,
        smallTapTargets: data.smallTapTargets,
        smallFontInputCount: data.smallFontInputCount,
        smallFontInputs: data.smallFontInputs,
        screenshot: ssFileName,
        screenshotAbsPath: ssPath
      };
    }
  }

  ws.close();
  chromeProc.kill();

  const reportJsonPath = path.join(ARTIFACTS_DIR, 'audit_after_data.json');
  fs.writeFileSync(reportJsonPath, JSON.stringify(auditReport, null, 2));
  console.log(`\nAudit raw data saved to: ${reportJsonPath}`);
  console.log('AFTER AUDIT COMPLETED ACROSS ALL PAGES AND VIEWPORTS.');
}

runAudit().catch(err => {
  console.error('Audit runner error:', err);
  process.exit(1);
});
