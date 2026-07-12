const generateQRCodeUrl = (assetTag) => {
  // Use a public QR code generator API (safe, fast, and does not require canvas dependency)
  const size = '200x200';
  const data = encodeURIComponent(assetTag);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}&data=${data}`;
};

module.exports = {
  generateQRCodeUrl,
};
