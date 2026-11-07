/**
 * WebGL1-compatible glTF 2.0 / GLB mesh importer for Apo Letter World.
 * Reads real externally authored model geometry, normals, indices, vertex colours,
 * node transforms and embedded base-colour textures. No NPM engine migration.
 * Import is non-blocking; the existing procedural scene is a safe offline fallback.
 *
 * Supports triangle primitives and static bind-pose meshes. Skeletal animations,
 * morph targets and Draco / Meshopt compression are deliberately not supported.
 */
export type ImportedApoMesh = Float32Array;

type GltfDocument = {
  bufferViews?: Array<{ buffer: number; byteOffset?: number; byteLength: number; byteStride?: number }>;
  accessors?: Array<{ bufferView?: number; byteOffset?: number; componentType: number; count: number; type: string; normalized?: boolean }>;
  meshes?: Array<{ primitives: Array<{ attributes: Record<string, number>; indices?: number; material?: number; mode?: number }> }>;
  materials?: Array<{ pbrMetallicRoughness?: { baseColorFactor?: number[]; baseColorTexture?: { index: number } } }>;
  images?: Array<{ bufferView?: number; mimeType?: string; uri?: string }>;
  textures?: Array<{ source?: number }>;
  scenes?: Array<{ nodes?: number[] }>;
  scene?: number;
  nodes?: Array<{ mesh?: number; children?: number[]; matrix?: number[]; translation?: number[]; rotation?: number[]; scale?: number[] }>;
};
type ImagePixels = { width:number; height:number; data: Uint8ClampedArray };
type Matrix = number[];

const identity=():Matrix=>[1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
const multiply=(a:Matrix,b:Matrix):Matrix=>{
  const result=Array<number>(16).fill(0);
  for(let col=0;col<4;col++)for(let row=0;row<4;row++)
    for(let k=0;k<4;k++)result[col*4+row]+=a[k*4+row]*b[col*4+k];
  return result;
};
const nodeMatrix=(node:NonNullable<GltfDocument['nodes']>[number]):Matrix=>{
  if(node.matrix?.length===16)return node.matrix.slice();
  const [x,y,z,w]=node.rotation||[0,0,0,1];
  const [sx,sy,sz]=node.scale||[1,1,1];
  const [tx,ty,tz]=node.translation||[0,0,0];
  return [
    (1-2*(y*y+z*z))*sx, (2*(x*y+z*w))*sx, (2*(x*z-y*w))*sx,0,
    (2*(x*y-z*w))*sy, (1-2*(x*x+z*z))*sy, (2*(y*z+x*w))*sy,0,
    (2*(x*z+y*w))*sz, (2*(y*z-x*w))*sz, (1-2*(x*x+y*y))*sz,0,
    tx,ty,tz,1
  ];
};
const point=(m:Matrix,x:number,y:number,z:number):number[]=>[
  x*m[0]+y*m[4]+z*m[8]+m[12],
  x*m[1]+y*m[5]+z*m[9]+m[13],
  x*m[2]+y*m[6]+z*m[10]+m[14]
];
const normalize=(x:number,y:number,z:number):number[]=>{
  const d=Math.hypot(x,y,z)||1;return [x/d,y/d,z/d];
};
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));

