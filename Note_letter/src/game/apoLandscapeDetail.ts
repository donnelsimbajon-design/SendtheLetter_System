/**
 * Apo Letter World ground-cover pass.
 *
 * Real 3D, not a screenshot or billboard: hundreds of individually rotated
 * grass tufts, broadleaf ferns and weathered boulders are GPU-instanced into
 * just three draw calls. The layout is deterministic and excludes roads,
 * Letter Plaza and building footprints.
 */
type Vec2=[number,number];
type Track={points:Vec2[];width:number};
type LandscapeOptions={
  lowPower:boolean;
  softwareProfile:boolean;
  groundHeight:(x:number,z:number)=>number;
};
export type LandscapeDetail={
  grassCount:number;
  fernCount:number;
  rockCount:number;
  update:(elapsedSeconds:number)=>void;
};

const roads:Track[]=[
  {points:[[0,29],[0,18],[0,10],[0,2]],width:3.8},
  {points:[[0,2],[-5,-2],[-10,-6],[-15,-6.5]],width:3.2},
  {points:[[0,2],[6,-3],[12,-7],[16,-9]],width:3.2},
  {points:[[2,-2],[8,-14],[13,-23],[14,-27]],width:2.8},
  {points:[[-10,-6],[-15,-18],[-6,-26]],width:2.4},
];
const distanceToSegment=(x:number,z:number,a:Vec2,b:Vec2)=>{
  const dx=b[0]-a[0],dz=b[1]-a[1];
  const t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));
  return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);
};
/** Safeguard path readability and existing interactable entrances. */
export function isVegetationSafe(x:number,z:number):boolean{
  if(Math.hypot(x,z-9.5)<7.4)return false;
  if(Math.abs(x+17)<6.7&&Math.abs(z+11)<6.0)return false;
  if(Math.abs(x-17)<6.7&&Math.abs(z+14)<6.0)return false;
  for(const road of roads){
    for(let i=0;i<road.points.length-1;i++){
      if(distanceToSegment(x,z,road.points[i],road.points[i+1])<road.width/2+.72)return false;
    }
  }
  return true;
}
function seeded(seed:number){
  let state=seed>>>0;
  return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}
