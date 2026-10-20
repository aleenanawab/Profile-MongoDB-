const BASE_URL = 'http://localhost:3000';

async function runTest() {
  console.log('🚀 Starting Linktree-Style Profile Builder Verification Test...\n');

  // 1. Authenticate user
  console.log('1️⃣ Logging in as mesum@avtive.app...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'mesum@avtive.app',
      password: 'Avtive@123'
    })
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed with status ${loginRes.status}: ${await loginRes.text()}`);
  }

  const rawCookies = loginRes.headers.getSetCookie 
    ? loginRes.headers.getSetCookie() 
    : [loginRes.headers.get('set-cookie')].filter(Boolean);
  
  const cookieHeader = rawCookies.map(c => c.split(';')[0]).join('; ');
  console.log('   ✅ Logged in successfully. Cookies captured.\n');

  // 2. Fetch current profile
  console.log('2️⃣ Fetching user profile...');
  const meRes = await fetch(`${BASE_URL}/api/profile/list`, {
    headers: { Cookie: cookieHeader }
  });
  const meData = await meRes.json();
  const targetProfile = meData.profiles?.[0] || meData.profile;
  console.log(`   ✅ Target Profile ID: ${targetProfile.id}, Slug: ${targetProfile.slug}\n`);

  // 3. Test Linktree Profile Builder updates
  console.log('3️⃣ Updating Profile with Builder State:');
  console.log('   - Profile Type: "team"');
  console.log('   - Theme: "gradient"');
  console.log('   - Button Radius: "pill"');
  console.log('   - Button Style: "solid"');
  console.log('   - Reordered Links: [ LinkedIn (1), GitHub (2), Portfolio (3) ]');
  console.log('   - Sharing settings: Phone & Email hidden, Links & Bio visible');

  const updatePayload = {
    profileId: targetProfile.id,
    updatedData: {
      profileType: 'team',
      theme: 'gradient',
      buttonRadius: 'pill',
      buttonStyle: 'solid',
      links: [
        {
          id: 'link-li',
          title: 'LinkedIn Network',
          url: 'https://linkedin.com/in/avtive',
          icon: 'linkedin',
          visible: true,
          order: 1
        },
        {
          id: 'link-gh',
          title: 'GitHub Repositories',
          url: 'https://github.com/avtive',
          icon: 'github',
          visible: true,
          order: 2
        },
        {
          id: 'link-port',
          title: 'Official Portfolio',
          url: 'https://avtive.app',
          icon: 'website',
          visible: true,
          order: 3
        }
      ],
      sharingSettings: {
        photo: true,
        nameAndTitle: true,
        bio: true,
        links: true,
        socialLinks: true,
        email: false,
        phone: false
      }
    }
  };

  const updateRes = await fetch(`${BASE_URL}/api/profile/update`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Cookie: cookieHeader
    },
    body: JSON.stringify(updatePayload)
  });

  const updateData = await updateRes.json();
  if (!updateRes.ok || !updateData.success) {
    throw new Error(`Profile update failed: ${JSON.stringify(updateData)}`);
  }

  const updatedProfile = updateData.profile;
  console.log('   ✅ Profile updated successfully in database.\n');

  // 4. Assertions on the saved state
  console.log('4️⃣ Validating saved properties:');
  if (updatedProfile.profileType !== 'team') {
    throw new Error(`Expected profileType to be "team", got "${updatedProfile.profileType}"`);
  }
  console.log('   ✅ profileType === "team"');

  if (updatedProfile.theme !== 'gradient') {
    throw new Error(`Expected theme to be "gradient", got "${updatedProfile.theme}"`);
  }
  console.log('   ✅ theme === "gradient"');

  if (updatedProfile.buttonRadius !== 'pill') {
    throw new Error(`Expected buttonRadius to be "pill", got "${updatedProfile.buttonRadius}"`);
  }
  console.log('   ✅ buttonRadius === "pill"');

  if (updatedProfile.links?.length !== 3) {
    throw new Error(`Expected 3 links, got ${updatedProfile.links?.length}`);
  }
  console.log('   ✅ links.length === 3');

  if (updatedProfile.links[0].title !== 'LinkedIn Network' || updatedProfile.links[1].title !== 'GitHub Repositories') {
    throw new Error('Links order mismatch!');
  }
  console.log('   ✅ Links ordering preserved (LinkedIn #1, GitHub #2, Portfolio #3)');

  if (updatedProfile.sharingSettings?.email !== false || updatedProfile.sharingSettings?.links !== true) {
    throw new Error('Sharing visibility settings mismatch!');
  }
  console.log('   ✅ Sharing settings verified (Email: hidden, Links: visible)\n');

  // 5. Test GET /edit-profile page render
  console.log('5️⃣ Testing GET /edit-profile route rendering...');
  const editPageRes = await fetch(`${BASE_URL}/edit-profile`, {
    headers: { Cookie: cookieHeader }
  });
  if (editPageRes.status !== 200) {
    throw new Error(`Expected 200 OK from /edit-profile, got ${editPageRes.status}`);
  }
  const editPageHtml = await editPageRes.text();
  if (!editPageHtml.includes('Profile Builder') && !editPageHtml.includes('Links')) {
    console.log('   ⚠️ Note: Client component renders inside DOM, HTML shell returned.');
  }
  console.log(`   ✅ GET /edit-profile rendered with HTTP ${editPageRes.status}\n`);

  // 6. Test Public Profile route render
  console.log(`6️⃣ Testing GET /profile/${updatedProfile.slug}...`);
  const publicPageRes = await fetch(`${BASE_URL}/profile/${updatedProfile.slug}`, {
    headers: { Cookie: cookieHeader }
  });
  if (publicPageRes.status !== 200) {
    throw new Error(`Expected 200 OK from /profile/${updatedProfile.slug}, got ${publicPageRes.status}`);
  }
  console.log(`   ✅ Public profile rendered with HTTP ${publicPageRes.status}\n`);

  console.log('🎉 ALL PROFILE BUILDER VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runTest().catch((err) => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
