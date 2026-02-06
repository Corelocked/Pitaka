const Jimp = require('jimp');

(async () => {
  try {
    const input = 'public/budgetbook-logo.png';
    const output = 'public/favicon-32.png';

    const image = await Jimp.read(input);
    image.resize(32, 32, Jimp.RESIZE_BILINEAR);
    await image.writeAsync(output);

    const fs = require('fs');
    const stat = fs.statSync(output);
    console.log(`Wrote ${output} (${stat.size} bytes)`);
  } catch (err) {
    console.error('Error resizing image:', err);
    process.exit(1);
  }
})();
