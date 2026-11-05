/** Apo Letter World: independent WebGL 3D scene. No flat backdrop or CDN libraries. */
export type LandmarkId='post'|'library'|'capsule'|'alexis'|'iver';
export type Direction='forward'|'back'|'left'|'right'|'sprint';
export type Snapshot={x:number;z:number;nearby:LandmarkId|null;moving:boolean};
export type Landmark={id:LandmarkId;name:string;description:string;x:number;z:number;radius:number;action:string};
export const LANDMARKS:Landmark[]=[
 {id:'post',name:'Letter Post Office',description:'Write and send your own letter.',x:-12,z:-6,radius:5,action:'Write a letter'},
 {id:'library',name:'Community Library',description:'Explore published letters from fellow writers.',x:13,z:-6,radius:5,action:'Browse public letters'},
 {id:'capsule',name:'Time Capsule Garden',description:'Revisit your scheduled letters.',x:18,z:13,radius:5,action:'View time capsules'},
 {id:'alexis',name:'Alexis',description:'Welcome! Try WASD to walk, Shift to run, and E to interact.',x:-4,z:5,radius:3.6,action:'Talk to Alexis'},
 {id:'iver',name:'Iver',description:'Every letter is a new adventure. Find the village Post Office!',x:4,z:5,radius:3.6,action:'Talk to Iver'},
];
export type WorldGame={hold:(d:Direction,down:boolean)=>void;rotate:(delta:number)=>void;travel:(id:LandmarkId)=>void;interact:()=>void;current:()=>Snapshot;dispose:()=>void};
type V=[number,number,number];type Color=[number,number,number];type MeshData={vertices:Float32Array;count:number};
const C={
 grass:[.37,.65,.33] as Color,path:[.80,.70,.51] as Color,
 cream:[.91,.84,.70] as Color,wood:[.45,.29,.21] as Color,
 dark:[.27,.20,.17] as Color,roof:[.25,.44,.34] as Color,
 pine:[.13,.39,.31] as Color,leaf:[.22,.51,.38] as Color,
 yellow:[1,.80,.49] as Color,rose:[.94,.49,.47] as Color,
 stone:[.68,.68,.60] as Color,snow:[.93,.95,.92] as Color,
};
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const height=(x:number,z:number)=>Math.sin(x*.23)*Math.cos(z*.17)*.17+Math.sin(x*.41+z*.19)*.08;
const norm=(a:V):V=>{const n=Math.hypot(...a)||1;return[a[0]/n,a[1]/n,a[2]/n]};
const minus=(a:V,b:V):V=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const cross=(a:V,b:V):V=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a:V,b:V)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const tint=(c:Color,n:number):Color=>[clamp(c[0]*n,0,1),clamp(c[1]*n,0,1),clamp(c[2]*n,0,1)];
class Mesh{
 a:number[]=[];
 tri(p:V,q:V,r:V,c:Color){const n=norm(cross(minus(q,p),minus(r,p)));for(const v of [p,q,r])this.a.push(...v,...n,...c)}
 quad(p:V,q:V,r:V,s:V,c:Color){this.tri(p,q,r,c);this.tri(p,r,s,c)}
 box(x:number,y:number,z:number,w:number,h:number,d:number,c:Color){
  const l=x-w/2,r=x+w/2,f=z+d/2,b=z-d/2,t=y+h;
  this.quad([l,y,f],[r,y,f],[r,t,f],[l,t,f],c);
  this.quad([r,y,b],[l,y,b],[l,t,b],[r,t,b],c);
  this.quad([l,y,b],[l,y,f],[l,t,f],[l,t,b],c);
  this.quad([r,y,f],[r,y,b],[r,t,b],[r,t,f],c);
  this.quad([l,t,f],[r,t,f],[r,t,b],[l,t,b],c);
  this.quad([l,y,b],[r,y,b],[r,y,f],[l,y,f],c);
 }
 cone(x:number,y:number,z:number,r:number,h:number,c:Color,n=9){
  for(let i=0;i<n;i++){const a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n;
   this.tri([x+r*Math.cos(a),y,z+r*Math.sin(a)],[x+r*Math.cos(b),y,z+r*Math.sin(b)],[x,y+h,z],c)}
 }
 cylinder(x:number,y:number,z:number,r:number,h:number,c:Color,n=10){
  for(let i=0;i<n;i++){const a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n;
   const p:V=[x+r*Math.cos(a),y,z+r*Math.sin(a)],q:V=[x+r*Math.cos(b),y,z+r*Math.sin(b)];
   this.quad(p,q,[q[0],y+h,q[2]],[p[0],y+h,p[2]],c);
   this.tri([x,y+h,z],[p[0],y+h,p[2]],[q[0],y+h,q[2]],c)}
 }
 sphere(x:number,y:number,z:number,rx:number,ry:number,rz:number,c:Color,rows=7,cols=10){
  const p=(a:number,b:number):V=>[x+rx*Math.sin(a)*Math.cos(b),y+ry*Math.cos(a),z+rz*Math.sin(a)*Math.sin(b)];
  for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){
   const a=i*Math.PI/rows,b=(i+1)*Math.PI/rows,d=j*2*Math.PI/cols,e=(j+1)*2*Math.PI/cols;
   this.quad(p(a,d),p(a,e),p(b,e),p(b,d),c)
  }
 }
 get data():MeshData{const vertices=new Float32Array(this.a);return{vertices,count:vertices.length/9}}
}
function path(m:Mesh,pts:Array<[number,number]>,w:number){
 for(let i=0;i<pts.length-1;i++){
  const [x,z]=pts[i],[xx,zz]=pts[i+1],l=Math.hypot(xx-x,zz-z)||1;
  const dx=(zz-z)*w/(2*l),dz=-(xx-x)*w/(2*l);
  m.quad([x+dx,height(x,z)+.08,z+dz],[x-dx,height(x,z)+.08,z-dz],
   [xx-dx,height(xx,zz)+.08,zz-dz],[xx+dx,height(xx,zz)+.08,zz+dz],C.path);
 }
}
function pine(m:Mesh,x:number,z:number,s:number){
 const y=height(x,z);m.cylinder(x,y,z,.15*s,1.5*s,C.wood,6);
 for(let n=0;n<3;n++)m.cone(x,y+(.8+n*.66)*s,z,(1.23-n*.19)*s,2.22*s,n%2?C.leaf:C.pine,8);
}
function flower(m:Mesh,x:number,z:number,c:Color){
 const y=height(x,z);m.box(x,y,z,.06,.29,.06,C.leaf);m.sphere(x,y+.31,z,.14,.14,.14,c,4,6);
}
function lamp(m:Mesh,x:number,z:number){
 const y=height(x,z);m.cylinder(x,y,z,.1,2.2,C.wood,6);
 m.box(x,y+2.1,z,.52,.65,.52,C.yellow);m.cone(x,y+2.74,z,.42,.45,C.roof,6);
}
function mailbox(m:Mesh,x:number,z:number){
 const y=height(x,z);m.box(x,y,z,.18,1.0,.18,C.wood);
 m.box(x,y+.94,z,.84,.65,.58,C.cream);
 m.box(x,y+1.22,z+.32,.52,.09,.07,C.rose);
 m.cone(x,y+1.56,z,.47,.34,C.roof,4);
}
function cottage(m:Mesh,x:number,z:number,s:number,roof:Color){
 const y=height(x,z),w=6.8*s,d=6.3*s,wh=3.5*s,rh=6.55*s;
 m.box(x,y,z,w,wh,d,C.cream);
 const f=z+d/2+.25*s,b=z-d/2-.25*s;
 m.quad([x-w*.59,y+wh,f],[x-w*.59,y+wh,b],[x,y+rh,b],[x,y+rh,f],roof);
 m.quad([x,y+rh,f],[x,y+rh,b],[x+w*.59,y+wh,b],[x+w*.59,y+wh,f],tint(roof,.78));
 m.tri([x-w/2,y+wh,z+d/2],[x+w/2,y+wh,z+d/2],[x,y+rh,z+d/2],C.wood);
 m.box(x,y,z+d/2+.10*s,1.5*s,2.45*s,.18*s,C.dark);
 for(const side of [-1,1]){
  m.box(x+side*2.25*s,y+1.27*s,z+d/2+.16*s,1.0*s,1.45*s,.12*s,C.wood);
  m.box(x+side*2.25*s,y+1.42*s,z+d/2+.24*s,.73*s,1.08*s,.07*s,C.yellow);
  m.box(x+side*2.25*s,y+1.42*s,z+d/2+.30*s,.07*s,1.1*s,.05*s,C.cream);
 }
 m.box(x,y,z+d/2+.48*s,w,.22*s,1.2*s,C.stone);
 m.box(x,y+wh,z+d/2+.20*s,w*1.06,.26*s,.40*s,C.wood);
}
function mountain(m:Mesh,x:number,z:number,rx:number,rz:number,peak:number,shade:Color){
 const n=14,ring=(i:number,f:number,y:number):V=>{
  const a=i*2*Math.PI/n,jag=1+.10*Math.sin(i*7.8+x*.2);
  return[x+Math.cos(a)*rx*f*jag,y,z+Math.sin(a)*rz*f*jag];
 };
 for(let i=0;i<n;i++){
  const j=(i+1)%n;
  m.quad(ring(i,1,-3),ring(j,1,-3),ring(j,.57,peak*.45),ring(i,.57,peak*.45),tint(shade,i%2?.85:1.04));
  m.quad(ring(i,.57,peak*.45),ring(j,.57,peak*.45),ring(j,.22,peak*.80),ring(i,.22,peak*.80),tint(shade,i%2?1.15:.92));
  m.tri(ring(i,.22,peak*.80),ring(j,.22,peak*.80),[x,peak,z],i%3?C.snow:tint(C.snow,.79));
 }
}
function chibi(m:Mesh,x:number,z:number,kind:'iver'|'alexis'|'player',local=false){
 const y=local?0:height(x,z),X=local?0:x,Z=local?0:z;
 const skin:Color=[.95,.74,.60],hair:Color=[.13,.11,.13],shirt:Color=kind==='alexis'?[.33,.36,.42]:[.14,.15,.18];
 m.sphere(X,y+1.35,Z,.62,.65,.45,shirt);
 m.box(X,y+.75,Z+.50,1.1,1.08,.34,[.17,.18,.19]);
 m.sphere(X,y+2.28,Z-.06,.79,.74,.65,skin,8,12);
 m.sphere(X,y+2.75,Z-.04,.84,.27,.67,hair,5,11);
 if(kind==='alexis'){m.sphere(X,y+2.94,Z,.83,.32,.69,[.16,.15,.16],5,11);m.box(X,y+1.49,Z-.43,.12,.75,.06,[.22,.47,.78]);}
 for(const side of [-1,1]){
  m.sphere(X+side*.36,y+2.26,Z-.69,.11,.13,.09,hair,5,7);
  m.sphere(X+side*.50,y+2.07,Z-.63,.14,.08,.055,[.88,.54,.53],4,7);
  m.sphere(X+side*.64,y+1.37,Z-.02,.25,.39,.28,skin,6,8);
  m.box(X+side*.29,y+.2,Z,.43,.78,.49,kind==='alexis'?[.26,.28,.42]:[.41,.42,.45]);
  m.sphere(X+side*.29,y+.18,Z-.24,.33,.20,.52,[.94,.89,.81],5,9);
 }
}
function scene():MeshData{
 const m=new Mesh(),random=(()=>{let seed=903;return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}})();
 const cell=56,e=35;
 for(let i=0;i<cell;i++)for(let j=0;j<cell;j++){
  const x=-e+2*e*i/cell,xx=-e+2*e*(i+1)/cell,z=-e+2*e*j/cell,zz=-e+2*e*(j+1)/cell;
  m.quad([x,height(x,z),z],[xx,height(xx,z),z],[xx,height(xx,zz),zz],[x,height(x,zz),zz],tint(C.grass,.95+.09*Math.sin(i*.89+j*.71)));
 }
 mountain(m,-32,-76,31,19,27,[.27,.41,.39]);
 mountain(m,4,-87,29,21,37,[.31,.43,.43]);
 mountain(m,39,-83,33,22,29,[.30,.45,.41]);
 m.sphere(0,-.32,-29,20,.05,9,[.34,.68,.72],3,24);
 path(m,[[0,24],[0,17],[-2,9],[0,0],[-6,-4],[-12,-6]],2.7);
 path(m,[[0,0],[7,-3],[13,-6]],2.9);
 path(m,[[0,17],[8,15],[18,13]],2.4);
 m.cylinder(0,height(0,0)-.07,0,5.0,.23,C.stone,24);
 m.cylinder(0,height(0,0)+.16,0,4.0,.06,C.path,24);
 m.cylinder(0,height(0,0)+.22,0,1.3,.3,C.cream,14);
 m.box(0,.5,0,.25,2.2,.25,C.wood);m.box(0,2.66,0,1.9,1.13,.17,C.cream);
 cottage(m,-15,-13,1.04,C.roof);cottage(m,15,-13,1.04,[.39,.36,.27]);cottage(m,23,18,.70,C.leaf);
 for(const [x,z] of [[-12,-6],[13,-6],[18,13]]){m.cylinder(x,height(x,z),z,1.55,.08,C.yellow,15);}
 for(const [x,z] of [[-8,-7],[-5,-3],[8,-3],[12,-6],[8,14],[20,13],[-11,14],[-6,17]])lamp(m,x,z);
 for(const [x,z] of [[-10,-2],[-6,10],[-18,-6],[11,3],[16,-3],[20,18],[-3,23]])mailbox(m,x,z);
 for(let i=0;i<140;i++){
  const x=-33+random()*66,z=-33+random()*66;
  if(Math.abs(x)<7&&z>-10&&z<30)continue;
  if(Math.hypot(x+15,z+13)<10||Math.hypot(x-15,z+13)<10||Math.hypot(x-23,z-18)<7)continue;
  if(Math.hypot(x+12,z+6)<6||Math.hypot(x-13,z+6)<6)continue;
  if(z<-25&&Math.abs(x)<20)continue;
  pine(m,x,z,.75+random()*1.4);
 }
 for(let i=0;i<154;i++){
  const x=-29+random()*58,z=-27+random()*58;
  if(Math.abs(x)<3&&z>0&&z<23)continue;
  if(Math.hypot(x+15,z+13)<7||Math.hypot(x-15,z+13)<7)continue;
  flower(m,x,z,[C.rose,C.yellow,[.77,.69,.94] as Color][Math.floor(random()*3)]);
 }
 chibi(m,-4,5,'alexis');chibi(m,4,5,'iver');
 return m.data;
}
const perspective=(aspect:number)=>{const f=1/Math.tan(Math.PI/5),near=.1,far=180;return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0])};
const lookAt=(eye:V,target:V)=>{const b=norm(minus(eye,target)),r=norm(cross([0,1,0],b)),u=cross(b,r);
 return new Float32Array([r[0],u[0],b[0],0,r[1],u[1],b[1],0,r[2],u[2],b[2],0,-dot(r,eye),-dot(u,eye),-dot(b,eye),1]);};
