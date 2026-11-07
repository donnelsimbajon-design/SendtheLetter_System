/**
 * Apo Letter World: authored village dressing based on the approved
 * Letter Plaza / Post Office / Library visual direction.
 *
 * Only real perspective 3D meshes are used. This pass adds stone edging,
 * wooden lanterns, fences, flower gardens and readable in-world sign boards.
 * The approved image is a reference, not a texture mapped onto the world.
 */
type Point = [number,number];
export type ScenicCottage={x:number;z:number;rotation:number;scale:number};
export const SCENIC_COTTAGES:ScenicCottage[]=[
  {x:-31,z:-27,rotation:.35,scale:.74},
  {x:31,z:-29,rotation:-.48,scale:.8},
  {x:-31,z:5,rotation:.28,scale:.7},
  {x:32,z:8,rotation:-.5,scale:.73},
];

const lampSpots:Point[]=[
  [-4.8,15],[4.8,15],[-6.7,2],[7.3,1.5],
  [-12.5,-9],[12.2,-10],[-23,-16],[23,-19]
];
const gardenSpots:Point[]=[
  [-8.4,10],[8.4,10],[-8.5,2.5],[9,2.0],
  [-22,-9],[-14,-3.5],[23,-12],[14,-6.5]
];
const fences:Array<{start:Point;end:Point}>= [
  {start:[-24,15],end:[-24,23]},
  {start:[24,15],end:[24,23]},
  {start:[-28,-18],end:[-34,-20]},
  {start:[27,-23],end:[33,-21]},
];

