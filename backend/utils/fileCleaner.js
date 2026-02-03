import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ścieżka do folderu uploads (zakładamy, że jest w backend/uploads)
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

/**
 * Usuwa plik z systemu plików na podstawie URL-a.
 * @param {string} fileUrl - URL pliku (np. /uploads/filename.jpg)
 */
export const deleteFile = (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== "string") return;

  // Ignoruj zewnętrzne URL-e (np. Google Auth photo)
  if (fileUrl.startsWith("http") || !fileUrl.startsWith("/uploads/")) {
    return;
  }

  try {
    const filename = fileUrl.replace("/uploads/", "");
    const filePath = path.join(UPLOADS_DIR, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[FileCleaner] Usunięto plik: ${filename}`);
    }
  } catch (error) {
    console.error(`[FileCleaner] Błąd usuwania pliku ${fileUrl}:`, error.message);
  }
};

/**
 * Usuwa wiele plików na podstawie tablicy URL-i.
 * @param {string[]} fileUrls - Tablica URL-i plików
 */
export const deleteFiles = (fileUrls) => {
  if (!Array.isArray(fileUrls)) return;
  fileUrls.forEach(url => deleteFile(url));
};
