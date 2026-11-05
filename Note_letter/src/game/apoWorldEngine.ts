/**
 * Apo Letter World — genuine perspective WebGL terrain, props, avatars and camera.
 * No raster background pretending to be a world. Single-player MVP; the existing
 * authenticated letters/messages are accessed by navigation, never copied here.
 * Draw-call-light geometry and no runtime third-party or remote asset downloads.
 */
export type WorldMove = 'forward' | 'back' | 'left' | 'right' | 'sprint';

export type WorldLandmark = {
  id: 'plaza' | 'post' | 'library' | 'capsule' | 'alexis' | 'iver';
  title: string;
  description: string;
  x: number;
  z: number;
  radius: number;
  action?: { label: string; href: string };
};

export const WORLD_LANDMARKS: WorldLandmark[] = [
  { id: 'plaza', title: 'Letter Plaza', description: 'Welcome to the village beneath the mountain. Explore the trails and find places for your words.', x: 0, z: 10, radius: 9 },
  { id: 'post', title: 'Mountain Post Office', description: 'Write a new letter, finish a saved draft, or prepare a message for someone special.', x: -15, z: -9, radius: 8, action: { label: 'Write a letter', href: '/dashboard/notes?compose=1' } },
  { id: 'library', title: 'Storybook Library', description: 'Browse public community letters. Private and unpublished letters remain protected.', x: 16, z: -12, radius: 8, action: { label: 'Read community letters', href: '/dashboard/community' } },
  { id: 'capsule', title: 'Time Capsule Garden', description: 'A quiet corner for letters meant to be revisited in the future.', x: 14, z: -28, radius: 8, action: { label: 'My scheduled letters', href: '/dashboard/notes?tab=scheduled' } },
  { id: 'alexis', title: 'Alexis · Village Guide', description: 'Alexis says: "Welcome! Head left to the Post Office or right to the Library. Press E when near a landmark."', x: -5, z: 3, radius: 4.6 },
  { id: 'iver', title: 'Iver · Letter Explorer', description: 'Iver says: "Every letter has a story. Visit the Library to discover public stories from other writers!"', x: 6, z: 1, radius: 4.6 },
];

export type WorldController = {
  setMove: (direction: WorldMove, active: boolean) => void;
  interact: () => void;
  reset: () => void;
  dispose: () => void;
};

type RGB = [number, number, number];
type V3 = [number, number, number];
type WorldEvents = {
  onNearby: (location: WorldLandmark | null) => void;
  onInteract: (location: WorldLandmark | null) => void;
  onPosition: (position: { x: number; z: number }) => void;
  onReady: () => void;
  onError: (message: string) => void;
  reduceMotion: boolean;
};

const COLORS: Record<string, RGB> = {
  meadow: [0.39, 0.64, 0.39], leaf: [0.22, 0.47, 0.32],
  pine: [0.13, 0.34, 0.29], mint: [0.36, 0.61, 0.43],
  bark: [0.43, 0.31, 0.22], barkLight: [0.56, 0.39, 0.26],
  dirt: [0.75, 0.62, 0.43], dirtLight: [0.86, 0.75, 0.56],
  cream: [0.95, 0.86, 0.69], paper: [0.99, 0.94, 0.81],
  wall: [0.77, 0.65, 0.49], wallLight: [0.90, 0.78, 0.60],
  roof: [0.35, 0.41, 0.32], roofAlt: [0.52, 0.39, 0.32],
  rose: [0.81, 0.45, 0.43], gold: [0.97, 0.74, 0.38],
  glow: [1, 0.88, 0.58], rock: [0.44, 0.55, 0.57],
  rockMid: [0.53, 0.60, 0.62], rockLight: [0.71, 0.77, 0.77],
  snow: [0.87, 0.91, 0.89], lake: [0.31, 0.63, 0.69],
  ink: [0.20, 0.24, 0.23], black: [0.17, 0.18, 0.21],
  skin: [0.96, 0.77, 0.65], jeans: [0.28, 0.35, 0.50],
  blue: [0.20, 0.36, 0.67], white: [0.96, 0.95, 0.88],
  lavender: [0.69, 0.53, 0.76],
};

