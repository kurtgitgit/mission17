const sharp = require('sharp');

async function createAdaptiveIcon() {
  try {
    // Android Adaptive Icons require a 1080x1080 canvas
    // with the actual logo fitting inside a safe zone of about 66% (712px).
    // Let's resize the logo to 650x650 and center it on a 1080x1080 transparent canvas.
    
    await sharp({
      create: {
        width: 1080,
        height: 1080,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 } // completely transparent
      }
    })
    .composite([
      {
        input: await sharp('c:/Users/Kurt Perez/mission17/mission17-mobile/assets/logo.png')
                .resize(650, 650, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .toBuffer(),
        gravity: 'center'
      }
    ])
    .png()
    .toFile('c:/Users/Kurt Perez/mission17/mission17-mobile/assets/adaptive-icon.png');
    
    console.log("Adaptive icon created successfully at assets/adaptive-icon.png");
  } catch (err) {
    console.error("Error creating adaptive icon:", err);
  }
}

createAdaptiveIcon();
