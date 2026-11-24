const https = require('https');
const fs = require('fs');
const path = require('path');

const data = require('./scratch_ig_images.json');

const carSlugMap = {
  'unit-city-2021': 'city-2021',
  'unit-altis-2015': 'altis-2015',
  'unit-fortuner-2022': 'fortuner-2022',
  'unit-hrv-2022': 'hrv-2022',
  'unit-hrv-2021': 'hrv-2021',
};

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res2) => {
          res2.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(dest);
          });
        }).on('error', reject);
      } else if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(dest);
        });
      } else {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`Failed with status ${res.statusCode}`));
      }
    });
    req.on('error', (err) => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function main() {
  const finalGalleryMap = {};

  for (const unitId of Object.keys(data)) {
    const slug = carSlugMap[unitId] || unitId;
    const targetDir = path.join(__dirname, '..', 'public', 'cars', slug);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const rawImages = data[unitId]?.images || [];
    // Take up to 7 slides per car
    const imagesToDownload = rawImages.slice(0, 7);
    const savedPaths = [];

    console.log(`Downloading ${imagesToDownload.length} photos for ${unitId} (${slug})...`);

    for (let i = 0; i < imagesToDownload.length; i++) {
      const url = imagesToDownload[i];
      const fileName = `slide-${i + 1}.jpg`;
      const filePath = path.join(targetDir, fileName);
      const publicPath = `/cars/${slug}/${fileName}`;

      try {
        await downloadFile(url, filePath);
        const stats = fs.statSync(filePath);
        console.log(`  [OK] ${fileName} (${(stats.size / 1024).toFixed(0)} KB)`);
        savedPaths.push(publicPath);
      } catch (err) {
        console.warn(`  [ERR] Failed to download slide ${i + 1}: ${err.message}`);
      }
    }

    finalGalleryMap[unitId] = savedPaths;
  }

  // Also for unit-city-2023, if it doesn't have an IG post yet, provide high quality gallery photos
  finalGalleryMap['unit-city-2023'] = [
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
  ];

  fs.writeFileSync(
    path.join(__dirname, 'gallery_map.json'),
    JSON.stringify(finalGalleryMap, null, 2)
  );

  console.log('Finished downloading all car photos!');
  console.log('Gallery map written to scripts/gallery_map.json');
}

main().catch(console.error);