/** Returns interleaved [x,y,z,nx,ny,nz,r,g,b] geometry ready for the existing renderer. */
export async function loadApoGlb(url:string,targetHeight:number,signal?:AbortSignal):Promise<ImportedApoMesh>{
  const response=await fetch(url,{signal,mode:'cors',credentials:'omit'});
  if(!response.ok)throw Error('Model fetch failed ('+response.status+'): '+url);
  const file=await response.arrayBuffer();
  if(file.byteLength<20 || file.byteLength>12_000_000)throw Error('Invalid or oversized 3D asset');
  const header=new DataView(file);
  if(header.getUint32(0,true)!==0x46546c67 || header.getUint32(4,true)!==2)throw Error('Expected glTF 2.0 GLB');
  if(header.getUint32(8,true)!==file.byteLength)throw Error('Malformed GLB length');
  let offset=12, gltf:GltfDocument|null=null, bin:ArrayBuffer|null=null;
  while(offset+8<=file.byteLength){
    const size=header.getUint32(offset,true),type=header.getUint32(offset+4,true);
    offset+=8;
    if(offset+size>file.byteLength)throw Error('Malformed GLB chunk');
    if(type===0x4e4f534a){
      gltf=JSON.parse(new TextDecoder().decode(new Uint8Array(file,offset,size))) as GltfDocument;
    }else if(type===0x004e4942){
      bin=file.slice(offset,offset+size);
    }
    offset+=size;
  }
  if(!gltf||!bin||!gltf.meshes?.length || !gltf.accessors?.length)throw Error('GLB has no renderable mesh');
  const document=gltf as GltfDocument, bytes=bin as ArrayBuffer;
  const views=document.bufferViews||[],accessors=document.accessors||[];
  const imageCache=new Map<number,ImagePixels|null>();
  const getImage=async(textureIndex:number):Promise<ImagePixels|null>=>{
    if(imageCache.has(textureIndex))return imageCache.get(textureIndex)||null;
    const source=document.textures?.[textureIndex]?.source;
    const image=source==null?undefined:document.images?.[source];
    if(!image){imageCache.set(textureIndex,null);return null;}
    try{
      let blob:Blob;
      if(image.bufferView!=null){
        const view=views[image.bufferView];
        blob=new Blob([bytes.slice(view.byteOffset||0,(view.byteOffset||0)+view.byteLength)],{type:image.mimeType||'image/png'});
      }else if(image.uri?.startsWith('data:')){
        blob=await (await fetch(image.uri)).blob();
      }else throw Error('External image URI is unsupported');
      const bitmap=await createImageBitmap(blob);
      if(bitmap.width*bitmap.height>8_000_000)throw Error('Texture exceeds budget');
      const canvas=documentGlobalCanvas(bitmap.width,bitmap.height);
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      if(!ctx)throw Error('No texture decoder context');
      ctx.drawImage(bitmap,0,0);
      const pixels={width:bitmap.width,height:bitmap.height,data:ctx.getImageData(0,0,bitmap.width,bitmap.height).data};
      bitmap.close();
      imageCache.set(textureIndex,pixels);return pixels;
    }catch{imageCache.set(textureIndex,null);return null;}
  };
  const read=(index:number):number[][]=>{
    const a=accessors[index];
    if(!a || a.bufferView==null)throw Error('Sparse GLB accessors are unsupported');
    const v=views[a.bufferView];if(!v || v.buffer!==0)throw Error('Invalid GLB buffer view');
    const components:Record<string,number>={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
    const count=components[a.type];if(!count)throw Error('Unsupported GLB accessor');
    const bytesPer:Record<number,number>={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};
    const elem=bytesPer[a.componentType];if(!elem)throw Error('Unsupported GLB vertex component');
    const stride=v.byteStride||count*elem,start=(v.byteOffset||0)+(a.byteOffset||0);
    if(start+(a.count-1)*stride+count*elem>bytes.byteLength)throw Error('GLB accessor bounds exceeded');
    const dv=new DataView(bytes),result:number[][]=[];
    for(let i=0;i<a.count;i++){
      const row:number[]=[];
      for(let j=0;j<count;j++){
        const ix=start+i*stride+j*elem;let value:number;
        switch(a.componentType){
          case 5120:value=dv.getInt8(ix);break; case 5121:value=dv.getUint8(ix);break;
          case 5122:value=dv.getInt16(ix,true);break;case 5123:value=dv.getUint16(ix,true);break;
          case 5125:value=dv.getUint32(ix,true);break;default:value=dv.getFloat32(ix,true);
        }
        if(a.normalized && a.componentType!==5126){
          const max=a.componentType===5120?127:a.componentType===5121?255:a.componentType===5122?32767:a.componentType===5123?65535:4294967295;
          value=a.componentType===5120||a.componentType===5122?Math.max(-1,value/max):value/max;
        }
        row.push(value);
      }
      result.push(row);
    }
    return result;
  };
  const result:number[]=[];
  const drawMesh=async(meshIndex:number,transform:Matrix)=>{
    const mesh=document.meshes?.[meshIndex];if(!mesh)return;
    for(const prim of mesh.primitives){
      if(prim.mode!=null&&prim.mode!==4)continue;
      const positions=read(prim.attributes.POSITION);
      const normals=prim.attributes.NORMAL==null?null:read(prim.attributes.NORMAL);
      const colors=prim.attributes.COLOR_0==null?null:read(prim.attributes.COLOR_0);
      const uv=prim.attributes.TEXCOORD_0==null?null:read(prim.attributes.TEXCOORD_0);
      const material=prim.material==null?undefined:document.materials?.[prim.material];
      const pbr=material?.pbrMetallicRoughness;
      const factor=pbr?.baseColorFactor||[1,1,1,1];
      const texture=pbr?.baseColorTexture?.index==null?null:await getImage(pbr.baseColorTexture.index);
      const indices=prim.indices==null?positions.map((_,i)=>i):read(prim.indices).map(e=>e[0]);
      if(indices.length>360_000)throw Error('Model exceeds triangle budget');
      for(let i=0;i<indices.length;i+=3){
        const ids=indices.slice(i,i+3);if(ids.length<3)break;
        const p=ids.map(id=>point(transform,...positions[id]));
        const edgeA=p.map(()=>0);void edgeA;
        const ax=p[1][0]-p[0][0],ay=p[1][1]-p[0][1],az=p[1][2]-p[0][2];
        const bx=p[2][0]-p[0][0],by=p[2][1]-p[0][1],bz=p[2][2]-p[0][2];
        const face=normalize(ay*bz-az*by,az*bx-ax*bz,ax*by-ay*bx);
        for(let k=0;k<3;k++){
          const id=ids[k];
          const src=normals?.[id],n=src?normalize(
            src[0]*transform[0]+src[1]*transform[4]+src[2]*transform[8],
            src[0]*transform[1]+src[1]*transform[5]+src[2]*transform[9],
            src[0]*transform[2]+src[1]*transform[6]+src[2]*transform[10]
          ):face;
          const rgb=[factor[0],factor[1],factor[2]];
          if(colors?.[id])for(let c=0;c<3;c++)rgb[c]*=colors[id][c];
          if(texture && uv?.[id]){
            const u=clamp(uv[id][0]%1,0,.999999),v=clamp((1-uv[id][1])%1,0,.999999);
            const ix=(Math.floor(v*texture.height)*texture.width+Math.floor(u*texture.width))*4;
            for(let c=0;c<3;c++)rgb[c]*=texture.data[ix+c]/255;
          }
          result.push(...p[k],...n,...rgb.map(c=>clamp(c,0,1)));
        }
      }
    }
  };
  const walk=async(nodeIndex:number,parent:Matrix,seen:Set<number>)=>{
    if(seen.has(nodeIndex))return;
    seen.add(nodeIndex);
    const node=document.nodes?.[nodeIndex];if(!node)return;
    const matrix=multiply(parent,nodeMatrix(node));
    if(node.mesh!=null)await drawMesh(node.mesh,matrix);
    for(const child of node.children||[])await walk(child,matrix,seen);
  };
  const scene=document.scenes?.[document.scene||0],roots=scene?.nodes||document.nodes?.map((_,i)=>i)||[];
  for(const node of roots)await walk(node,identity(),new Set());
  if(result.length===0)throw Error('No visible triangles in GLB');
  let minY=Infinity,maxY=-Infinity,minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
  for(let i=0;i<result.length;i+=9){
    minX=Math.min(minX,result[i]);maxX=Math.max(maxX,result[i]);
    minY=Math.min(minY,result[i+1]);maxY=Math.max(maxY,result[i+1]);
    minZ=Math.min(minZ,result[i+2]);maxZ=Math.max(maxZ,result[i+2]);
  }
  if(!Number.isFinite(minY)||maxY-minY<.001)throw Error('Model has invalid height');
  const scale=targetHeight/(maxY-minY),cx=(minX+maxX)/2,cz=(minZ+maxZ)/2;
  for(let i=0;i<result.length;i+=9){
    result[i]=(result[i]-cx)*scale;
    result[i+1]=(result[i+1]-minY)*scale;
    result[i+2]=(result[i+2]-cz)*scale;
  }
  return new Float32Array(result);
}
function documentGlobalCanvas(w:number,h:number):HTMLCanvasElement{
  const canvas=window.document.createElement('canvas');
  canvas.width=w;canvas.height=h;return canvas;
}
