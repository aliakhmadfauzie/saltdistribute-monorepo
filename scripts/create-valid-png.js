const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation
function makeCRCTable() {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  return crcTable;
}

const crcTable = makeCRCTable();

function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function createSolidPNG(width, height, r, g, b, a = 255) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrTypeAndData = Buffer.concat([Buffer.from('IHDR'), ihdrData]);
  const ihdrCRC = Buffer.alloc(4);
  ihdrCRC.writeUInt32BE(crc32(ihdrTypeAndData), 0);

  const ihdrChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 13]),
    ihdrTypeAndData,
    ihdrCRC
  ]);

  // Raw image data with filter byte 0 at start of each scanline
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // No filter
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatTypeAndData = Buffer.concat([Buffer.from('IDAT'), compressedData]);
  const idatLength = Buffer.alloc(4);
  idatLength.writeUInt32BE(compressedData.length, 0);
  const idatCRC = Buffer.alloc(4);
  idatCRC.writeUInt32BE(crc32(idatTypeAndData), 0);

  const idatChunk = Buffer.concat([
    idatLength,
    idatTypeAndData,
    idatCRC
  ]);

  // IEND chunk
  const iendType = Buffer.from('IEND');
  const iendCRC = Buffer.alloc(4);
  iendCRC.writeUInt32BE(crc32(iendType), 0);
  const iendChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 0]),
    iendType,
    iendCRC
  ]);

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const dir = path.join(__dirname, '..', 'assets', 'images');
fs.mkdirSync(dir, { recursive: true });

// Emerald green #059669 = (5, 150, 105)
const iconPng = createSolidPNG(1024, 1024, 5, 150, 105);
const adaptiveIconPng = createSolidPNG(1024, 1024, 5, 150, 105);
const splashPng = createSolidPNG(1242, 2436, 0, 77, 54);
const faviconPng = createSolidPNG(48, 48, 5, 150, 105);

fs.writeFileSync(path.join(dir, 'icon.png'), iconPng);
fs.writeFileSync(path.join(dir, 'adaptive-icon.png'), adaptiveIconPng);
fs.writeFileSync(path.join(dir, 'splash-image.png'), splashPng);
fs.writeFileSync(path.join(dir, 'favicon.png'), faviconPng);

console.log('Successfully generated valid PNGs with correct CRC32 checksums!');
