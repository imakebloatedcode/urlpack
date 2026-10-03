export function packIntoDataUrl(data: Uint8Array) {
  return (
    "data:text/html," +
    encodeURIComponent(
      `<script type=module>var r=Response,d=await new r(new r(Uint8Array.fromBase64('${data.toBase64({ alphabet: "base64url" })}',{alphabet:'base64url'})).body.pipeThrough(new DecompressionStream('deflate-raw'))).bytes(),v=new Uint32Array(d.buffer);window.l=i=>d.subarray(v.at(i),v.at(i+1));eval(new TextDecoder().decode(l(0)))</script>`,
    )
  );
}

export async function packAssets(assets: Uint8Array[]) {
  const assetsSize = assets.reduce((size, item) => size + item.length, 0);
  const indexesSize = (assets.length + 1) * 4;

  const fullSize = assetsSize + indexesSize;
  const bufferSize = fullSize + ((4 - (fullSize % 4)) % 4);

  const buffer = new Uint8Array(bufferSize);
  const indexes = new Uint32Array(buffer.buffer);

  {
    let indexesIndex = 0;
    let wouldBeIndex = indexesSize;

    indexes[indexesIndex++] = wouldBeIndex;

    for (const asset of assets) {
      wouldBeIndex += asset.length;
      indexes[indexesIndex++] = wouldBeIndex;
    }
  }

  {
    let index = indexesSize;

    for (const asset of assets) {
      buffer.set(asset, index);
      index += asset.length;
    }
  }

  const result = await new Response(
    new Response(buffer).body!.pipeThrough(new CompressionStream("deflate-raw")),
  ).bytes();
  /* console.log(
    `Decompressed payload size: ${buffer.length}, compressed payload size: ${result.length}`,
  ); */

  return result;
}
