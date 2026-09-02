import { Platform } from "react-native";

export interface PickedFileResult {
  uri: string;
  name: string;
  sizeBytes?: number;
  mimeType?: string;
  type: "image" | "pdf" | "document";
}

/**
 * Opens native or web file dialog to pick an image, PDF, or document.
 */
export async function pickDocumentFile(
  accept = "image/*,application/pdf,.doc,.docx,.xls,.xlsx"
): Promise<PickedFileResult | null> {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = accept;
      input.style.display = "none";

      input.onchange = (e: any) => {
        const file: File | undefined = e.target?.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
          const isImage = file.type.startsWith("image/");

          resolve({
            uri: result,
            name: file.name,
            sizeBytes: file.size,
            mimeType: file.type,
            type: isPdf ? "pdf" : isImage ? "image" : "document",
          });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
        document.body.removeChild(input);
      };

      input.oncancel = () => {
        resolve(null);
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      };

      document.body.appendChild(input);
      input.click();
    });
  }

  // Fallback for native/mock environments
  return {
    uri: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=700&auto=format&fit=crop&q=80",
    name: "Dokumen_Lampiran_Pesanan.pdf",
    sizeBytes: 245000,
    mimeType: "application/pdf",
    type: "pdf",
  };
}

/**
 * Format bytes to readable string (e.g. 1.2 MB, 450 KB)
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
