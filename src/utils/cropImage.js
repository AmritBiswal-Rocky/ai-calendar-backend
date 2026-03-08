// ─────────────────────────────────────────────
// src/utils/cropImage.js
// Utility to crop an image using canvas and return a Blob
// ─────────────────────────────────────────────

/**
 * Crop an image given an image source and cropping coordinates.
 * @param {string} imageSrc - Source of the image (data URL or URL)
 * @param {Object} crop - Cropping area { x, y, width, height }
 * @returns {Promise<Blob>} - Returns a Promise that resolves to a Blob
 */
export default function getCroppedImg(imageSrc, crop) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = 'anonymous';

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');

        // Draw the cropped area onto the canvas
        ctx.drawImage(
          image,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          crop.width,
          crop.height
        );

        // Convert canvas to Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Canvas is empty'));
            resolve(blob);
          },
          'image/jpeg',
          0.9 // Quality
        );
      } catch (err) {
        reject(err);
      }
    };

    image.onerror = (err) => reject(err);
  });
}
