import { test, expect } from '@playwright/test';

/** Synthetic standards-compliant GLB, so CI proves the actual binary importer
 * works without depending on an external model CDN. */
test('GLB loader parses authored geometry, transforms and material colours',async({page})=>{
  await page.goto('/try');
  const result=await page.evaluate(async()=>{
    const encoder=new TextEncoder();
    const positions=new Float32Array([0,0,0,1,0,0,0,1,0]);
    const normals=new Float32Array([0,0,1,0,0,1,0,0,1]);
    const indices=new Uint16Array([0,1,2]);
    const bin=new Uint8Array(80);
    bin.set(new Uint8Array(positions.buffer),0);
    bin.set(new Uint8Array(normals.buffer),36);
    bin.set(new Uint8Array(indices.buffer),72);
    const json={
      asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],
      nodes:[{mesh:0,translation:[2,0,3]}],
      bufferViews:[{buffer:0,byteOffset:0,byteLength:36},{buffer:0,byteOffset:36,byteLength:36},{buffer:0,byteOffset:72,byteLength:6}],
      accessors:[
        {bufferView:0,componentType:5126,count:3,type:'VEC3'},
        {bufferView:1,componentType:5126,count:3,type:'VEC3'},
        {bufferView:2,componentType:5123,count:3,type:'SCALAR'}
      ],
      meshes:[{primitives:[{attributes:{POSITION:0,NORMAL:1},indices:2,material:0}]}],
      materials:[{pbrMetallicRoughness:{baseColorFactor:[.42,.66,.30,1]}}]
    };
    let bytes=encoder.encode(JSON.stringify(json));
    const pad=(4-(bytes.length%4))%4;
    const aligned=new Uint8Array(bytes.length+pad);
    aligned.set(bytes);aligned.fill(0x20,bytes.length);
    const out=new Uint8Array(12+8+aligned.length+8+bin.length);
    const dv=new DataView(out.buffer);
    dv.setUint32(0,0x46546c67,true);dv.setUint32(4,2,true);dv.setUint32(8,out.length,true);
    dv.setUint32(12,aligned.length,true);dv.setUint32(16,0x4e4f534a,true);
    out.set(aligned,20);
    const second=20+aligned.length;
    dv.setUint32(second,bin.length,true);dv.setUint32(second+4,0x004e4942,true);
    out.set(bin,second+8);
    const url=URL.createObjectURL(new Blob([out],{type:'model/gltf-binary'}));
    try{
      const {loadApoGlb}=await import('/src/game/apoGlbLoader.ts');
      const geometry=await loadApoGlb(url,2);
      return {count:geometry.length,positions:[geometry[0],geometry[1],geometry[2],geometry[9+1],geometry[18+1]],color:[geometry[6],geometry[7],geometry[8]]};
    }finally{URL.revokeObjectURL(url);}
  });
  expect(result.count).toBe(27);
  expect(result.positions[1]).toBeCloseTo(0,3);
  expect(result.positions[4]).toBeCloseTo(2,3);
  expect(result.color[0]).toBeCloseTo(.42,2);
  expect(result.color[1]).toBeCloseTo(.66,2);
});

test('GLB loader rejects corrupt binaries without affecting normal writing routes',async({page})=>{
  await page.goto('/try');
  const response=await page.evaluate(async()=>{
    const url=URL.createObjectURL(new Blob([new Uint8Array([1,2,3])]));
    try{
      const {loadApoGlb}=await import('/src/game/apoGlbLoader.ts');
      await loadApoGlb(url,2);
      return 'incorrectly accepted';
    }catch(error){return error instanceof Error?error.message:'unexpected error';}
    finally{URL.revokeObjectURL(url);}
  });
  expect(response).toMatch(/Invalid or oversized 3D asset/);
});

// This test runs against the actual curated model URL. It catches broken
// references or browser CORS failures that a synthetic GLB fixture cannot.
test('curated medieval village GLB loads from its real public source',async({page})=>{
  test.setTimeout(75_000);
  await page.goto('/try');
  const result=await page.evaluate(async()=>{
    const [{loadApoGlb},{APO_MODEL_ASSETS}]=await Promise.all([
      import('/src/game/apoGlbLoader.ts'),import('/src/game/apoAssetCatalog.ts')
    ]);
    const asset=APO_MODEL_ASSETS.postOffice;
    const data=await loadApoGlb(asset.url,asset.height);
    let maxY=-Infinity;
    for(let i=1;i<data.length;i+=9)maxY=Math.max(maxY,data[i]);
    return {vertices:data.length/9,height:maxY};
  });
  expect(result.vertices).toBeGreaterThan(100);
  expect(result.height).toBeCloseTo(5.6,1);
});
