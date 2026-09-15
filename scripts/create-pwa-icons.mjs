import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

function createPng(size, filename) {
  const width = size
  const height = size
  const rawBytes = Buffer.alloc((width * 4 + 1) * height)

  const cx = width / 2
  const cy = height / 2
  const rOuter = width * 0.42
  const rInner = width * 0.35

  let offset = 0

  for (let y = 0; y < height; y++) {
    rawBytes[offset++] = 0 // Filter type: None

    for (let x = 0; x < width; x++) {
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Base background: #0b0f19
      let r = 11
      let g = 15
      let b = 25
      const a = 255

      // Outer HUD Ring: cyan #00e5ff
      if (Math.abs(dist - rOuter) < width * 0.02) {
        r = 0
        g = 229
        b = 255
      }
      // Inner Circle: blue #0077ff
      else if (Math.abs(dist - rInner) < width * 0.01) {
        r = 0
        g = 119
        b = 255
      }
      // Center Lightning Bolt approximation (simple geometric region)
      const nx = (x - width * 0.25) / (width * 0.5)
      const ny = (y - height * 0.2) / (height * 0.6)

      if (nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1) {
        // Bolt shape check
        const inUpper = ny < 0.5 && nx > 0.3 && nx < (0.8 - ny * 0.8)
        const inLower = ny >= 0.5 && nx > (0.2 + (ny - 0.5) * 0.6) && nx < 0.7

        if (inUpper || inLower) {
          // Yellow gradient #ffea00 -> #ff9100
          r = 255
          g = Math.floor(234 - ny * 89)
          b = 0
        }
      }

      rawBytes[offset++] = r
      rawBytes[offset++] = g
      rawBytes[offset++] = b
      rawBytes[offset++] = a
    }
  }

  // Compress IDAT
  const compressed = zlib.deflateSync(rawBytes)

  // Build PNG chunks
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  function makeChunk(type, data) {
    const len = Buffer.alloc(4)

    len.writeUInt32BE(data.length, 0)
    const typeBuf = Buffer.from(type, 'ascii')
    const crcBuf = Buffer.alloc(4)

    // CRC32 calculation
    const crc = crc32(Buffer.concat([typeBuf, data]))

    crcBuf.writeUInt32BE(crc, 0)

    return Buffer.concat([len, typeBuf, data, crcBuf])
  }

  // IHDR
  const ihdr = Buffer.alloc(13)

  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr.writeUInt8(8, 8) // bit depth
  ihdr.writeUInt8(6, 9) // RGBA
  ihdr.writeUInt8(0, 10) // compression
  ihdr.writeUInt8(0, 11) // filter
  ihdr.writeUInt8(0, 12) // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr)
  const idatChunk = makeChunk('IDAT', compressed)
  const iendChunk = makeChunk('IEND', Buffer.alloc(0))

  const png = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk])

  const dir = path.dirname(filename)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filename, png)
  console.log(`Generated: ${filename} (${png.length} bytes)`)
}

// CRC32 implementation
const crcTable = []

for (let n = 0; n < 256; n++) {
  let c = n

  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1)
    }
    else {
      c = c >>> 1
    }
  }
  crcTable[n] = c
}

function crc32(buf) {
  let crc = 0xffffffff

  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }

  return (crc ^ 0xffffffff) >>> 0
}

createPng(192, 'public/icons/icon-192x192.png')
createPng(512, 'public/icons/icon-512x512.png')
