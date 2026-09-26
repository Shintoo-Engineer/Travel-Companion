import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // Generate RGBA buffer
  const buffer = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  // Prepend filter byte (0 = None) to each row
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0; // Filter None
    buffer.copy(rawData, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression method: 0
  ihdr[11] = 0; // Filter method: 0
  ihdr[12] = 0; // Interlace method: 0

  function createChunk(type, data) {
    const chunk = Buffer.alloc(8 + data.length + 4);
    chunk.writeUInt32BE(data.length, 0);
    chunk.write(type, 4, 4, 'ascii');
    data.copy(chunk, 8);

    // CRC32 calculation
    const crc = crc32(Buffer.concat([Buffer.from(type, 'ascii'), data]));
    chunk.writeUInt32BE(crc, 8 + data.length);
    return chunk;
  }

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', deflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Draw brand travel compass icon
function travelIconPainter(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const radius = w * 0.44;

  // Background rounded squircle / gradient
  const progress = (x + y) / (w + h);
  // Deep ocean gradient
  let r = Math.round(2 + progress * 13);
  let g = Math.round(132 - progress * 40);
  let b = Math.round(199 - progress * 50);
  let a = 255;

  // Outer ring
  if (Math.abs(dist - radius * 0.75) < w * 0.02) {
    return [56, 189, 248, 200]; // Cyan ring
  }

  // Dial circle
  if (dist < radius * 0.3) {
    if (dist < radius * 0.1) {
      return [56, 189, 248, 255]; // Center jewel
    }
    return [15, 23, 42, 255]; // Dark inner circle
  }

  // Compass needle: North pointing (top, dy < 0)
  if (Math.abs(dx) < (h * 0.08 * (1 - (cy - y) / (radius * 0.7))) && dy < 0 && dy > -radius * 0.7) {
    return [244, 63, 94, 255]; // Rose Red North needle
  }
  // Compass needle: South pointing (bottom, dy > 0)
  if (Math.abs(dx) < (h * 0.08 * (1 - (y - cy) / (radius * 0.7))) && dy > 0 && dy < radius * 0.7) {
    return [241, 245, 249, 255]; // Light slate South needle
  }

  return [r, g, b, a];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, travelIconPainter));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, travelIconPainter));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, travelIconPainter));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, travelIconPainter));

console.log('Successfully generated PWA icon assets!');