function flowerlikeGeometry(THREE:any,fern:boolean){
  const positions:number[]=[],colors:number[]=[];
  const shade=(height:number,k:number):[number,number,number]=>{
    if(fern)return [0.095+height*.10,0.29+height*.17,0.105+height*.11];
    const variant=(k%3)*.015;
    return [0.11+height*.085+variant,0.28+height*.135+variant,0.075+height*.09];
  };
  const push=(v:[number,number,number],c:[number,number,number])=>{positions.push(...v);colors.push(...c);};
  const triangle=(a:[number,number,number],b:[number,number,number],c:[number,number,number],ca:[number,number,number],cb:[number,number,number],cc:[number,number,number])=>{
    push(a,ca);push(b,cb);push(c,cc);
  };
  const blades=fern?6:5;
  for(let blade=0;blade<blades;blade++){
    const theta=blade*Math.PI*2/blades+.25;
    const vx=Math.cos(theta),vz=Math.sin(theta),sx=-vz,sz=vx;
    const height=fern?.49+(.07*(blade%3)):.55+(.13*(blade%3));
    const half=fern?.19:.085;
    const lift=fern?.32:.52;
    const spread=fern?.66:.25;
    const base:Vec2=[vx*(fern?.09:.08),vz*(fern?.09:.08)];
    const left:[number,number,number]=[base[0]+sx*half,0,base[1]+sz*half];
    const right:[number,number,number]=[base[0]-sx*half,0,base[1]-sz*half];
    const center:[number,number,number]=[base[0]+vx*spread*.6,height*.55,base[1]+vz*spread*.6];
    const midLeft:[number,number,number]=[center[0]+sx*half*.7,center[1],center[2]+sz*half*.7];
    const midRight:[number,number,number]=[center[0]-sx*half*.7,center[1],center[2]-sz*half*.7];
    const tip:[number,number,number]=[base[0]+vx*spread,height*.88+lift*.12,base[1]+vz*spread];
    const rootColor=shade(0,blade),midColor=shade(.55,blade),topColor=shade(1,blade);
    triangle(left,right,midLeft,rootColor,rootColor,midColor);
    triangle(right,midRight,midLeft,rootColor,midColor,midColor);
    triangle(midLeft,midRight,tip,midColor,midColor,topColor);
    if(fern){
      // Extra thin serrated leaflets give ferns a different silhouette.
      for(const side of [-1,1]){
        const edge:[number,number,number]=[center[0]+sx*side*.25,center[1]-.035,center[2]+sz*side*.25];
        triangle(midLeft,edge,tip,midColor,shade(.8,blade),topColor);
      }
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.computeVertexNormals();
  return geometry;
}

export function addApoLandscapeDetail(THREE:any,scene:any,options:LandscapeOptions):LandscapeDetail{
  const {lowPower,softwareProfile,groundHeight}=options;
  const grassBudget=softwareProfile?330:lowPower?690:2100;
  const fernBudget=softwareProfile?28:lowPower?65:170;
  const rockBudget=softwareProfile?22:lowPower?37:80;
  const random=seeded(20261107);
  const dummy=new THREE.Object3D();
  const color=new THREE.Color();
  let windUniform:{value:number}|null=null;
  const grassMaterial=new THREE.MeshStandardMaterial({
    vertexColors:true,side:THREE.DoubleSide,roughness:1,metalness:0,
  });
  if(!softwareProfile){
    grassMaterial.onBeforeCompile=(shader:any)=>{
      shader.uniforms.uApoWind={value:0};
      windUniform=shader.uniforms.uApoWind;
      shader.vertexShader=shader.vertexShader
        .replace('#include <common>','#include <common>\nuniform float uApoWind;')
        .replace('#include <begin_vertex>',`#include <begin_vertex>
          #ifdef USE_INSTANCING
            float apoPhase=instanceMatrix[3].x*.37+instanceMatrix[3].z*.19;
            float apoBend=pow(max(position.y,0.0),1.3);
            transformed.x+=sin(uApoWind*.8+apoPhase)*.09*apoBend;
            transformed.z+=cos(uApoWind*.72+apoPhase)*.07*apoBend;
          #endif`);
    };
  }
  const grass=new THREE.InstancedMesh(flowerlikeGeometry(THREE,false),grassMaterial,grassBudget);
  grass.frustumCulled=false;
  grass.castShadow=false;
  grass.receiveShadow=false;
  let grassCount=0;
  const coloredGrass=[
    new THREE.Color(0x91ab66),new THREE.Color(0x6d985c),
    new THREE.Color(0xa8a16c),new THREE.Color(0x789454)
  ];
  for(let attempt=0;attempt<grassBudget*12&&grassCount<grassBudget;attempt++){
    // Keep a natural meadow around the village and visible trail edges;
    // a uniform scatter across the entire map looks almost empty at spawn.
    const villageMeadow=random()<.7;
    const x=villageMeadow?random()*58-29:random()*94-47;
    const z=villageMeadow?random()*60-28:random()*89-44;
    if(!isVegetationSafe(x,z))continue;
    const y=groundHeight(x,z);
    if(y>10.5||y<-.9)continue;
    dummy.position.set(x,y-.12,z);
    dummy.rotation.set(0,random()*Math.PI*2,0);
    const scale=.55+random()*.95;
    dummy.scale.set(.65+random()*.9,scale,.65+random()*.9);
    dummy.updateMatrix();
    grass.setMatrixAt(grassCount,dummy.matrix);
    color.copy(coloredGrass[Math.floor(random()*coloredGrass.length)]);
    grass.setColorAt(grassCount,color);
    grassCount++;
  }
  grass.count=grassCount;
  grass.instanceMatrix.needsUpdate=true;
  if(grass.instanceColor)grass.instanceColor.needsUpdate=true;
  grass.name='Apo meadow - instanced blades';
  scene.add(grass);

  const ferns=new THREE.InstancedMesh(
    flowerlikeGeometry(THREE,true),
    new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:1}),
    fernBudget
  );
  ferns.frustumCulled=false;
  let fernCount=0;
  for(let attempt=0;attempt<fernBudget*18&&fernCount<fernBudget;attempt++){
    const x=random()*91-45,z=random()*86-43;
    if(!isVegetationSafe(x,z))continue;
    const y=groundHeight(x,z);
    if(y>9.5)continue;
    dummy.position.set(x,y-.12,z);
    dummy.rotation.set(0,random()*Math.PI*2,0);
    const scale=.65+random()*.85;
    dummy.scale.set(scale,scale,scale);
    dummy.updateMatrix();ferns.setMatrixAt(fernCount,dummy.matrix);
    ferns.setColorAt(fernCount,color.setHex(fernCount%3===0?0x8fb17c:0x79a275));
    fernCount++;
  }
  ferns.count=fernCount;ferns.instanceMatrix.needsUpdate=true;
  if(ferns.instanceColor)ferns.instanceColor.needsUpdate=true;
  ferns.name='Apo ferns - instanced';
  scene.add(ferns);

  const rocks=new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(.8,1),
    new THREE.MeshStandardMaterial({color:0xb1b0a3,roughness:1,metalness:0}),
    rockBudget
  );
  rocks.frustumCulled=false;
  let rockCount=0;
  const rockTones=[0xb2b1a2,0x9d9e8b,0xb6a894,0x8e9b83];
  for(let attempt=0;attempt<rockBudget*18&&rockCount<rockBudget;attempt++){
    const x=random()*89-44.5,z=random()*87-43.5;
    if(!isVegetationSafe(x,z))continue;
    const radius=.25+random()*.75;
    dummy.position.set(x,groundHeight(x,z)+radius*.18-.12,z);
    dummy.rotation.set((random()-.5)*.3,random()*Math.PI*2,(random()-.5)*.24);
    dummy.scale.set(radius*(.8+random()*.5),radius*(.3+random()*.3),radius*(.7+random()*.5));
    dummy.updateMatrix();rocks.setMatrixAt(rockCount,dummy.matrix);
    rocks.setColorAt(rockCount,color.setHex(rockTones[Math.floor(random()*rockTones.length)]));
    rockCount++;
  }
  rocks.count=rockCount;rocks.instanceMatrix.needsUpdate=true;
  if(rocks.instanceColor)rocks.instanceColor.needsUpdate=true;
  rocks.name='Apo weathered stones - instanced';
  scene.add(rocks);
  return {
    grassCount,fernCount,rockCount,
    update:(seconds:number)=>{if(windUniform)windUniform.value=seconds;}
  };
}