const mix = (a: RGB, b: RGB, t: number): RGB =>
  [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const len = (a: V3): number => Math.hypot(a[0], a[1], a[2]);
const cross = (a: V3, b: V3): V3 => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const subtract = (a: V3, b: V3): V3 => [a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const normal = (v: V3): V3 => { const d = len(v) || 1; return [v[0]/d, v[1]/d, v[2]/d]; };
const smooth = (t: number) => t*t*(3-2*t);

export function groundHeight(x: number, z: number): number {
  const edge = smooth(clamp((Math.abs(x) - 19) / 28, 0, 1)) * 5.1;
  const distance = smooth(clamp((-z - 16) / 29, 0, 1)) * 4.5;
  return 0.12 * Math.sin(x * 0.32) * Math.cos(z * 0.26) +
    0.075 * Math.sin(x * 0.81 + z * 0.55) + edge + distance;
}

class Mesh {
  private values: number[] = [];
  vertex(p: V3, n: V3, c: RGB) {
    this.values.push(p[0],p[1],p[2],n[0],n[1],n[2],c[0],c[1],c[2]);
  }
  tri(a: V3,b: V3,c: V3,color: RGB) {
    const n = normal(cross(subtract(b,a),subtract(c,a)));
    this.vertex(a,n,color);this.vertex(b,n,color);this.vertex(c,n,color);
  }
  quad(a: V3,b: V3,c: V3,d: V3,color: RGB) {
    this.tri(a,b,c,color);this.tri(a,c,d,color);
  }
  box(x: number,y: number,z: number,w: number,h: number,d: number,color: RGB) {
    const a=x-w/2,b=x+w/2,l=y-h/2,r=y+h/2,n=z-d/2,f=z+d/2;
    this.quad([a,l,f],[b,l,f],[b,r,f],[a,r,f],color);
    this.quad([b,l,n],[a,l,n],[a,r,n],[b,r,n],mix(color,COLORS.ink,.07));
    this.quad([a,l,n],[a,l,f],[a,r,f],[a,r,n],mix(color,COLORS.white,.035));
    this.quad([b,l,f],[b,l,n],[b,r,n],[b,r,f],mix(color,COLORS.ink,.12));
    this.quad([a,r,f],[b,r,f],[b,r,n],[a,r,n],mix(color,COLORS.white,.1));
    this.quad([a,l,n],[b,l,n],[b,l,f],[a,l,f],color);
  }
  cylinder(x:number,y:number,z:number,r:number,h:number,color:RGB,steps=11) {
    for(let i=0;i<steps;i++){
      const a=i*Math.PI*2/steps,b=(i+1)*Math.PI*2/steps;
      const p:V3=[x+r*Math.cos(a),y-h/2,z+r*Math.sin(a)];
      const q:V3=[x+r*Math.cos(b),y-h/2,z+r*Math.sin(b)];
      this.quad(p,q,[q[0],y+h/2,q[2]],[p[0],y+h/2,p[2]],color);
      this.tri([x,y+h/2,z],[p[0],y+h/2,p[2]],[q[0],y+h/2,q[2]],mix(color,COLORS.white,.06));
    }
  }
  cone(x:number,y:number,z:number,r:number,h:number,color:RGB,steps=13) {
    for(let i=0;i<steps;i++){
      const a=i*Math.PI*2/steps,b=(i+1)*Math.PI*2/steps;
      this.tri(
        [x+r*Math.cos(a),y-h/2,z+r*Math.sin(a)],
        [x+r*Math.cos(b),y-h/2,z+r*Math.sin(b)],
        [x,y+h/2,z],
        mix(color,COLORS.white,i%3===0?.08:0));
    }
  }
  sphere(x:number,y:number,z:number,r:number,color:RGB,segments=13,rings=8) {
    for(let j=0;j<rings;j++){
      const v0=-Math.PI/2+j*Math.PI/rings,v1=-Math.PI/2+(j+1)*Math.PI/rings;
      for(let i=0;i<segments;i++){
        const u0=i*Math.PI*2/segments,u1=(i+1)*Math.PI*2/segments;
        const point=(u:number,v:number):V3 => [x+r*Math.cos(v)*Math.cos(u),y+r*Math.sin(v),z+r*Math.cos(v)*Math.sin(u)];
        const a=point(u0,v0),b=point(u1,v0),c=point(u1,v1),d=point(u0,v1);
        const emit=(p:V3) => this.vertex(p,normal(subtract(p,[x,y,z])),color);
        emit(a);emit(b);emit(c);emit(a);emit(c);emit(d);
      }
    }
  }
  terrain(size=50,depth=49) {
    const steps=88;
    for(let i=0;i<steps;i++)for(let j=0;j<steps;j++){
      const x0=-size+i*size*2/steps,x1=-size+(i+1)*size*2/steps;
      const z0=-depth+j*depth*2/steps,z1=-depth+(j+1)*depth*2/steps;
      const at=(x:number,z:number):V3=>[x,groundHeight(x,z)-.13,z];
      const shade=.1*Math.sin(x0*.41+z0*.25)+.06*Math.sin(z0*.9);
      const c=mix(COLORS.meadow,COLORS.mint,clamp(.4+shade,0,1));
      this.tri(at(x0,z0),at(x1,z0),at(x1,z1),c);
      this.tri(at(x0,z0),at(x1,z1),at(x0,z1),c);
    }
  }
  data():Float32Array { return new Float32Array(this.values); }
}
function seeded(seed: number):()=>number {
  let n=seed>>>0;
  return () => {n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
}
function road(mesh:Mesh, points:[number,number][],width:number) {
  for(let i=0;i<points.length-1;i++){
    const [x,z]=points[i], [nx,nz]=points[i+1];
    const dx=nx-x,dz=nz-z,mag=Math.hypot(dx,dz)||1;
    const ox=-dz/mag*width/2,oz=dx/mag*width/2;
    const pos=(px:number,pz:number):V3=>[px,groundHeight(px,pz)+.008,pz];
    mesh.quad(pos(x+ox,z+oz),pos(nx+ox,nz+oz),pos(nx-ox,nz-oz),pos(x-ox,z-oz),COLORS.dirtLight);
  }
}
function shadow(mesh:Mesh,x:number,z:number,r:number) {
  // Soft-ish layered oval, sits on the actual ground.
  for(let level=3;level>=1;level--){
    const radius=r*(.76+level*.10),shade=mix(COLORS.meadow,COLORS.ink,.09/level);
    const n=16;
    for(let i=0;i<n;i++){
      const a=i*Math.PI*2/n,b=(i+1)*Math.PI*2/n;
      const y=groundHeight(x,z)+.01+level*.0003;
      mesh.tri([x,y,z],[x+radius*Math.cos(a),y,z+radius*.65*Math.sin(a)],[x+radius*Math.cos(b),y,z+radius*.65*Math.sin(b)],shade);
    }
  }
}
function pine(mesh:Mesh,x:number,z:number,height:number,r:number) {
  const y=groundHeight(x,z);
  shadow(mesh,x,z,r*.85);
  mesh.cylinder(x,y+height*.25,z,r*.14,height*.5,COLORS.bark,9);
  for(let tier=0;tier<3;tier++)
    mesh.cone(x,y+height*(.46+tier*.19),z,r*(1-tier*.20),height*(.58-tier*.095),mix(COLORS.pine,COLORS.mint,tier*.10),13);
}
function flower(mesh:Mesh,x:number,z:number,color:RGB) {
  const y=groundHeight(x,z);
  mesh.cylinder(x,y+.16,z,.018,.29,COLORS.pine,6);
  for(let k=0;k<5;k++){
    const a=k*Math.PI*2/5;
    mesh.sphere(x+Math.cos(a)*.09,y+.37,z+Math.sin(a)*.09,.065,color,7,4);
  }
  mesh.sphere(x,y+.37,z,.055,COLORS.gold,7,4);
}
function roof(mesh:Mesh,x:number,y:number,z:number,w:number,d:number,h:number,color:RGB) {
  const e=w*.56,depth=d*.58;
  const lf:V3=[x-e,y,z+depth],rf:V3=[x+e,y,z+depth],lb:V3=[x-e,y,z-depth],rb:V3=[x+e,y,z-depth];
  const front:V3=[x,y+h,z+depth],back:V3=[x,y+h,z-depth];
  mesh.quad(lf,front,back,lb,mix(color,COLORS.white,.10));
  mesh.quad(front,rf,rb,back,mix(color,COLORS.ink,.12));
  mesh.tri(lf,rf,front,COLORS.wall);mesh.tri(rb,lb,back,COLORS.wall);
}
function house(mesh:Mesh,x:number,z:number,w:number,d:number,h:number,style:'post'|'library'|'cabin') {
  const y=groundHeight(x,z);
  const wall=style==='post'?COLORS.cream:style==='library'?COLORS.wallLight:COLORS.wall;
  const roofColor=style==='post'?COLORS.roof:style==='library'?COLORS.roofAlt:COLORS.roof;
  shadow(mesh,x,z,Math.max(w,d)*.72);
  mesh.box(x,y+h/2,z,w,h,d,wall);
  roof(mesh,x,y+h,z,w,d,h*.72,roofColor);
  mesh.box(x,y+1.05,z+d/2+.045,1.2,2.1,.11,COLORS.bark);
  mesh.box(x,y+1.08,z+d/2+.11,.7,1.55,.055,mix(COLORS.bark,COLORS.ink,.22));
  for(const side of [-1,1]){
    const px=x+side*w*.30;
    mesh.box(px,y+h*.66,z+d/2+.06,.88,.88,.12,COLORS.bark);
    mesh.box(px,y+h*.66,z+d/2+.14,.63,.63,.1,COLORS.glow);
    mesh.box(px,y+h*.66,z+d/2+.20,.07,.72,.075,COLORS.wall);
    mesh.box(px,y+h*.66,z+d/2+.20,.69,.075,.075,COLORS.wall);
  }
  mesh.box(x,y+.15,z+d/2+.85,2.1,.23,1.75,COLORS.dirtLight);
  for(const side of [-1,1]){
    const lanternX=x+side*(w*.52+.30);
    mesh.cylinder(lanternX,y+.8,z+d*.45,.08,1.6,COLORS.barkLight);
    mesh.sphere(lanternX,y+1.55,z+d*.45,.25,COLORS.glow,9,5);
  }
}
function mountain(mesh:Mesh,x:number,z:number,r:number,h:number,shade:RGB,seed:number) {
  const ring=9,seg=30;
  const wave=(a:number)=>1+.12*Math.sin(a*3+seed)+.08*Math.sin(a*7+seed*2.1);
  const point=(t:number,a:number):V3=>{
    const rad=r*(1-t)*wave(a)*(1+.06*Math.sin(t*17+a*4+seed));
    return [x+rad*Math.cos(a),h*Math.pow(t,1.15),z+rad*Math.sin(a)];
  };
  for(let j=0;j<ring;j++){
    const t0=j/ring,t1=(j+1)/ring;
    for(let i=0;i<seg;i++){
      const a=i*2*Math.PI/seg,b=(i+1)*2*Math.PI/seg;
      const clr=t1>.80?mix(shade,COLORS.snow,clamp((t1-.76)*3.7,0,.92)):mix(shade,COLORS.rockLight,t0*.15+(i%5)*.025);
      mesh.quad(point(t0,a),point(t0,b),point(t1,b),point(t1,a),clr);
    }
  }
}
function mailbox(mesh:Mesh,x:number,z:number) {
  const y=groundHeight(x,z);
  mesh.cylinder(x,y+.78,z,.115,1.55,COLORS.barkLight,9);
  mesh.box(x,y+1.64,z,.8,.65,.54,COLORS.rose);
  mesh.box(x,y+1.78,z+.29,.51,.11,.05,COLORS.paper);
  roof(mesh,x,y+1.96,z,.85,.59,.22,COLORS.roofAlt);
}
function villageStatic():Float32Array {
  const m=new Mesh();
  const rand=seeded(4924);
  m.terrain();
  mountain(m,-53,-108,53,34,COLORS.rockMid,3);
  mountain(m,0,-108,59,51,COLORS.rock,7);
  mountain(m,52,-114,52,40,COLORS.rockMid,11);
  road(m,[[0,29],[0,18],[0,10],[0,2]],3.7);
  road(m,[[0,2],[-5,-2],[-10,-6],[-15,-6.5]],3.1);
  road(m,[[0,2],[6,-3],[12,-7],[16,-9]],3.1);
  road(m,[[2,-2],[8,-14],[13,-23],[14,-27]],2.55);
  road(m,[[-10,-6],[-15,-18],[-6,-26]],2.15);
  // Round-ish plaza made from many concentric stone circles.
  for(let j=0;j<3;j++){
    const r=4.4+j*.86,seg=28;
    for(let i=0;i<seg;i++){
      const a=i*2*Math.PI/seg,b=(i+1)*2*Math.PI/seg;
      const y=groundHeight(0,9.5)+.04+j*.004;
      m.quad([r*Math.cos(a),y,9.5+r*Math.sin(a)],[r*Math.cos(b),y,9.5+r*Math.sin(b)],
        [(r+.6)*Math.cos(b),y,9.5+(r+.6)*Math.sin(b)],[(r+.6)*Math.cos(a),y,9.5+(r+.6)*Math.sin(a)],
        j===0?COLORS.paper:COLORS.dirtLight);
    }
  }
  // Letter fountain — 3D plinth and sealed letter, separate from HUD.
  const plazaY=groundHeight(0,9.5);
  m.cylinder(0,plazaY+.30,9.5,1.6,.56,COLORS.cream,24);
  m.cylinder(0,plazaY+.72,9.5,1.04,.31,COLORS.gold,18);
  m.box(0,plazaY+1.5,9.5,1.5,1,.18,COLORS.paper);
  m.box(0,plazaY+1.5,9.63,.22,.20,.06,COLORS.rose);
  house(m,-17,-11,9.1,7,5.4,'post');
  house(m,17,-14,9.4,7.4,5.7,'library');
  house(m,27,-27,6,5,3.7,'cabin');
  house(m,-27,-22,6.7,5.6,3.8,'cabin');
  for(const [x,z] of [[-14,-6],[14,-10],[12,-24],[-7,3],[8,3],[-19,-22],[3,-33]]) mailbox(m,x,z);
  for(let i=0;i<92;i++){
    const x=rand()*92-46,z=rand()*82-44;
    if(Math.abs(x)<9&&z>-16 || Math.hypot(x+17,z+11)<10 || Math.hypot(x-17,z+14)<11 ||
      Math.hypot(x-14,z+28)<9 || Math.hypot(x+27,z+22)<9)continue;
    pine(m,x,z,4.5+rand()*6.7,1.3+rand()*1.4);
  }
  for(let i=0;i<95;i++){
    const x=rand()*79-40,z=rand()*65-35;
    if(Math.abs(x)<3&&z>2)continue;
    flower(m,x,z,[COLORS.white,COLORS.lavender,COLORS.rose,COLORS.gold][Math.floor(rand()*4)]);
  }
  // Hillside stones and small bushes, using smooth geometry rather than cube props.
  for(let i=0;i<50;i++){
    const x=rand()*86-43,z=rand()*79-39,y=groundHeight(x,z);
    m.sphere(x,y+.22,z,.35+rand()*.55,mix(COLORS.rockMid,COLORS.meadow,rand()*.38),9,6);
  }
  return m.data();
}
function characterMesh(kind:'player'|'alexis'|'iver'):Float32Array {
  const m=new Mesh();
  const shirt=kind==='alexis'?COLORS.rockMid:COLORS.black;
  // Rounded backpack, head and limbs are all real curved meshes.
  m.sphere(0,1.38,0,.60,COLORS.skin,15,10);
  m.sphere(0,1.76,0,.59,COLORS.black,15,8);
  if(kind==='alexis'){
    m.sphere(0,1.92,0,.64,COLORS.black,15,8);
    m.cylinder(0,1.73,0,.64,.22,COLORS.black,15);
  } else {
    for(let i=0;i<5;i++)m.cone((i-2)*.22,1.99,-.1,.24,.4,COLORS.black,8);
  }
  m.sphere(0,0.85,0,.55,shirt,14,9);
  m.sphere(0,0.72,.47,.46,COLORS.black,10,8);
  for(const side of [-1,1]){
    m.sphere(side*.55,.87,0,.19,shirt,9,6);
    m.sphere(side*.61,.56,-.03,.19,COLORS.skin,9,6);
    m.sphere(side*.28,.33,-.03,.25,COLORS.jeans,9,7);
    m.sphere(side*.29,.16,-.20,.26,COLORS.white,9,6);
    m.sphere(side*.21,1.47,-.51,.078,COLORS.ink,8,5);
  }
  m.sphere(0,1.26,-.58,.065,COLORS.rose,8,5);
  m.sphere(0,1.04,-.54,.09,COLORS.rose,8,5);
  if(kind==='alexis'){
    m.box(0,.94,-.53,.09,.54,.04,COLORS.blue);
  } else {
    m.box(0,.96,.55,.58,.72,.19,COLORS.black);
  }
  return m.data();
}
const vertexShader=String.raw`
attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec3 a_color;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform vec4 u_pose;
varying vec3 v_color;
varying float v_fog;
void main(){
  float s=sin(u_pose.w),c=cos(u_pose.w);
  vec3 p=vec3(a_position.x*c-a_position.z*s,a_position.y,a_position.x*s+a_position.z*c)+u_pose.xyz;
  vec3 n=normalize(vec3(a_normal.x*c-a_normal.z*s,a_normal.y,a_normal.x*s+a_normal.z*c));
  vec4 view=u_view*vec4(p,1.0);
  gl_Position=u_projection*view;
  float light=0.66+0.43*max(0.0,dot(n,normalize(vec3(-0.45,0.85,0.48))));
  v_color=clamp(a_color*light+vec3(0.025),0.0,1.0);
  v_fog=clamp((-view.z-37.0)/129.0,0.0,0.83);
}`;
const fragmentShader=String.raw`
precision mediump float;
varying vec3 v_color;
varying float v_fog;
void main(){
  vec3 daylight=pow(v_color,vec3(0.96));
  gl_FragColor=vec4(mix(daylight,vec3(0.72,0.83,0.87),v_fog),1.0);
}`;
function compile(gl:WebGLRenderingContext,type:number,src:string):WebGLShader {
  const shader=gl.createShader(type);
  if(!shader)throw Error('The graphics processor could not create a shader.');
  gl.shaderSource(shader,src);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
    const message=gl.getShaderInfoLog(shader)||'Unknown shader error';
    gl.deleteShader(shader);throw Error(message);
  }
  return shader;
}
function perspective(fov:number,aspect:number,near:number,far:number):Float32Array {
  const f=1/Math.tan(fov/2),q=1/(near-far);
  return new Float32Array([f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*q,-1, 0,0,2*far*near*q,0]);
}
function lookAt(eye:V3,target:V3):Float32Array {
  const z=normal(subtract(eye,target)),x=normal(cross([0,1,0],z)),y=cross(z,x);
  return new Float32Array([
    x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0,
    -x[0]*eye[0]-x[1]*eye[1]-x[2]*eye[2],
    -y[0]*eye[0]-y[1]*eye[1]-y[2]*eye[2],
    -z[0]*eye[0]-z[1]*eye[1]-z[2]*eye[2],1,
  ]);
}
type GPUBuffer = { buffer: WebGLBuffer; count:number };
function createGPU(gl:WebGLRenderingContext, data:Float32Array):GPUBuffer {
  const buffer=gl.createBuffer();
  if(!buffer)throw Error('Graphics memory could not be allocated.');
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
  return {buffer,count:data.length/9};
}

/** Mount and run a self-contained 3D scene. Cleanup releases every GPU resource. */
export function startApoWorld(canvas:HTMLCanvasElement,events:WorldEvents):WorldController {
  const moves:Record<WorldMove,boolean>={forward:false,back:false,left:false,right:false,sprint:false};
  let disposed=false,frame=0,last=0,lastPositionUpdate=0,ready=false;
  let x=0,z=18,yaw=0,avatarYaw=0,orbit=0,distance=11,jumpHeight=0,jumpSpeed=0;
  let nearId:WorldLandmark['id']|null=null;
  let pointerId:number|null=null,lastPointerX=0;
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:true,powerPreference:'default',premultipliedAlpha:false});
  if(!gl){
    events.onError('3D graphics are unavailable on this device. Turn on hardware acceleration or try another browser.');
    return {setMove:()=>{},interact:()=>events.onInteract(null),reset:()=>{},dispose:()=>{}};
  }
  const buffers:GPUBuffer[]=[];
  let program:WebGLProgram|null=null;
  let observer:ResizeObserver|null=null;
  let position=gl.getAttribLocation(program as WebGLProgram,'a_position');
  let normalAttr=gl.getAttribLocation(program as WebGLProgram,'a_normal');
  let colorAttr=gl.getAttribLocation(program as WebGLProgram,'a_color');
  let poseUniform:WebGLUniformLocation|null=null,viewUniform:WebGLUniformLocation|null=null,projectionUniform:WebGLUniformLocation|null=null;
  let world:GPUBuffer,player:GPUBuffer,alexis:GPUBuffer,iver:GPUBuffer;
  try {
    const vs=compile(gl,gl.VERTEX_SHADER,vertexShader);
    const fs=compile(gl,gl.FRAGMENT_SHADER,fragmentShader);
    program=gl.createProgram();
    if(!program)throw Error('The graphics program could not be created.');
    gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
    gl.deleteShader(vs);gl.deleteShader(fs);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('The graphics program could not start.');
    gl.useProgram(program);
    position=gl.getAttribLocation(program,'a_position');
    normalAttr=gl.getAttribLocation(program,'a_normal');
    colorAttr=gl.getAttribLocation(program,'a_color');
    poseUniform=gl.getUniformLocation(program,'u_pose');
    viewUniform=gl.getUniformLocation(program,'u_view');
    projectionUniform=gl.getUniformLocation(program,'u_projection');
    world=createGPU(gl,villageStatic());
    player=createGPU(gl,characterMesh('player'));
    alexis=createGPU(gl,characterMesh('alexis'));
    iver=createGPU(gl,characterMesh('iver'));
    buffers.push(world,player,alexis,iver);
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
    gl.clearColor(.71,.84,.88,0);
  }catch{
    buffers.forEach(b=>gl.deleteBuffer(b.buffer));
    if(program)gl.deleteProgram(program);
    events.onError('We could not start this 3D world. Please try again with WebGL enabled.');
    return {setMove:()=>{},interact:()=>events.onInteract(null),reset:()=>{},dispose:()=>{}};
  }
  const draw=(mesh:GPUBuffer,pose:[number,number,number,number])=>{
    gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);
    gl.vertexAttribPointer(position,3,gl.FLOAT,false,36,0);gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(normalAttr,3,gl.FLOAT,false,36,12);gl.enableVertexAttribArray(normalAttr);
    gl.vertexAttribPointer(colorAttr,3,gl.FLOAT,false,36,24);gl.enableVertexAttribArray(colorAttr);
    gl.uniform4f(poseUniform,pose[0],pose[1],pose[2],pose[3]);
    gl.drawArrays(gl.TRIANGLES,0,mesh.count);
  };
  const resize=()=>{
    const rect=canvas.getBoundingClientRect();
    const ratio=Math.min(window.devicePixelRatio||1,window.innerWidth<680?1.35:1.8);
    const w=Math.max(1,Math.floor(rect.width*ratio)),h=Math.max(1,Math.floor(rect.height*ratio));
    if(w!==canvas.width||h!==canvas.height){canvas.width=w;canvas.height=h;}
    gl.viewport(0,0,canvas.width,canvas.height);
  };
  const closest=():WorldLandmark|null=>{
    let best:WorldLandmark|null=null,minimum=Infinity;
    for(const entry of WORLD_LANDMARKS){
      const d=Math.hypot(x-entry.x,z-entry.z);
      if(d<entry.radius&&d<minimum){minimum=d;best=entry;}
    }
    return best;
  };
  const interact=()=>events.onInteract(closest());
  const keyDown=(event:KeyboardEvent)=>{
    const target=event.target as HTMLElement|null;
    if(event.altKey||event.ctrlKey||event.metaKey||target?.isContentEditable||target?.closest('input,textarea,select,[role="dialog"]'))return;
    const key=event.key.toLowerCase();
    const keyMap:Record<string,WorldMove>={'w':'forward','arrowup':'forward','s':'back','arrowdown':'back','a':'left','arrowleft':'left','d':'right','arrowright':'right','shift':'sprint'};
    if(keyMap[key]){moves[keyMap[key]]=true;event.preventDefault();}
    if((key==='e'||key==='enter')&&!event.repeat){interact();event.preventDefault();}
    if((key===' '||key==='space')&&!event.repeat&&jumpHeight===0&&!(target?.closest('button,a'))){jumpSpeed=5.8;event.preventDefault();}
  };
  const keyUp=(event:KeyboardEvent)=>{
    const key=event.key.toLowerCase();
    const keyMap:Record<string,WorldMove>={'w':'forward','arrowup':'forward','s':'back','arrowdown':'back','a':'left','arrowleft':'left','d':'right','arrowright':'right','shift':'sprint'};
    if(keyMap[key])moves[keyMap[key]]=false;
  };
  const blur=()=>{Object.keys(moves).forEach(k=>{moves[k as WorldMove]=false;});};
  const pointerDown=(e:PointerEvent)=>{
    pointerId=e.pointerId;lastPointerX=e.clientX;canvas.setPointerCapture(e.pointerId);
  };
  const pointerMove=(e:PointerEvent)=>{
    if(pointerId!==e.pointerId)return;
    orbit=clamp(orbit-(e.clientX-lastPointerX)*.006,-Math.PI*.9,Math.PI*.9);lastPointerX=e.clientX;
  };
  const pointerUp=(e:PointerEvent)=>{if(e.pointerId===pointerId)pointerId=null;};
  const wheel=(e:WheelEvent)=>{e.preventDefault();distance=clamp(distance+e.deltaY*.011,7,17);};
  const contextLost=(event:Event)=>{event.preventDefault();events.onError('The 3D graphics context was lost. Reload the world to continue.');};
  window.addEventListener('keydown',keyDown);
  window.addEventListener('keyup',keyUp);
  window.addEventListener('blur',blur);
  canvas.addEventListener('pointerdown',pointerDown);
  canvas.addEventListener('pointermove',pointerMove);
  canvas.addEventListener('pointerup',pointerUp);
  canvas.addEventListener('pointercancel',pointerUp);
  canvas.addEventListener('wheel',wheel,{passive:false});
  canvas.addEventListener('webglcontextlost',contextLost);
  if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(resize);observer.observe(canvas);}
  else window.addEventListener('resize',resize);
  resize();
  const render=(time:number)=>{
    if(disposed)return;
    const dt=Math.min(.05,(time-last)/1000||.016);last=time;
    if(!document.hidden){
      const forward=Number(moves.forward)-Number(moves.back);
      const side=Number(moves.right)-Number(moves.left);
      const mag=Math.hypot(side,forward);
      if(mag){
        const speed=moves.sprint?7.4:4.4;
        const fx=Math.sin(orbit),fz=-Math.cos(orbit),sx=Math.cos(orbit),sz=Math.sin(orbit);
        const dx=(side*sx+forward*fx)/mag,dz=(side*sz+forward*fz)/mag;
        x=clamp(x+dx*speed*dt,-35,35);z=clamp(z+dz*speed*dt,-33,32);
        avatarYaw=Math.atan2(-dx,-dz);
      }
      if(jumpHeight>0||jumpSpeed>0){
        jumpHeight=Math.max(0,jumpHeight+jumpSpeed*dt);
        jumpSpeed=jumpHeight===0?0:jumpSpeed-15.4*dt;
      }
      const eyeX=x+Math.sin(orbit)*distance,eyeZ=z+Math.cos(orbit)*distance;
      const eyeY=groundHeight(eyeX,eyeZ)+distance*.57+1.8;
      const target:V3=[x,groundHeight(x,z)+1.65,z-2.4];
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(viewUniform,false,lookAt([eyeX,eyeY,eyeZ],target));
      gl.uniformMatrix4fv(projectionUniform,false,perspective(Math.PI/3.25,canvas.width/Math.max(canvas.height,1),.12,260));
      draw(world,[0,0,0,0]);
      draw(alexis,[-5,groundHeight(-5,3),3,Math.PI]);
      draw(iver,[6,groundHeight(6,1),1,Math.PI]);
      const bob=events.reduceMotion?0:mag?Math.sin(time*.015)*.065:Math.sin(time*.002)*.017;
      draw(player,[x,groundHeight(x,z)+jumpHeight+bob,z,avatarYaw]);
      if(!ready){ready=true;events.onReady();}
      const location=closest();
      if(location?.id!==nearId){nearId=location?.id||null;events.onNearby(location);}
      if(time-lastPositionUpdate>160){
        lastPositionUpdate=time;events.onPosition({x:Math.round(x*10)/10,z:Math.round(z*10)/10});
      }
    }
    frame=window.requestAnimationFrame(render);
  };
  frame=window.requestAnimationFrame(render);
  const reset=()=>{x=0;z=18;orbit=0;avatarYaw=0;jumpHeight=0;jumpSpeed=0;blur();};
  const dispose=()=>{
    if(disposed)return;disposed=true;
    window.cancelAnimationFrame(frame);
    window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',blur);
    window.removeEventListener('resize',resize);observer?.disconnect();
    canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);
    canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerUp);
    canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('webglcontextlost',contextLost);
    buffers.forEach(b=>gl.deleteBuffer(b.buffer));if(program)gl.deleteProgram(program);
  };
  return {setMove:(key,active)=>{moves[key]=active;},interact,reset,dispose};
}
