const fs = require('fs');
const readline = require('readline');

async function parseAllImages() {
  const fileStream = fs.createReadStream('C:/Users/mbrahma/.gemini/antigravity/brain/7ef5d04a-1de0-459b-a732-b1b49a06ff87/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lines = [];
  for await (const line of rl) {
    lines.push(line);
  }

  const results = {};
  const carKeys = ['unit-city-2021', 'unit-altis-2015', 'unit-fortuner-2022', 'unit-hrv-2022', 'unit-hrv-2021'];
  const stepIndices = [34, 36, 38, 40, 42];

  stepIndices.forEach((lineIdx, i) => {
    if (lines[lineIdx]) {
      const obj = JSON.parse(lines[lineIdx]);
      const content = obj.content || '';
      const marker = '{"ok":true,"action":"script"';
      const jsonStart = content.indexOf(marker);
      if (jsonStart !== -1) {
        // Look for {"ok":true,"action":"script"....}
        // In the content, it's followed by page content or end of string.
        // Let's parse line by line from jsonStart to find the valid JSON object
        let str = content.substring(jsonStart);
        let validObj = null;
        // The json is on a single line or bounded by \n
        const firstLine = str.split('\n')[0];
        try {
          validObj = JSON.parse(firstLine);
        } catch (e) {
          console.log('Error parsing firstLine for', carKeys[i], e.message);
        }

        if (validObj && validObj.value) {
          results[carKeys[i]] = validObj.value;
          console.log(carKeys[i], '->', validObj.value?.car, 'Images count:', validObj.value?.images?.length);
        }
      }
    }
  });

  fs.writeFileSync('scripts/scratch_ig_images.json', JSON.stringify(results, null, 2));
  console.log('Saved scripts/scratch_ig_images.json successfully');
}

parseAllImages();
