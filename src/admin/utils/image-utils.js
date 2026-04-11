/**
 * Utility to compress images on the client-side before uploading to storage.
 * Helps reduce bandwidth and stay within storage limits.
 */

/**
 * Compresses an image file using HTML5 Canvas.
 * @param {File} file - The original image file.
 * @param {Object} options - Compression options.
 * @param {number} [options.maxWidth=1200] - Max width of the output image.
 * @param {number} [options.maxHeight=1200] - Max height of the output image.
 * @param {number} [options.quality=0.8] - JPEG quality (0 to 1).
 * @returns {Promise<Blob>} - Compressed image as a Blob.
 */
export function compressImage(file, options = {}) {
    const maxWidth = options.maxWidth || 1200;
    const maxHeight = options.maxHeight || 1200;
    const quality = options.quality || 0.8;

    return new Promise((resolve, reject) => {
        // Only compress images
        if (!file.type.startsWith('image/')) {
            return resolve(file);
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate aspect ratio scaling
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = width * ratio;
                    height = height * ratio;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                // Use better image smoothing
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            return reject(new Error('Canvas to Blob conversion failed'));
                        }
                        // Create a new file from blob to preserve some original info if needed
                        // but Supabase upload works fine with Blob.
                        resolve(blob);
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = (err) => reject(new Error('Image loading failed'));
        };
        reader.onerror = (err) => reject(new Error('FileReader failed'));
    });
}
