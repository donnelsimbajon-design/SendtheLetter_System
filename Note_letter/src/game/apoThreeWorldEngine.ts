import { WORLD_LANDMARKS, groundHeight, type WorldAvatar, type WorldController, type WorldLandmark, type WorldMove } from './apoWorldEngine';
import { APO_MODEL_ASSETS, type ApoAssetName } from './apoAssetCatalog';
import { addApoLandscapeDetail } from './apoLandscapeDetail';
import { enhanceApoGroundMaterials } from './apoGroundSurface';
import { buildApoVillageArt, SCENIC_COTTAGES } from './apoVillageArt';

type Events={
  onNearby:(location:WorldLandmark|null)=>void;
  onInteract:(location:WorldLandmark|null)=>void;
  onPosition:(position:{x:number;z:number})=>void;
  onReady:()=>void;
  onError:(error:string)=>void;
  onAssets?:(loaded:number,total:number)=>void;
  reduceMotion:boolean;
  isCurrent?:()=>boolean;
};
let rendererSequence=0;

type ModelRecord={object:any;mixer:any;clips:any[];activeAction:any;activeName:string};
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

/**
 * Enhanced Apo Letter World with locally vendored MIT Three.js r150.
 * Full glTF model materials and skinning animations are supported here;
 * the original custom WebGL scene stays available as a fallback elsewhere.
 */
