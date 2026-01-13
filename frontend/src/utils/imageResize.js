/**
 * Image resize utility using Canvas API
 * Resizes images before upload to maintain consistent dimensions
 */

/**
 * Resize an image file to fit within specified max dimensions
 * @param {File} file - Original image file
 * @param {number} maxWidth - Maximum width (default 800)
 * @param {number} maxHeight - Maximum height (default 800)
 * @param {number} quality - JPEG quality 0-1 (default 0.85)
 * @returns {Promise<Blob>} - Resized image as Blob
 */
export async function resizeImage(file, maxWidth = 800, maxHeight = 800, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            let { width, height } = img;

            // Calculate new dimensions maintaining aspect ratio
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;

            // Draw resized image
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to blob
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create blob'));
                    }
                },
                file.type || 'image/jpeg',
                quality
            );
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        // Load image from file
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Resize image and return as File object
 * @param {File} file - Original image file
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @returns {Promise<File>} - Resized image as File
 */
export async function resizeImageAsFile(file, maxWidth = 800, maxHeight = 800) {
    const blob = await resizeImage(file, maxWidth, maxHeight);
    return new File([blob], file.name, { type: blob.type });
}
