const Jimp = require('jimp');

Jimp.read('public/logo.png').then(image => {
  const threshold = 230;
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    // If pixel is white-ish, make it transparent
    if (r > threshold && g > threshold && b > threshold) {
      this.bitmap.data[idx + 3] = 0; // alpha to 0
    }
  });
  image.write('public/logo.png');
  console.log('Logo background removed successfully!');
}).catch(err => {
  console.error('Error:', err);
});