export async function mountApoThreeWorld(canvas:HTMLCanvasElement,events:Events):Promise<WorldController>{
  // Real source modules: Vite bundles them into lazy /world-only chunks.
  // Importing JavaScript directly from /public triggers Vite's error overlay.
  const [THREE,loaderModule]:any[]=await Promise.all([
    // @ts-ignore Pinned MIT JavaScript vendor file without type declarations.
    import('../vendor/three/three.module.js'),
    // @ts-ignore Pinned MIT JavaScript vendor file without type declarations.
    import('../vendor/three/loaders/GLTFLoader.js'),
  ]);
  if(events.isCurrent&&!events.isCurrent())throw Error('Apo World mount was superseded');
  const GLTFLoader=loaderModule.GLTFLoader;
  if(!GLTFLoader||!THREE.WebGLRenderer)throw Error('Three.js GLB renderer unavailable');
  let renderer:any;
  // Antialiasing is a major cost on headless/software devices and small mobiles.
  const reducedAntialias=Boolean(navigator.webdriver)||window.innerWidth<680;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!reducedAntialias,powerPreference:'default'});}
  catch{throw Error('3D graphics could not start on this device');}
  const rendererId=String(++rendererSequence);
  canvas.dataset.apoRendererOwner=rendererId;
  const ownsCanvas=()=>canvas.dataset.apoRendererOwner===rendererId;
  const scene=new THREE.Scene();
  // Transparent canvas reveals the atmospheric CSS sky instead of flat cyan.
  scene.background=null;
  scene.fog=new THREE.FogExp2(0x9cb6a9,.0036);
  const camera=new THREE.PerspectiveCamera(55,1,.12,320);
  const gl=renderer.getContext();
  const debug=gl.getExtension('WEBGL_debug_renderer_info');
  const gpuLabel=debug?String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)||''):'';
  const software=/SwiftShader|llvmpipe|Software/i.test(gpuLabel);
  // Browsers can conceal their software renderer; keep animation and controls
  // responsive even without WEBGL_debug_renderer_info or on small devices.
  const automated=Boolean(navigator.webdriver);
  const lowPower=software||automated||window.innerWidth<680||(navigator.hardwareConcurrency||8)<=4;
  const softwareProfile=software||automated;
  renderer.setPixelRatio(softwareProfile?.52:lowPower?.9:Math.min(window.devicePixelRatio||1,1.5));
  renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=0.96;
  renderer.shadowMap.enabled=!lowPower;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const hemi=new THREE.HemisphereLight(0xdce9e2,0x536648,.91);
  scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffedce,1.32);
  sun.position.set(-40,70,22);
  sun.castShadow=!lowPower;
  sun.shadow.mapSize.set(1024,1024);
  sun.shadow.camera.left=-48;sun.shadow.camera.right=48;
  sun.shadow.camera.top=48;sun.shadow.camera.bottom=-48;
  sun.shadow.camera.near=.5;sun.shadow.camera.far=180;
  sun.shadow.bias=-.0001;sun.shadow.normalBias=.025;
  scene.add(sun);

  const grassMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.98,metalness:0,side:THREE.DoubleSide});
  const groundGeo=new THREE.PlaneGeometry(104,104,lowPower?58:120,lowPower?58:120);
  groundGeo.rotateX(-Math.PI/2);
  const groundPos=groundGeo.attributes.position;
  const tint:number[]=[];
  for(let i=0;i<groundPos.count;i++){
    const x=groundPos.getX(i),z=groundPos.getZ(i);
    groundPos.setY(i,groundHeight(x,z)-.15);
    const noise=.12*Math.sin(x*.19+z*.43)+.07*Math.sin(x*1.47-z*1.08);
    const shade=clamp(.63+noise+.06*Math.max(0,groundHeight(x,z)),.48,.92);
    // Woodland soil and slopes subtly break up the former uniform green carpet.
    const slope=Math.hypot(
      groundHeight(x+.42,z)-groundHeight(x-.42,z),
      groundHeight(x,z+.42)-groundHeight(x,z-.42)
    );
    const soil=clamp((slope-.26)*.65+Math.max(0,Math.sin(x*.31+z*.17)-.66)*.17,0,.42);
    // Subtle slope-based colour tint multiplies the detailed tiled forest-floor
    // texture. This is deliberately much closer to white than the old flat
    // green vertex colours, which would darken a PBR colour map excessively.
    const r=.72+shade*.18+soil*.08;
    const g=.75+shade*.18-soil*.08;
    const b=.69+shade*.16+soil*.03;
    tint.push(r,g,b);
  }
  groundGeo.setAttribute('color',new THREE.Float32BufferAttribute(tint,3));
  groundGeo.computeVertexNormals();
  const ground=new THREE.Mesh(groundGeo,grassMaterial);
  ground.receiveShadow=true;
  scene.add(ground);

  const pathMaterial=new THREE.MeshStandardMaterial({color:0xe9ddc7,roughness:1,metalness:0,side:THREE.DoubleSide});
  function path(points:[number,number][],width:number){
    const vertices:number[]=[],uvs:number[]=[];
    let travelled=0;
    for(let segment=0;segment<points.length-1;segment++){
      const [ax,az]=points[segment],[bx,bz]=points[segment+1];
      const dx=bx-ax,dz=bz-az,dist=Math.hypot(dx,dz)||1;
      const ox=-dz/dist*width*.5,oz=dx/dist*width*.5;
      for(let j=0;j<12;j++){
        const t0=j/12,t1=(j+1)/12;
        const point=(t:number,dir:number):number[]=>{
          const x=ax+(bx-ax)*t+ox*dir,z=az+(bz-az)*t+oz*dir;
          return [x,groundHeight(x,z)+.06,z];
        };
        const a=point(t0,1),b=point(t1,1),c=point(t1,-1),d=point(t0,-1);
        vertices.push(...a,...b,...c,...a,...c,...d);
        const v0=(travelled+dist*t0)/3.3,v1=(travelled+dist*t1)/3.3;
        uvs.push(0,v0,0,v1,1,v1,0,v0,1,v1,1,v0);
      }
      travelled+=dist;
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
    geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,pathMaterial);mesh.receiveShadow=true;scene.add(mesh);
  }
  path([[0,29],[0,18],[0,10],[0,2]],3.8);
  path([[0,2],[-5,-2],[-10,-6],[-15,-6.5]],3.2);
  path([[0,2],[6,-3],[12,-7],[16,-9]],3.2);
  path([[2,-2],[8,-14],[13,-23],[14,-27]],2.8);
  path([[-10,-6],[-15,-18],[-6,-26]],2.4);

  function material(color:number,roughness=.82){return new THREE.MeshStandardMaterial({color,roughness,metalness:0});}
  const timber=material(0x70513d),darkWood=material(0x422d25),stone=material(0xb8b4a7);
  const parchment=material(0xf7e8bf),roofMat=material(0x6e5247);
  function cube(parent:any,w:number,h:number,d:number,mat:any,x=0,y=0,z=0){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    mesh.position.set(x,y,z);mesh.castShadow=!lowPower;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function cylinder(parent:any,top:number,bottom:number,h:number,mat:any,x:number,y:number,z:number,sides=20){
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,h,sides),mat);
    mesh.position.set(x,y,z);mesh.castShadow=!lowPower;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  const plazaY=groundHeight(0,9.5);
  const circles=material(0xe5d7b7);
  for(const r of [4.3,5.2,6.1]){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.095,9,88),circles);
    ring.rotation.x=Math.PI/2;ring.position.set(0,plazaY+.045,9.5);
    scene.add(ring);
  }
  const fountain=new THREE.Group();
  fountain.position.set(0,plazaY,9.5);
  cylinder(fountain,1.55,1.7,.55,stone,0,.27,0,40);
  cylinder(fountain,1,1.15,.35,material(0xc3a469),0,.71,0,32);
  cube(fountain,1.45,1.02,.15,parchment,0,1.52,0);
  cube(fountain,.28,.20,.035,material(0xb8655c),0,1.52,-.10);
  scene.add(fountain);

  function fallbackTree(x:number,z:number,seed:number,canopy=false):any{
    const group=new THREE.Group();
    group.position.set(x,groundHeight(x,z),z);
    const height=6.5+(seed%7)*.44;
    cylinder(group,.15,.22,height*.64,timber,0,height*.32,0,11);
    if(canopy){
      for(const [dx,dy,dz] of [[0,.77,0],[-.8,.67,0],[.8,.70,-.13],[0,.69,.68]]){
        const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(1.35,2),material(0x4a7650));
        mesh.scale.set(1.15,.8,1.05);mesh.position.set(dx,height*dy,dz);
        mesh.castShadow=!lowPower;group.add(mesh);
      }
    }else for(let i=0;i<4;i++){
      const needle=new THREE.Mesh(new THREE.ConeGeometry(1.85-i*.26,height*.34,11),material(i%2?0x365c4a:0x2f6248));
      needle.position.y=height*(.46+i*.135);needle.castShadow=!lowPower;group.add(needle);
    }
    scene.add(group);return group;
  }
  function fallbackHouse(x:number,z:number,style:'post'|'library'){
    const group=new THREE.Group();
    group.position.set(x,groundHeight(x,z),z);
    cube(group,9,5.5,7,style==='post'?material(0xd6bd94):material(0xccb08b),0,2.75,0);
    for(const side of [-1,1]){
      const roof=cube(group,5.9,.29,8.2,roofMat,side*2.36,6.4,0);
      roof.rotation.z=side*.55;
      cube(group,1.1,1.3,.15,material(0xa5bbbc),side*2.4,3.5,-3.58);
    }
    cube(group,1.3,2.25,.2,darkWood,0,1.15,-3.62);
    cube(group,3.2,.55,.2,parchment,0,4.8,-3.7);
    scene.add(group);return group;
  }
  const houses:[number,number,'post'|'library'][]=[[-17,-11,'post'],[17,-14,'library']];
  const houseFallbacks=houses.map(([hx,hz,style])=>fallbackHouse(hx,hz,style));
  const scenicCottageCollisions:Array<[number,number]> = [];
  const forest:{name:'pine'|'canopy';group:any;position:[number,number];yaw:number}[]=[];
  let randomSeed=348915;
  const rand=()=>{randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0;return randomSeed/4294967296;};
  const forestBudget=softwareProfile?6:lowPower?12:28;
  for(let i=0;i<forestBudget*2&&forest.length<forestBudget;i++){
    const tx=rand()*91-45,tz=rand()*83-43;
    // Low-power mode skips the canopy download, so use detailed imported pines
    // rather than leaving spherical placeholder canopy trees on mobile.
    const kind: 'pine'|'canopy'=lowPower?'pine':rand()<.73?'pine':'canopy';
    const yaw=rand()*Math.PI*2;
    if((Math.abs(tx)<11&&tz>-17)||Math.hypot(tx+17,tz+11)<12||
      Math.hypot(tx-17,tz+14)<12||Math.hypot(tx-14,tz+28)<10)continue;
    const group=fallbackTree(tx,tz,i,kind==='canopy');
    group.rotation.y=yaw;
    forest.push({name:kind,group,position:[tx,tz],yaw});
  }
  // Rock/fern/flower details in the foreground, with no screenshot textures.
  const rockMat=material(0x989b8b);
  const grassTuft=material(0x447449);
  for(let i=0;i<(lowPower?30:88);i++){
    const xx=rand()*87-43,zz=rand()*80-39;
    if(Math.abs(xx)<3.5&&zz>5)continue;
    const y=groundHeight(xx,zz);
    if(i%4===0){
      const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.25+rand()*.55,1),rockMat);
      rock.scale.set(1.2,.56,.85);rock.position.set(xx,y+.21,zz);rock.castShadow=!lowPower;scene.add(rock);
    }else{
      const plant=new THREE.Mesh(new THREE.ConeGeometry(.20,.43,5),grassTuft);
      plant.position.set(xx,y+.2,zz);scene.add(plant);
    }
  }
  // One draw call per botanical family keeps grass lush without the huge GPU
  // overhead of thousands of individual meshes. Respect all paths and buildings.
  const meadow=addApoLandscapeDetail(THREE,scene,{lowPower,softwareProfile,groundHeight});
  canvas.dataset.apoGrassCount=String(meadow.grassCount);
  canvas.dataset.apoFernCount=String(meadow.fernCount);
  canvas.dataset.apoStoneCount=String(meadow.rockCount);
  // Keep first 3D frame fast: village embellishments are attached only
  // after the first successful render, never during startup on software WebGL.
  let villageArtFrame=0,groundSurfaceFrame=0;

  // High-resolution continuous massif replaces the old repeated cone mountains.
  // Distinct broad ridges, ridgeline erosion and an uplifted summit create a
  // Mt. Apo-inspired highland silhouette without any image-plane backdrop.
  const massifGeo=new THREE.PlaneGeometry(250,128,112,56);
  massifGeo.rotateX(-Math.PI/2);
  const mountains=massifGeo.attributes.position, mountainTint:number[]=[];
  const valleyGreen=new THREE.Color(0x365c4a);
  const mountainSlate=new THREE.Color(0x71827d);
  const summitStone=new THREE.Color(0xa5a399);
  const bell=(x:number,z:number,cx:number,cz:number,rx:number,rz:number,h:number)=>{
    const dx=(x-cx)/rx,dz=(z-cz)/rz;
    return h*Math.exp(-.65*(dx*dx+dz*dz));
  };
  for(let i=0;i<mountains.count;i++){
    const mx=mountains.getX(i),mz=mountains.getZ(i)-127;
    const near=clamp((-mz-65)/40,0,1);
    const shoulder=near*near*(3-2*near);
    const peaks=bell(mx,mz,-58,-139,48,48,45)
      +bell(mx,mz,2,-146,51,52,71)+bell(mx,mz,64,-137,50,51,51)
      +bell(mx,mz,19,-170,63,37,24);
    const ridges=(Math.sin(mx*.14+mz*.067)*3.8+
      Math.cos(mx*.28-mz*.095)*2.0+Math.sin(mx*.41+mz*.33)*1.1);
    const elevation=Math.max(0,(peaks+ridges)*shoulder);
    mountains.setY(i,elevation);
    const color=valleyGreen.clone().lerp(mountainSlate,clamp((elevation-10)/36,0,1))
      .lerp(summitStone,clamp((elevation-48)/32,0,1));
    mountainTint.push(color.r,color.g,color.b);
  }
  massifGeo.setAttribute('color',new THREE.Float32BufferAttribute(mountainTint,3));
  massifGeo.computeVertexNormals();
  const massif=new THREE.Mesh(massifGeo,new THREE.MeshStandardMaterial({
    vertexColors:true,roughness:1,metalness:0,side:THREE.DoubleSide
  }));
  massif.receiveShadow=true;scene.add(massif);

  const playerAnchor=new THREE.Group();scene.add(playerAnchor);
  const defaultOutfit=material(0x49604b);
  function fallbackHuman(){
    const body=new THREE.Group();
    cylinder(body,.38,.29,.99,defaultOutfit,0,1.12,0,16);
    const skin=material(0xc38e72);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.24,19,13),skin);
    head.position.set(0,1.95,0);body.add(head);
    for(const side of [-1,1]){
      cylinder(body,.11,.13,.73,material(0x3b3e39),side*.19,.37,0,12);
      cylinder(body,.105,.10,.66,defaultOutfit,side*.46,1.26,0,12);
    }
    return body;
  }
  const fallbackPlayer=fallbackHuman();playerAnchor.add(fallbackPlayer);
  let chosenAvatar:WorldAvatar='explorer';
  let currentPlayerModel:any=null;
  const realModels:Partial<Record<ApoAssetName,ModelRecord>>={};
  const npcModels:{name:'alexis'|'iver';position:[number,number];fallback:any}[]=[
    {name:'alexis',position:[-5,3],fallback:fallbackHuman()},
    {name:'iver',position:[6,1],fallback:fallbackHuman()},
  ];
  for(const npc of npcModels){
    npc.fallback.position.set(npc.position[0],groundHeight(...npc.position),npc.position[1]);
    scene.add(npc.fallback);
  }

  function setModelActions(record:ModelRecord,state:'idle'|'walk'|'run'){
    if(!record.mixer||!record.clips.length)return;
    if(record.activeName===state)return;
    const pattern=state==='idle'?/(idle|standing|breath)/i:
      state==='walk'?/(walk|walking|locomotion)/i:/(run|running|sprint)/i;
    const clip=record.clips.find((c:any)=>pattern.test(c.name)) ||
      record.clips.find((c:any)=>/(idle|walk|run)/i.test(c.name))||record.clips[0];
    if(!clip)return;
    const action=record.mixer.clipAction(clip);
    if(record.activeAction!==action){
      action.reset().fadeIn(.2).play();
      record.activeAction?.fadeOut(.2);
      record.activeAction=action;
    }
    record.activeName=state;
  }
  function selectedModel(){
    const next=realModels[chosenAvatar]?.object||fallbackPlayer;
    if(next===currentPlayerModel)return;
    if(currentPlayerModel)playerAnchor.remove(currentPlayerModel);
    playerAnchor.add(next);currentPlayerModel=next;
  }
  currentPlayerModel=fallbackPlayer;

  let disposed=false,frame=0,lastFrame=0,lastUpdate=0;
  const buttons:Record<WorldMove,boolean>={forward:false,back:false,left:false,right:false,sprint:false};
  const keyboard:Record<WorldMove,boolean>={forward:false,back:false,left:false,right:false,sprint:false};
  const recent:Record<WorldMove,number>={forward:0,back:0,left:0,right:0,sprint:0};
  const keyMap:Record<string,WorldMove>={w:'forward',arrowup:'forward',s:'back',arrowdown:'back',a:'left',arrowleft:'left',d:'right',arrowright:'right',shift:'sprint'};
  const clearInput=()=>{for(const key of Object.keys(buttons) as WorldMove[]){buttons[key]=false;keyboard[key]=false;}};
  let x=0,z=18,orbit=0,distance=7.6,avatarYaw=0,jumpHeight=0,jumpSpeed=0;
  let pointerId:number|null=null,lastPointerX=0,nearId:WorldLandmark['id']|null=null;
  const keyDown=(e:KeyboardEvent)=>{
    const el=e.target as HTMLElement|null;
    if(e.altKey||e.ctrlKey||e.metaKey||el?.isContentEditable||el?.closest('input,textarea,button,a,select,[role="dialog"]'))return;
    const dir=keyMap[e.key.toLowerCase()];
    if(dir){keyboard[dir]=true;recent[dir]=performance.now();e.preventDefault();}
    if(e.key.toLowerCase()==='e'&&!e.repeat){interact();e.preventDefault();}
    if((e.key===' '||e.key==='Spacebar')&&!e.repeat){jump();e.preventDefault();}
  };
  const keyUp=(e:KeyboardEvent)=>{const dir=keyMap[e.key.toLowerCase()];if(dir)keyboard[dir]=false;};
  const hidden=()=>{if(document.hidden)clearInput();};
  const wheel=(e:WheelEvent)=>{e.preventDefault();distance=clamp(distance+e.deltaY*.009,5.5,14);};
  const pointerDown=(e:PointerEvent)=>{pointerId=e.pointerId;lastPointerX=e.clientX;try{canvas.setPointerCapture(e.pointerId);}catch{}};
  const pointerMove=(e:PointerEvent)=>{if(pointerId!==e.pointerId)return;orbit=clamp(orbit-(e.clientX-lastPointerX)*.005,-2.6,2.6);lastPointerX=e.clientX;};
  const pointerUp=(e:PointerEvent)=>{if(pointerId===e.pointerId)pointerId=null;};
  const onContextMenu=(e:Event)=>{e.preventDefault();clearInput();};
  const jump=()=>{if(jumpHeight===0&&jumpSpeed===0)jumpSpeed=5.8;};
  const nearby=()=>WORLD_LANDMARKS.reduce<WorldLandmark|null>((best,entry)=>{
    const dist=Math.hypot(entry.x-x,entry.z-z);
    if(dist>=entry.radius)return best;
    return !best||dist<Math.hypot(best.x-x,best.z-z)?entry:best;
  },null);
  const interact=()=>events.onInteract(nearby());
  window.addEventListener('keydown',keyDown);
  window.addEventListener('keyup',keyUp);
  window.addEventListener('blur',clearInput);
  window.addEventListener('pagehide',clearInput);
  window.addEventListener('contextmenu',clearInput,true);
  document.addEventListener('visibilitychange',hidden);
  canvas.addEventListener('pointerdown',pointerDown);
  canvas.addEventListener('pointermove',pointerMove);
  canvas.addEventListener('pointerup',pointerUp);
  canvas.addEventListener('pointercancel',pointerUp);
  canvas.addEventListener('contextmenu',onContextMenu);
  canvas.addEventListener('wheel',wheel,{passive:false});
  const resize=()=>{
    const rect=canvas.getBoundingClientRect(),w=Math.max(1,rect.width),h=Math.max(1,rect.height);
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  };
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;
  if(observer)observer.observe(canvas);else window.addEventListener('resize',resize);
  resize();

  const loader=new GLTFLoader();
  loader.setCrossOrigin('anonymous');
  const modelLoads=(Object.keys(APO_MODEL_ASSETS) as ApoAssetName[]);
  // Even on mobile, NPCs must use authored characters rather than primitive cylinders.
  // Keep one canopy variant optional to constrain texture downloads on low-memory devices.
  const allowed=lowPower?modelLoads.filter(n=>n!=='canopy'):modelLoads;
  const priority:ApoAssetName[]=['explorer','postOffice','pine','alexis','iver','library','ranger','traveler','canopy'];
  const toLoad=priority.filter(name=>allowed.includes(name));
  const loaded=new Set<ApoAssetName>();
  // Each authored GLB retains skinned hierarchy and texture maps under GLTFLoader.
  const loadOne=async(name:ApoAssetName)=>{
    const spec=APO_MODEL_ASSETS[name];
    const gltf=await loader.loadAsync(spec.url);
    if(disposed)return;
    const root=gltf.scene;
    const bounds=new THREE.Box3().setFromObject(root);
    const span=Math.max(.001,bounds.max.y-bounds.min.y);
    root.scale.multiplyScalar(spec.height/span);
    root.updateMatrixWorld(true);
    const scaled=new THREE.Box3().setFromObject(root);
    root.position.x-=(scaled.min.x+scaled.max.x)/2;
    root.position.z-=(scaled.min.z+scaled.max.z)/2;
    root.position.y-=scaled.min.y;
    root.rotation.y=Math.PI;
    root.traverse((child:any)=>{
      if(child.isMesh||child.isSkinnedMesh){child.castShadow=!lowPower;child.receiveShadow=true;
        if(child.material){const mats=Array.isArray(child.material)?child.material:[child.material];for(const m of mats){m.side=THREE.DoubleSide;}}}
    });
    // A separate pivot preserves normalized foot-ground offsets when a model
    // is placed in the village. Animations still target its original GLTF root.
    const pivot=new THREE.Group();
    pivot.add(root);
    const mixer=gltf.animations?.length?new THREE.AnimationMixer(root):null;
    const record:ModelRecord={object:pivot,mixer,clips:gltf.animations||[],activeAction:null,activeName:''};
    realModels[name]=record;
    if(name==='explorer'||name==='ranger'||name==='traveler'){
      if(name===chosenAvatar){
        selectedModel();
        canvas.dataset.apoPlayerModel=name;
      }
      setModelActions(record,'idle');
    } else if(name==='alexis'||name==='iver'){
      const npc=npcModels.find(item=>item.name===name);
      if(npc){
        scene.remove(npc.fallback);
        pivot.position.set(npc.position[0],groundHeight(...npc.position),npc.position[1]);
        scene.add(pivot);
        setModelActions(record,'idle');
      }
    } else if(name==='postOffice'||name==='library'){
      const ix=name==='postOffice'?0:1;
      scene.remove(houseFallbacks[ix]);
      const [hx,hz]=houses[ix];
      pivot.position.set(hx,groundHeight(hx,hz),hz);scene.add(pivot);
      // Additional authored stone/timber houses reuse the downloaded GLB
      // hierarchy; no extra model requests or placeholder box houses.
      const cottages=softwareProfile?[]:
        SCENIC_COTTAGES.filter((_c,i)=>(name==='postOffice'?i<2:i>=2) && (!lowPower||i%2===0));
      for(const cottage of cottages){
        const copy=pivot.clone(true);
        copy.position.set(cottage.x,groundHeight(cottage.x,cottage.z),cottage.z);
        copy.rotation.y=cottage.rotation;
        copy.scale.setScalar(cottage.scale);
        copy.name='Apo scenic timber cottage';
        scene.add(copy);
        scenicCottageCollisions.push([cottage.x,cottage.z]);
      }
      canvas.dataset.apoScenicCottages=String(scenicCottageCollisions.length);
    }else if(name==='pine'||name==='canopy'){
      for(const tree of forest){
        if(tree.name!==name)continue;
        scene.remove(tree.group);
        const instance=pivot.clone(true);
        instance.position.set(tree.position[0],groundHeight(...tree.position),tree.position[1]);
        instance.rotation.y=tree.yaw;
        scene.add(instance);
      }
    }
    loaded.add(name);events.onAssets?.(loaded.size,toLoad.length);
  };
  // Decode at most two imported models concurrently. Loading nine 2MB files
  // simultaneously can freeze software WebGL and even block HTML UI clicks.
  let nextModel=0;
  const worker=async()=>{
    while(!disposed && nextModel<toLoad.length){
      const name=toLoad[nextModel++];
      try{await loadOne(name);}catch{/* Use the native geometry fallback. */}
    }
  };
  void Promise.allSettled([worker(),worker()]).then(()=>{
    if(!disposed)events.onAssets?.(loaded.size,toLoad.length);
  });

  let ready=false,previousTime=0;
  const render=(time:number)=>{
    if(disposed)return;
    if(!ownsCanvas()||(events.isCurrent&&!events.isCurrent())){
      dispose();return;
    }
    frame=window.requestAnimationFrame(render);
    // Software rasterizers can block the DOM thread; 12 FPS is still enough
    // to exercise controls and show a smooth-enough low-power fallback.
    const interval=softwareProfile?1000/12:lowPower?1000/22:1000/40;
    if(previousTime&&time-previousTime<interval)return;
    const dt=Math.min(.05,(time-lastFrame)/1000||.016);
    lastFrame=time;previousTime=time;
    if(document.hidden)return;
    const now=performance.now();
    for(const move of Object.keys(keyboard) as WorldMove[]){
      if(keyboard[move]&&now-recent[move]>2200)keyboard[move]=false;
    }
    const input=(key:WorldMove)=>Number(keyboard[key]||buttons[key]);
    const f=input('forward')-input('back'),side=input('right')-input('left'),mag=Math.hypot(f,side);
    if(mag){
      const fx=Math.sin(orbit),fz=-Math.cos(orbit),sx=Math.cos(orbit),sz=Math.sin(orbit);
      const dx=(side*sx+f*fx)/mag,dz=(side*sz+f*fz)/mag;
      const speed=input('sprint')?7.4:4.4;
      const blocked=(px:number,pz:number)=>
        houses.some(([bx,bz])=>Math.hypot(px-bx,pz-bz)<5.3) ||
        scenicCottageCollisions.some(([bx,bz])=>Math.hypot(px-bx,pz-bz)<3.9);
      const nx=clamp(x+dx*speed*dt,-36,36),nz=clamp(z+dz*speed*dt,-33,32);
      if(!blocked(nx,z))x=nx;if(!blocked(x,nz))z=nz;
      avatarYaw=Math.atan2(-dx,-dz);
    }
    if(jumpHeight>0||jumpSpeed>0){
      jumpHeight=Math.max(0,jumpHeight+jumpSpeed*dt);
      jumpSpeed=jumpHeight===0?0:jumpSpeed-15.4*dt;
    }
    playerAnchor.position.set(x,groundHeight(x,z)+jumpHeight,z);
    playerAnchor.rotation.y=avatarYaw;
    const motion=mag?(input('sprint')?'run':'walk'):'idle';
    for(const [name,record] of Object.entries(realModels)){
      if(record?.mixer){
        if(name===chosenAvatar)setModelActions(record,motion);
        record.mixer.update(events.reduceMotion?0:dt);
      }
    }
    camera.position.set(x+Math.sin(orbit)*distance,groundHeight(x,z)+distance*.36+2.0,z+Math.cos(orbit)*distance);
    camera.lookAt(x,groundHeight(x,z)+1.55,z-1.5);
    meadow.update(time*.001);
    try{
      renderer.render(scene,camera);
    }catch(cause){
      // Never silently advertise a playable 3D scene if the GPU render fails.
      const reason=cause instanceof Error?cause.message:String(cause);
      canvas.dataset.apoRenderError=reason.slice(0,250);
      console.error('Apo Letter World: Three.js frame could not render',cause);
      try{dispose();}catch{/* The route can still show a safe error state. */}
      events.onError('The 3D graphics device could not complete a frame. Please reload or try another browser.');
      return;
    }
    if(!ready){
      canvas.dataset.apoRenderer='three';
      ready=true;events.onReady();
      villageArtFrame=window.requestAnimationFrame(()=>{
        if(disposed)return;
        try{
          const detail=buildApoVillageArt(THREE,scene,{groundHeight,lowPower,softwareProfile});
          canvas.dataset.apoVillageLanterns=String(detail.lanternCount);
          canvas.dataset.apoVillageFlowers=String(detail.flowerCount);
          canvas.dataset.apoVillageSignage='2';
        }catch(error){
          console.error('Apo World optional village art could not initialize',error);
        }
        // Avoid a startup stall on mobile software GPU: apply colour and bump
        // texture maps on a later frame, after the game is already interactive.
        groundSurfaceFrame=window.requestAnimationFrame(()=>{
          if(disposed||!ownsCanvas())return;
          try{
            const surface=enhanceApoGroundMaterials(THREE,grassMaterial,pathMaterial,{lowPower,softwareProfile});
            canvas.dataset.apoTerrainTextures=String(surface.textureCount);
            canvas.dataset.apoTerrainTile=String(surface.tileSize);
          }catch(error){
            console.warn('Apo World ground texture fallback',error);
          }
        });
      });
    }
    const nearest=nearby();
    if(nearest?.id!==nearId){nearId=nearest?.id||null;events.onNearby(nearest);}
    if(time-lastUpdate>170){lastUpdate=time;events.onPosition({x:Math.round(x*10)/10,z:Math.round(z*10)/10});}
  };
  frame=window.requestAnimationFrame(render);
  const reset=()=>{x=0;z=18;orbit=0;avatarYaw=0;jumpHeight=0;jumpSpeed=0;clearInput();};
  const dispose=()=>{
    if(disposed)return;disposed=true;
    window.cancelAnimationFrame(frame);
    window.cancelAnimationFrame(villageArtFrame);
    window.cancelAnimationFrame(groundSurfaceFrame);
    window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);
    window.removeEventListener('blur',clearInput);window.removeEventListener('pagehide',clearInput);
    window.removeEventListener('contextmenu',clearInput,true);
    document.removeEventListener('visibilitychange',hidden);
    canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);
    canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerUp);
    canvas.removeEventListener('contextmenu',onContextMenu);canvas.removeEventListener('wheel',wheel);
    observer?.disconnect();window.removeEventListener('resize',resize);
    for(const record of Object.values(realModels))record?.mixer?.stopAllAction();
    // Dispose shared geometries, materials and all attached maps exactly once.
    const geometrySet=new Set<any>(),materialSet=new Set<any>(),textureSet=new Set<any>();
    const collect=(object:any)=>{
      if(object.geometry?.dispose)geometrySet.add(object.geometry);
      const materials=object.material?(Array.isArray(object.material)?object.material:[object.material]):[];
      for(const material of materials){
        if(!material?.dispose)continue;
        materialSet.add(material);
        for(const value of Object.values(material)){
          if((value as any)?.isTexture && (value as any).dispose)textureSet.add(value);
        }
      }
    };
    scene.traverse(collect);
    for(const record of Object.values(realModels))record?.object?.traverse(collect);
    for(const fallback of [...houseFallbacks,...forest.map(tree=>tree.group),fallbackPlayer])
      fallback?.traverse(collect);
    for(const texture of textureSet)texture.dispose();
    for(const material of materialSet)material.dispose();
    for(const geometry of geometrySet)geometry.dispose();
    renderer.dispose();
    if(ownsCanvas()){
      delete canvas.dataset.apoRendererOwner;
      delete canvas.dataset.apoRenderer;
      delete canvas.dataset.apoPlayerModel;
      delete canvas.dataset.apoGrassCount;
      delete canvas.dataset.apoFernCount;
      delete canvas.dataset.apoStoneCount;
      delete canvas.dataset.apoVillageLanterns;
      delete canvas.dataset.apoVillageFlowers;
      delete canvas.dataset.apoVillageSignage;
      delete canvas.dataset.apoScenicCottages;
      delete canvas.dataset.apoTerrainTextures;
      delete canvas.dataset.apoTerrainTile;
    }
  };
  return {
    setMove:(move,active)=>{buttons[move]=active;},
    setAvatar:(avatar)=>{
      chosenAvatar=avatar;selectedModel();
      if(realModels[avatar])canvas.dataset.apoPlayerModel=avatar;
      else delete canvas.dataset.apoPlayerModel;
    },
    jump,interact,reset,dispose
  };
}
