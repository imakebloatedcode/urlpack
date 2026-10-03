import { perlin2 } from "./perlin.ts";

const minPixel = [0x24, 0x31, 0x4a];
const maxPixel = [0x3c, 0x46, 0x64];

function rangeApply(min: number, max: number, value: number) {
  return min + value * (max - min);
}

function buildStonePerlinNoiseImage(
  width: number,
  height: number,
  scale: number,
  enableAlphaChannel: boolean = true,
) {
  const pixelSize = enableAlphaChannel ? 4 : 3;
  const buffer = new Uint8Array(width * height * pixelSize);

  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const noiseValue = (perlin2(column / scale, row / scale) + 1) / 2;

      const pixel = row * width + column;
      const byteIndex = pixel * pixelSize;

      buffer[byteIndex] = rangeApply(minPixel[0], maxPixel[0], noiseValue);
      buffer[byteIndex + 1] = rangeApply(minPixel[1], maxPixel[1], noiseValue);
      buffer[byteIndex + 2] = rangeApply(minPixel[2], maxPixel[2], noiseValue);
      if (enableAlphaChannel) {
        buffer[byteIndex + 3] = 255;
      }
    }
  }

  return buffer;
}

async function imageBufferToImage(
  buffer: Uint8Array,
  width: number,
  height: number,
  imageType: string,
): Promise<Blob> {
  const imageData = new ImageData(
    new Uint8ClampedArray<ArrayBuffer>(
      buffer.buffer as ArrayBuffer,
      buffer.byteOffset,
      buffer.byteLength,
    ),
    width,
    height,
  );
  const imageBitmap = await createImageBitmap(imageData);

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("bitmaprenderer");
  if (ctx === null) {
    throw new Error("Expected canvas rendering context");
  }

  ctx.transferFromImageBitmap(imageBitmap);

  return await canvas.convertToBlob({ type: imageType });
}

(async () => {
  const size = [2000, 1000] as const;
  const noiseImageBuffer = buildStonePerlinNoiseImage(...size, 80);
  const noiseImageBlob = await imageBufferToImage(
    noiseImageBuffer,
    ...size,
    "image/png",
  );

  const img = document.createElement("img");
  img.src = URL.createObjectURL(noiseImageBlob);

  document.body.appendChild(img);
})();
