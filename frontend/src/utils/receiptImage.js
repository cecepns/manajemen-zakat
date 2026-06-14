import html2canvas from "html2canvas";

export const captureReceiptImage = async (elementId = "receipt-capture", quality = 0.92) => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error("Elemen struk tidak ditemukan");

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Gagal membuat gambar struk"))),
      "image/jpeg",
      quality
    );
  });
};
