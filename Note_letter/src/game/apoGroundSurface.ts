/**
 * A tiled PBR ground surface for the Mt. Apo-inspired 3D world.
 *
 * Generated locally at runtime — no flat landscape photographs, remote CDN
 * dependency or network texture downloads. This deliberately avoids adding
 * new GLB trees or geometry draw calls to the software-GPU startup path.
 * Canvas images provide real MeshStandardMaterial colour/bump variation.
 */
export type ApoSurfaceResult={tileSize:number;textureCount:number};
type Options={lowPower:boolean;softwareProfile:boolean};
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
const fade=(v:number)=>v*v*(3-2*v);
const wrap=(n:number,period:number)=>((n%period)+period)%period;
function hashed(x:number,y:number,seed:number):number{
  let value=Math.imul(x+seed*17,374761393)^Math.imul(y+seed*13,668265263);
  value=Math.imul(value^(value>>>13),1274126177);
  return ((value^(value>>>16))>>>0)/4294967295;
}
/** Integer periodicity is what makes a texture genuinely seamless when tiled. */
export function tiledNoise(x:number,y:number,period:number,seed:number):number{
  const xi=Math.floor(x),yi=Math.floor(y),fx=fade(x-xi),fy=fade(y-yi);
  const a=hashed(wrap(xi,period),wrap(yi,period),seed);
  const b=hashed(wrap(xi+1,period),wrap(yi,period),seed);
  const c=hashed(wrap(xi,period),wrap(yi+1,period),seed);
  const d=hashed(wrap(xi+1,period),wrap(yi+1,period),seed);
  return (a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy;
}
function random(seed:number){
  let n=seed>>>0;
  return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
}
function createCanvas(size:number,trail:boolean){
  const canvas=document.createElement('canvas');
  canvas.width=size;canvas.height=size;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx)throw Error('Apo ground texture canvas unavailable');
  const pixels=ctx.createImageData(size,size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size,v=y/size;
    const broad=tiledNoise(u*4,v*4,4,14);
    const mid=tiledNoise(u*13,v*13,13,33);
    const grain=tiledNoise(u*47,v*47,47,58);
    const fine=hashed(x,y,79);
    const i=(y*size+x)*4;
    if(trail){
      const dust=clamp(.45*broad+.36*mid+.19*grain,0,1);
      const pebble=grain>.72 ? 16 : grain<.24 ? -13 : 0;
      pixels.data[i]=clamp(115+dust*46+pebble+(fine-.5)*16,0,255);
      pixels.data[i+1]=clamp(93+dust*46+pebble+(fine-.5)*13,0,255);
      pixels.data[i+2]=clamp(70+dust*40+pebble+(fine-.5)*10,0,255);
    }else{
      const moss=clamp(.43*broad+.34*mid+.23*grain,0,1);
      const soil=clamp((broad+.38*mid-.78)*1.30,0,1);
      const fleck=grain>.78?10:grain<.2?-10:0;
      pixels.data[i]=clamp(54+60*soil+45*moss+fleck+(fine-.5)*13,0,255);
      pixels.data[i+1]=clamp(92+26*moss-13*soil+fleck+(fine-.5)*15,0,255);
      pixels.data[i+2]=clamp(45+27*moss+19*soil+fleck+(fine-.5)*12,0,255);
    }
    pixels.data[i+3]=255;
  }
  ctx.putImageData(pixels,0,0);
  if(trail){
    const rand=random(20261108);
    // Tiny embedded stones and compressed soil, not road-blocking 3D meshes.
    for(let i=0;i<(size*size)/240;i++){
      const x=rand()*size,y=rand()*size,r=.4+rand()*2.2;
      ctx.fillStyle=rand()>.5?'rgba(197,181,154,.40)':'rgba(62,55,42,.28)';
      ctx.beginPath();
      ctx.ellipse(x,y,r,r*(.4+rand()*.5),rand()*Math.PI,0,Math.PI*2);
      ctx.fill();
    }
  }
  return canvas;
}
function textureFrom(THREE:any,canvas:HTMLCanvasElement,repeat:number,colour:boolean,lowPower:boolean){
  const texture=new THREE.CanvasTexture(canvas);
  texture.wrapS=THREE.RepeatWrapping;
  texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(repeat,repeat);
  texture.anisotropy=lowPower?1:4;
  texture.magFilter=THREE.LinearFilter;
  texture.minFilter=THREE.LinearMipmapLinearFilter;
  if(colour)texture.encoding=THREE.sRGBEncoding; // pinned Three.js r150
  texture.needsUpdate=true;
  return texture;
}
/** Invoke only *after the first successful WebGL frame* for fast startup. */
export function enhanceApoGroundMaterials(
  THREE:any,
  grassMaterial:any,
  pathMaterial:any,
  options:Options
):ApoSurfaceResult{
  const tileSize=options.softwareProfile?128:options.lowPower?192:384;
  const grassCanvas=createCanvas(tileSize,false);
  const dirtCanvas=createCanvas(tileSize,true);
  const grass=textureFrom(THREE,grassCanvas,9,true,options.lowPower);
  const dirt=textureFrom(THREE,dirtCanvas,1,true,options.lowPower);
  grassMaterial.map=grass;
  pathMaterial.map=dirt;
  if(!options.lowPower && !options.softwareProfile){
    // Grayscale-free colour data works as a bump height texture; a subtle
    // bumpScale leaves real topography to groundHeight / vertex normals.
    grassMaterial.bumpMap=textureFrom(THREE,grassCanvas,9,false,options.lowPower);
    grassMaterial.bumpScale=.07;
    pathMaterial.bumpMap=textureFrom(THREE,dirtCanvas,1,false,options.lowPower);
    pathMaterial.bumpScale=.035;
  }
  grassMaterial.needsUpdate=true;
  pathMaterial.needsUpdate=true;
  return {tileSize,textureCount:2};
}