const vs=[
 'attribute vec3 a_position;attribute vec3 a_normal;attribute vec3 a_color;',
 'uniform mat4 u_projection;uniform mat4 u_view;uniform vec3 u_offset;uniform float u_yaw;',
 'varying vec3 v_color;varying vec3 v_normal;varying float v_distance;',
 'void main(){float c=cos(u_yaw),s=sin(u_yaw);',
 'vec3 p=vec3(a_position.x*c+a_position.z*s,a_position.y,-a_position.x*s+a_position.z*c)+u_offset;',
 'v_normal=vec3(a_normal.x*c+a_normal.z*s,a_normal.y,-a_normal.x*s+a_normal.z*c);v_color=a_color;',
 'vec4 camera=u_view*vec4(p,1.);v_distance=-camera.z;gl_Position=u_projection*camera;}',
].join('\n');
const fs=[
 'precision mediump float;varying vec3 v_color;varying vec3 v_normal;varying float v_distance;',
 'void main(){float diffuse=abs(dot(normalize(v_normal),normalize(vec3(-.45,.92,.60))));',
 'vec3 lit=v_color*(.66+.35*diffuse);float fog=smoothstep(36.,145.,v_distance);',
 'gl_FragColor=vec4(mix(lit,vec3(.72,.83,.84),fog*.83),1.);}',
].join('\n');
function shader(gl:WebGLRenderingContext,type:number,src:string){
 const s=gl.createShader(type);if(!s)throw Error('Shader unavailable');
 gl.shaderSource(s,src);gl.compileShader(s);
 if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const reason=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(reason||'Shader compilation failed');}
 return s;
}
function program(gl:WebGLRenderingContext){
 const v=shader(gl,gl.VERTEX_SHADER,vs),f=shader(gl,gl.FRAGMENT_SHADER,fs),p=gl.createProgram();
 if(!p)throw Error('WebGL program unavailable');
 gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);
 gl.deleteShader(v);gl.deleteShader(f);
 if(!gl.getProgramParameter(p,gl.LINK_STATUS)){const reason=gl.getProgramInfoLog(p);gl.deleteProgram(p);throw Error(reason||'Program link failed');}
 return p;
}
const nearest=(x:number,z:number):LandmarkId|null=>{
 let id:LandmarkId|null=null,dist=Infinity;
 for(const s of LANDMARKS){const d=Math.hypot(x-s.x,z-s.z);if(d<s.radius&&d<dist){id=s.id;dist=d;}}
 return id;
};
const blocked=(x:number,z:number)=>Math.hypot(x+15,z+13)<4.7||Math.hypot(x-15,z+13)<4.7||Math.hypot(x-23,z-18)<3.2;
export function startApoWorld(canvas:HTMLCanvasElement,update:(s:Snapshot)=>void,activate:(id:LandmarkId)=>void,fail:()=>void,reducedMotion=false):WorldGame|null {
 const gl=canvas.getContext('webgl',{alpha:false,antialias:true,powerPreference:'low-power'});
 if(!gl){fail();return null;}
 let p:WebGLProgram;
 try{p=program(gl);}catch{fail();return null;}
 const land=scene(),bm=new Mesh();chibi(bm,0,0,'player',true);const avatar=bm.data;
 const buffers=[gl.createBuffer(),gl.createBuffer()];
 if(!buffers[0]||!buffers[1]){buffers.forEach(b=>{if(b)gl.deleteBuffer(b);});gl.deleteProgram(p);fail();return null;}
 gl.bindBuffer(gl.ARRAY_BUFFER,buffers[0]);gl.bufferData(gl.ARRAY_BUFFER,land.vertices,gl.STATIC_DRAW);
 gl.bindBuffer(gl.ARRAY_BUFFER,buffers[1]);gl.bufferData(gl.ARRAY_BUFFER,avatar.vertices,gl.STATIC_DRAW);
 gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(.59,.79,.92,1);gl.useProgram(p);
 const at=[gl.getAttribLocation(p,'a_position'),gl.getAttribLocation(p,'a_normal'),gl.getAttribLocation(p,'a_color')];
 const uniforms={projection:gl.getUniformLocation(p,'u_projection'),view:gl.getUniformLocation(p,'u_view'),offset:gl.getUniformLocation(p,'u_offset'),yaw:gl.getUniformLocation(p,'u_yaw')};
 const keys=new Set<Direction>(),position={x:0,z:19};
 let yaw=.16,characterYaw=0,raf=0,disposed=false,heldPointer:number|null=null,lastX=0,lastTime=0,lastUpdate=0,steps=0;
 let snap:Snapshot={x:0,z:19,nearby:null,moving:false};
 const draw=(buffer:WebGLBuffer,data:MeshData,offset:V,turn:number)=>{
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  for(let i=0;i<3;i++){if(at[i]<0)continue;gl.enableVertexAttribArray(at[i]);gl.vertexAttribPointer(at[i],3,gl.FLOAT,false,36,i*12);}
  gl.uniform3fv(uniforms.offset,offset);gl.uniform1f(uniforms.yaw,turn);gl.drawArrays(gl.TRIANGLES,0,data.count);
 };
 const frame=(timestamp:number)=>{
  if(disposed)return;
  const dt=lastTime?Math.min(.05,(timestamp-lastTime)/1000):0;lastTime=timestamp;
  const forward=Number(keys.has('forward'))-Number(keys.has('back')),side=Number(keys.has('right'))-Number(keys.has('left')),length=Math.hypot(forward,side),moving=length>0;
  if(moving&&dt>0){
   const speed=keys.has('sprint')?8:5.2;
   const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)/length*speed*dt;
   const dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)/length*speed*dt;
   const xx=clamp(position.x+dx,-31,31),zz=clamp(position.z+dz,-31,31);
   if(!blocked(xx,position.z))position.x=xx;
   if(!blocked(position.x,zz))position.z=zz;
   characterYaw=Math.atan2(dx,-dz);steps+=dt*11;
  }
  const scale=Math.min(window.devicePixelRatio||1,1.5),w=Math.max(1,Math.round(canvas.clientWidth*scale)),heightPx=Math.max(1,Math.round(canvas.clientHeight*scale));
  if(canvas.width!==w||canvas.height!==heightPx){canvas.width=w;canvas.height=heightPx;gl.viewport(0,0,w,heightPx);}
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const y=height(position.x,position.z);
  gl.uniformMatrix4fv(uniforms.projection,false,perspective(w/heightPx));
  gl.uniformMatrix4fv(uniforms.view,false,lookAt([position.x+Math.sin(yaw)*12,y+7.5,position.z+Math.cos(yaw)*12],[position.x,y+1.5,position.z-1.7]));
  draw(buffers[0]!,land,[0,0,0],0);
  const bob=reducedMotion?0:(moving?Math.abs(Math.sin(steps))*.07:Math.sin(timestamp*.0015)*.024);
  draw(buffers[1]!,avatar,[position.x,y+bob,position.z],characterYaw);
  if(timestamp-lastUpdate>170){snap={x:Number(position.x.toFixed(1)),z:Number(position.z.toFixed(1)),nearby:nearest(position.x,position.z),moving};update(snap);lastUpdate=timestamp;}
  raf=requestAnimationFrame(frame);
 };
 const down=(e:PointerEvent)=>{heldPointer=e.pointerId;lastX=e.clientX;try{canvas.setPointerCapture(e.pointerId);}catch{/* okay */}};
 const move=(e:PointerEvent)=>{if(heldPointer===e.pointerId){yaw+=clamp(e.clientX-lastX,-60,60)*.007;lastX=e.clientX;}};
 const up=(e:PointerEvent)=>{if(heldPointer===e.pointerId)heldPointer=null;};
 const lost=(e:Event)=>{e.preventDefault();fail();};
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('webglcontextlost',lost);
 raf=requestAnimationFrame(frame);
 return{
  hold:(dir,active)=>{if(active)keys.add(dir);else keys.delete(dir);},
  rotate:delta=>{yaw+=delta;},
  travel:id=>{const s=LANDMARKS.find(x=>x.id===id);if(!s)return;position.x=s.x;position.z=s.z+1.2;snap={x:position.x,z:position.z,nearby:id,moving:false};update(snap);},
  interact:()=>{const id=nearest(position.x,position.z);if(id)activate(id);},
  current:()=>snap,
  dispose:()=>{disposed=true;cancelAnimationFrame(raf);keys.clear();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('webglcontextlost',lost);buffers.forEach(b=>{if(b)gl.deleteBuffer(b);});gl.deleteProgram(p);},
 };
}
