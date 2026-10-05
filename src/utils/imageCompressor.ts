/**
 * Compresses an image file client-side to ensure it is < 500 KB (JPEG)
 * Suitable for whiteboard photos, notebook scans and course diagrams.
 */
export async function compressImageToDataUrl(
  file: File,
  maxSizeKo = 480,
  maxWidthOrHeight = 1200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate scaled dimensions while preserving aspect ratio
        if (width > height) {
          if (width > maxWidthOrHeight) {
            height = Math.round((height * maxWidthOrHeight) / width);
            width = maxWidthOrHeight;
          }
        } else {
          if (height > maxWidthOrHeight) {
            width = Math.round((width * maxWidthOrHeight) / height);
            height = maxWidthOrHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context non disponible'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try progressive compression quality from 0.85 down to 0.4
        let quality = 0.85;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        let sizeInBytes = Math.round((dataUrl.length * 3) / 4);

        while (sizeInBytes > maxSizeKo * 1024 && quality > 0.3) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          sizeInBytes = Math.round((dataUrl.length * 3) / 4);
        }

        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
    reader.readAsDataURL(file);
  });
}
