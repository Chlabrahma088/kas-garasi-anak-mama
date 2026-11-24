const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const galleryMap = require('./gallery_map.json');

// Supabase credentials
const supabaseUrl = 'https://aypoinzmnxcjnmpkwfvc.supabase.co';
const supabaseKey = 'sb_publishable_mAY8TwWd_KGpojU1Ke7QLQ_aow5BQgl';
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateMockData() {
  console.log('Updating src/lib/mockData.ts...');
  let mockFile = fs.readFileSync('src/lib/mockData.ts', 'utf8');

  for (const [unitId, photos] of Object.entries(galleryMap)) {
    const unitRegex = new RegExp(`(id:\\s*'${unitId}'[\\s\\S]*?photoUrl:\\s*['"][^'"]+['"],)`, 'm');
    const match = mockFile.match(unitRegex);
    if (match) {
      const originalBlock = match[1];
      const photosJson = JSON.stringify(photos, null, 4).replace(/\n/g, '\n    ');
      const updatedBlock = `${originalBlock}\n    galleryUrls: ${photosJson},`;
      mockFile = mockFile.replace(originalBlock, updatedBlock);
      console.log(`  Added galleryUrls to ${unitId} in mockData.ts`);
    } else {
      console.warn(`  Could not find unit ${unitId} in mockData.ts`);
    }
  }

  // Also replace /cars/hrv-2022.jpg with /cars/hrv-2022/slide-1.jpg etc. if desired, or keep as thumbnail
  mockFile = mockFile
    .replace("photoUrl: '/cars/city-2021.jpg'", "photoUrl: '/cars/city-2021/slide-1.jpg'")
    .replace("photoUrl: '/cars/altis-2015.jpg'", "photoUrl: '/cars/altis-2015/slide-1.jpg'")
    .replace("photoUrl: '/cars/fortuner-2022.jpg'", "photoUrl: '/cars/fortuner-2022/slide-1.jpg'")
    .replace("photoUrl: '/cars/hrv-2022.jpg'", "photoUrl: '/cars/hrv-2022/slide-1.jpg'")
    .replace("photoUrl: '/cars/hrv-2021.jpg'", "photoUrl: '/cars/hrv-2021/slide-1.jpg'");

  fs.writeFileSync('src/lib/mockData.ts', mockFile, 'utf8');
  console.log('Successfully updated src/lib/mockData.ts');
}

async function updateSupabase() {
  console.log('Updating Supabase units table with galleryUrls metadata...');
  const { data: units, error } = await supabase.from('units').select('id, notes');
  if (error) {
    console.error('Error fetching units from Supabase:', error.message);
    return;
  }

  for (const u of units) {
    const photos = galleryMap[u.id];
    if (!photos) continue;

    let cleanNotes = u.notes || '';
    let meta = {};
    if (cleanNotes.includes('[META:')) {
      try {
        const m = cleanNotes.match(/\[META:(.*?)\]/);
        if (m) {
          meta = JSON.parse(m[1]);
          cleanNotes = cleanNotes.replace(/\[META:.*?\]/, '').trim();
        }
      } catch (e) {
        console.warn('Error parsing meta:', e.message);
      }
    }

    meta.galleryUrls = photos;
    const newNotes = `${cleanNotes} [META:${JSON.stringify(meta)}]`.trim();

    const { error: updateErr } = await supabase
      .from('units')
      .update({ notes: newNotes })
      .eq('id', u.id);

    if (updateErr) {
      console.warn(`  Failed to update unit ${u.id} in Supabase:`, updateErr.message);
    } else {
      console.log(`  [OK] Updated unit ${u.id} in Supabase with ${photos.length} photos`);
    }
  }
}

async function bumpAppContext() {
  console.log('Bumping cache key in src/context/AppContext.tsx...');
  let appCtx = fs.readFileSync('src/context/AppContext.tsx', 'utf8');
  appCtx = appCtx
    .replace(/gam_cars_v11/g, 'gam_cars_v12')
    .replace(/gam_wallets_v11/g, 'gam_wallets_v12')
    .replace(/gam_txs_v11/g, 'gam_txs_v12');
  fs.writeFileSync('src/context/AppContext.tsx', appCtx, 'utf8');
  console.log('Bumped cache key to v12 in AppContext.tsx');
}

async function main() {
  await updateMockData();
  await updateSupabase();
  await bumpAppContext();
  console.log('All updates complete!');
}

main().catch(console.error);