const randomSource=(seed:number)=>{
  let n=seed>>>0;
  return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
};
function nameTexture(THREE:any,label:string){
  const canvas=document.createElement('canvas');
  canvas.width=768;canvas.height=220;
  const ctx=canvas.getContext('2d');
  if(!ctx)return null;
  ctx.fillStyle='#64462d';ctx.fillRect(0,0,768,220);
  ctx.strokeStyle='#cba86c';ctx.lineWidth=17;ctx.strokeRect(12,12,744,196);
  ctx.fillStyle='#f9ebcb';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='bold 72px Georgia, serif';
  ctx.fillText(label,384,110,680);
  const map=new THREE.CanvasTexture(canvas);
  map.encoding=THREE.sRGBEncoding;map.anisotropy=2;
  return map;
}
export function buildApoVillageArt(
  THREE:any,scene:any,
  options:{groundHeight:(x:number,z:number)=>number;lowPower:boolean;softwareProfile:boolean}
):{lanternCount:number;flowerCount:number;cottageCount:number} {
  const {groundHeight,lowPower,softwareProfile}=options;
  const newMaterial=(hex:number)=>new THREE.MeshStandardMaterial({color:hex,roughness:.87,metalness:0});
  const oak=newMaterial(0x5d4030),oakLight=newMaterial(0x8a6849);
  const stone=newMaterial(0xa79c86),bronze=newMaterial(0xb29561);
  const glass=new THREE.MeshStandardMaterial({
    color:0xf7dfac,emissive:0xd39442,emissiveIntensity:.65,roughness:.36,metalness:0
  });

  // Low, irregular granite edging around the Letter Plaza ring.
  const stoneCount=softwareProfile?24:lowPower?44:88;
  const edge=new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(.36,1),stone,stoneCount
  );
  const dummy=new THREE.Object3D(),rand=randomSource(1821);
  for(let i=0;i<stoneCount;i++){
    const angle=i/stoneCount*Math.PI*2;
    const radius=6.55+rand()*.35;
    const x=Math.cos(angle)*radius,z=9.5+Math.sin(angle)*radius;
    dummy.position.set(x,groundHeight(x,z)+.035,z);
    dummy.rotation.set(0,rand()*Math.PI*2,0);
    dummy.scale.set(.76+rand()*.42,.14+rand()*.11,.58+rand()*.42);
    dummy.updateMatrix();edge.setMatrixAt(i,dummy.matrix);
  }
  edge.instanceMatrix.needsUpdate=true;
  edge.receiveShadow=true;
  edge.name='Apo Plaza granite edging';
  scene.add(edge);

  // Original 3D wooden lantern posts; keep the emissive glass geometry
  // lightweight instead of creating 8 expensive real-time shadow lights.
  const postGeo=new THREE.CylinderGeometry(.105,.15,2.25,8);
  const posts=new THREE.InstancedMesh(postGeo,oak,lampSpots.length);
  const topGeo=new THREE.ConeGeometry(.39,.36,4);
  topGeo.rotateY(Math.PI/4);
  const caps=new THREE.InstancedMesh(topGeo,oakLight,lampSpots.length);
  const globeGeo=new THREE.BoxGeometry(.36,.42,.36);
  const globes=new THREE.InstancedMesh(globeGeo,glass,lampSpots.length);
  for(let i=0;i<lampSpots.length;i++){
    const [x,z]=lampSpots[i],y=groundHeight(x,z);
    dummy.rotation.set(0,0,0);dummy.scale.setScalar(1);
    dummy.position.set(x,y+1.125,z);dummy.updateMatrix();posts.setMatrixAt(i,dummy.matrix);
    dummy.position.y=y+2.60;dummy.updateMatrix();caps.setMatrixAt(i,dummy.matrix);
    dummy.position.y=y+2.34;dummy.updateMatrix();globes.setMatrixAt(i,dummy.matrix);
  }
  for(const mesh of [posts,caps,globes]){
    mesh.instanceMatrix.needsUpdate=true;
    mesh.frustumCulled=false;scene.add(mesh);
  }
  posts.name='Apo timber lantern posts';

  // Flower clusters: physical stems, foliage, and five-petal blossoms,
  // instanced so a whole garden occupies just a few GPU draw calls.
  const perGarden=softwareProfile?3:lowPower?6:12,flowers=gardenSpots.length*perGarden;
  const stem=new THREE.InstancedMesh(
    new THREE.CylinderGeometry(.024,.035,.52,5),newMaterial(0x45663c),flowers
  );
  const leaf=new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(.14,0),newMaterial(0x46753e),flowers*2
  );
  const petals=new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(.092,0),
    new THREE.MeshStandardMaterial({color:0xffffff,roughness:.92}),
    flowers*5
  );
  const cores=new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(.07,0),newMaterial(0xe6b449),flowers
  );
  const petalsColors=[0xd58b9c,0xd0a8da,0xf5d49b,0xf7e8d4,0xce7580];
  const instanceColor=new THREE.Color();
  const flowerRandom=randomSource(20318);
  let count=0;
  for(const [gx,gz] of gardenSpots)for(let i=0;i<perGarden;i++){
    const phi=flowerRandom()*Math.PI*2,spread=.25+flowerRandom()*1.8;
    const x=gx+Math.cos(phi)*spread,z=gz+Math.sin(phi)*spread;
    const y=groundHeight(x,z),height=.35+flowerRandom()*.3;
    const rotate=flowerRandom()*Math.PI*2;
    dummy.rotation.set(0,rotate,0);dummy.scale.setScalar(1);
    dummy.position.set(x,y+height/2,z);
    dummy.scale.set(1,height/.52,1);dummy.updateMatrix();stem.setMatrixAt(count,dummy.matrix);
    for(let side=0;side<2;side++){
      dummy.rotation.set(0,rotate,side===0?-.55:.55);
      dummy.position.set(x+(side===0?-.08:.08),y+height*.42,z);
      dummy.scale.set(1.4,.65,.65);dummy.updateMatrix();
      leaf.setMatrixAt(count*2+side,dummy.matrix);
    }
    const tint=petalsColors[Math.floor(flowerRandom()*petalsColors.length)];
    for(let petal=0;petal<5;petal++){
      const a=petal*Math.PI*2/5+rotate;
      dummy.rotation.set(.22,0,.12);
      dummy.scale.set(1,.72,1);
      dummy.position.set(x+Math.cos(a)*.115,y+height+.06,z+Math.sin(a)*.115);
      dummy.updateMatrix();
      const index=count*5+petal;
      petals.setMatrixAt(index,dummy.matrix);
      petals.setColorAt(index,instanceColor.setHex(tint));
    }
    dummy.scale.setScalar(1);dummy.rotation.set(0,0,0);
    dummy.position.set(x,y+height+.06,z);dummy.updateMatrix();
    cores.setMatrixAt(count,dummy.matrix);count++;
  }
  for(const mesh of [stem,leaf,petals,cores]){
    mesh.instanceMatrix.needsUpdate=true;
    if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    mesh.frustumCulled=false;scene.add(mesh);
  }
  petals.name='Apo flower gardens';

  // Low wooden boundary fences sit beyond the actual footpaths.
  const postPositions:Array<{x:number;y:number;z:number}>=[],
    railPositions:Array<{x:number;y:number;z:number;angle:number;length:number}>=[];
  for(const fence of fences){
    const [ax,az]=fence.start,[bx,bz]=fence.end;
    const angle=Math.atan2(bz-az,bx-ax),length=Math.hypot(bx-ax,bz-az);
    const count=Math.ceil(length/1.6);
    for(let i=0;i<=count;i++){
      const t=i/count,x=ax+(bx-ax)*t,z=az+(bz-az)*t;
      postPositions.push({x,y:groundHeight(x,z)+.55,z});
    }
    for(let i=0;i<count;i++){
      const t=(i+.5)/count,x=ax+(bx-ax)*t,z=az+(bz-az)*t;
      for(const h of [.38,.84])railPositions.push({x,y:groundHeight(x,z)+h,z,angle,length:length/count});
    }
  }
  const fencePosts=new THREE.InstancedMesh(
    new THREE.BoxGeometry(.18,1.1,.18),oak,postPositions.length
  );
  const fenceRails=new THREE.InstancedMesh(
    new THREE.BoxGeometry(1,.10,.09),oakLight,railPositions.length
  );
  postPositions.forEach((point,i)=>{
    dummy.position.set(point.x,point.y,point.z);
    dummy.rotation.set(0,0,0);dummy.scale.setScalar(1);
    dummy.updateMatrix();fencePosts.setMatrixAt(i,dummy.matrix);
  });
  railPositions.forEach((point,i)=>{
    dummy.position.set(point.x,point.y,point.z);
    dummy.rotation.set(0,-point.angle,0);
    dummy.scale.set(point.length,1,1);
    dummy.updateMatrix();fenceRails.setMatrixAt(i,dummy.matrix);
  });
  for(const mesh of [fencePosts,fenceRails]){
    mesh.instanceMatrix.needsUpdate=true;scene.add(mesh);
  }

  // Readable in-world signs matching the approved Post Office / Library art.
  for(const config of [
    {x:-17,z:-4.8,title:'POST OFFICE'},
    {x:17,z:-7.8,title:'LETTER LIBRARY'},
  ]){
    const signMap=nameTexture(THREE,config.title);
    if(!signMap)continue;
    const board=new THREE.Mesh(
      new THREE.PlaneGeometry(3.9,1.05),
      new THREE.MeshStandardMaterial({map:signMap,side:THREE.DoubleSide,roughness:.78})
    );
    const signY=groundHeight(config.x,config.z)+3.25;
    const back=new THREE.Mesh(new THREE.BoxGeometry(4.08,1.18,.17),oak);
    back.position.set(config.x,signY,config.z);
    scene.add(back);
    for(const dx of [-1.8,1.8]){
      const x=config.x+dx,z=config.z,y=groundHeight(x,z);
      const support=new THREE.Mesh(new THREE.BoxGeometry(.17,3.35,.17),oakLight);
      support.position.set(x,y+1.675,z);
      scene.add(support);
    }
    const trim=new THREE.Mesh(new THREE.BoxGeometry(4.08,.065,.20),bronze);
    trim.position.set(config.x,signY+.57,config.z);
    scene.add(trim);
    board.position.set(config.x,signY,config.z+.10);
    board.name='Apo '+config.title+' sign';
    scene.add(board);
  }

  return {lanternCount:lampSpots.length,flowerCount:count,cottageCount:SCENIC_COTTAGES.length};
}
