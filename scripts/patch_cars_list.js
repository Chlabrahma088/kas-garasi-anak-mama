const fs = require('fs');

let content = fs.readFileSync('src/components/CarsListView.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

const insertion = [
  '                    {/* Bottom Badges: Photo Count & Instagram */}',
  '                    <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">',
  '                      {car.galleryUrls && car.galleryUrls.length > 1 ? (',
  '                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold shadow-xs">',
  '                          <Camera className="w-3 h-3 text-emerald-400" />',
  '                          <span>{car.galleryUrls.length} Foto</span>',
  '                        </div>',
  '                      ) : <div />}',
  '',
  '                      {car.instagramUrl && (',
  '                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-pink-300 text-[10px] font-bold shadow-xs">',
  '                          <span>📸 IG Post</span>',
  '                        </div>',
  '                      )}',
  '                    </div>'
];

lines.splice(263, 0, ...insertion);
fs.writeFileSync('src/components/CarsListView.tsx', lines.join('\n'), 'utf8');
console.log('Successfully inserted photo count & IG badges into CarsListView.tsx!');
