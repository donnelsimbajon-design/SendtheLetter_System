/**
 * Apo Letter World — genuine perspective WebGL terrain, props, avatars and camera.
 * No raster background pretending to be a world. Single-player MVP; the existing
 * authenticated letters/messages are accessed by navigation, never copied here.
 * Draw-call-light geometry and no runtime third-party or remote asset downloads.
 */
import { loadApoGlb } from './apoGlbLoader';
import { APO_MODEL_ASSETS, type ApoAssetName } from './apoAssetCatalog';

export type WorldMove = 'forward' | 'back' | 'left' | 'right' | 'sprint';
export type WorldAvatar = 'explorer' | 'ranger' | 'traveler';
export const WORLD_AVATARS: { id: WorldAvatar; label: string; description: string }[] = [
  { id: 'explorer', label: 'Mountain Explorer', description: 'Forest jacket and hiking pack' },
  { id: 'ranger', label: 'Highland Ranger', description: 'Trail hat and outdoor gear' },
  { id: 'traveler', label: 'Story Traveler', description: 'Warm coat and messenger bag' },
];

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
  setAvatar: (avatar: WorldAvatar) => void;
  jump: () => void;
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
  onAssets?: (loaded: number, total: number) => void;
  reduceMotion: boolean;
};

const COLORS: Record<string, RGB> = {
  meadow: [0.33, 0.54, 0.36], leaf: [0.20, 0.42, 0.29],
  pine: [0.14, 0.32, 0.25], mint: [0.40, 0.58, 0.39],
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
  moss: [0.23, 0.43, 0.27], fern: [0.28, 0.53, 0.30],
  leafLight: [0.45, 0.66, 0.37], leafGold: [0.65, 0.63, 0.34],
  woodDark: [0.29, 0.23, 0.18], stoneWarm: [0.67, 0.64, 0.55],
  leather: [0.42, 0.29, 0.21], bronze: [0.75, 0.56, 0.30],
  hairBrown: [0.28, 0.20, 0.17], hairChestnut: [0.42, 0.29, 0.21],
  jacketOlive: [0.27, 0.38, 0.28], jacketRust: [0.66, 0.37, 0.27],
  jacketBlue: [0.30, 0.43, 0.53], trousers: [0.22, 0.27, 0.27],
  skinWarm: [0.81, 0.57, 0.43], blush: [0.76, 0.42, 0.39],
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
  // Protect the accessible plaza and walking paths while the highland perimeter
  // gains the wide, varied slopes seen in Mt. Apo's forested foothills.
  const rim=smooth(clamp((Math.hypot(x*.75,(z+1)*.58)-12)/27,0,1));
  const left=smooth(clamp((Math.abs(x)-19)/28,0,1))*6.1;
  const north=smooth(clamp((-z-16)/29,0,1))*6.5;
  const ridges=(Math.sin(x*.19+z*.07)*Math.cos(z*.16)+
    .55*Math.sin(x*.42-z*.23)+.26*Math.sin(x*.86+z*.43))*rim*1.20;
  const local=.10*Math.sin(x*.32)*Math.cos(z*.26)+.055*Math.sin(x*.81+z*.55);
  return left+north+ridges+local;
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
  ellipsoid(x:number,y:number,z:number,rx:number,ry:number,rz:number,color:RGB,segments=12,rings=7) {
    for(let j=0;j<rings;j++){
      const v0=-Math.PI/2+j*Math.PI/rings,v1=-Math.PI/2+(j+1)*Math.PI/rings;
      for(let i=0;i<segments;i++){
        const u0=i*Math.PI*2/segments,u1=(i+1)*Math.PI*2/segments;
        const point=(u:number,v:number):V3=>[x+rx*Math.cos(v)*Math.cos(u),y+ry*Math.sin(v),z+rz*Math.cos(v)*Math.sin(u)];
        const emit=(p:V3)=>this.vertex(p,normal([(p[0]-x)/rx**2,(p[1]-y)/ry**2,(p[2]-z)/rz**2]),color);
        const a=point(u0,v0),b=point(u1,v0),c=point(u1,v1),d=point(u0,v1);
        emit(a);emit(b);emit(c);emit(a);emit(c);emit(d);
      }
    }
  }
  terrain(size=50,depth=49) {
    const steps=112;
    for(let i=0;i<steps;i++)for(let j=0;j<steps;j++){
      const x0=-size+i*size*2/steps,x1=-size+(i+1)*size*2/steps;
      const z0=-depth+j*depth*2/steps,z1=-depth+(j+1)*depth*2/steps;
      const at=(x:number,z:number):V3=>[x,groundHeight(x,z)-.13,z];
      const grain=.10*Math.sin(x0*.41+z0*.25)+.06*Math.sin(z0*.9)+
        .055*Math.sin(x0*2.12-z0*1.79);
      const grass=clamp(.34+grain+Math.max(0,groundHeight(x0,z0)-1.8)*.027,0,1);
      const c=mix(COLORS.meadow,COLORS.mint,grass);
      // Upward-facing terrain normals are essential for correct sun lighting.
      this.tri(at(x0,z0),at(x1,z1),at(x1,z0),c);
      this.tri(at(x0,z0),at(x0,z1),at(x1,z1),c);
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
  mesh.cylinder(x,y+height*.28,z,r*.12,height*.56,COLORS.bark,9);
  for(let tier=0;tier<5;tier++){
    const radius=r*(1-tier*.145);
    const mid=y+height*(.38+tier*.14);
    mesh.cone(x,mid,z,radius,height*(.47-tier*.042),mix(COLORS.pine,COLORS.fern,tier*.13),15);
  }
  mesh.cone(x,y+height*.94,z,r*.22,height*.25,COLORS.fern,11);
}
function broadleaf(mesh:Mesh,x:number,z:number,height:number,r:number,autumn=false){
  const y=groundHeight(x,z),leaf=autumn?COLORS.leafGold:COLORS.leafLight;
  shadow(mesh,x,z,r*.96);
  mesh.cylinder(x,y+height*.28,z,r*.18,height*.56,COLORS.bark,11);
  for(const [dx,dy,dz,scale] of [
    [0,.76,0,1.0],[-.59,.64,.18,.76],[.58,.66,.13,.76],[0,.68,-.50,.79],
    [0,.68,.50,.73],[-.21,.89,-.19,.60],[.32,.84,.08,.63]
  ]){
    mesh.ellipsoid(x+dx*r,y+dy*height,z+dz*r,r*scale,height*.17*scale,r*scale,
      mix(leaf,COLORS.moss,clamp(.22+dy*.21,0,.42)),11,7);
  }
}
function fern(mesh:Mesh,x:number,z:number,r=.85){
  const y=groundHeight(x,z);
  for(let k=0;k<6;k++){
    const angle=k*Math.PI/3,dx=Math.cos(angle),dz=Math.sin(angle),size=r*(.73+(k%3)*.10);
    const base:V3=[x,y+.12,z],tip:V3=[x+dx*size,y+.46,z+dz*size];
    mesh.tri(base,[x-dz*.10,y+.24,z+dx*.10],tip,COLORS.fern);
    mesh.tri(base,tip,[x+dz*.10,y+.24,z-dx*.10],COLORS.moss);
  }
}
function weatheredRock(mesh:Mesh,x:number,z:number,r:number){
  const y=groundHeight(x,z);
  mesh.ellipsoid(x,y+.13*r,z,r*.95,r*.52,r*.79,COLORS.stoneWarm,10,7);
  mesh.ellipsoid(x-r*.21,y+r*.31,z+r*.08,r*.38,r*.24,r*.44,COLORS.moss,9,6);
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
  // Raised trim, glazed window reflections and individual timber details.
  mesh.box(x,y+h-.16,z+d/2+.09,w+.15,.17,.20,COLORS.barkLight);
  for(const side of [-1,1]){
    const sx=x+side*(w/2+.07);
    mesh.box(sx,y+h*.58,z,.17,h*.74,d*.78,COLORS.barkLight);
    mesh.box(x+side*w*.29,y+h*.69,z+d/2+.245,.25,.055,.05,COLORS.white);
  }
  mesh.sphere(x+.36,y+1.04,z+d/2+.2,.082,COLORS.bronze,10,7);
  mesh.box(x,y+2.25,z+d/2+.15,1.55,.20,.12,COLORS.woodDark);
  mesh.box(x,y+2.53,z+d/2+.19,1.24,.36,.12,COLORS.cream);
  // Slate/timber roof ridges and eave trim.
  for(let row=1;row<6;row++){
    const t=row/6;
    const width=w*(1.12-t*.85);
    mesh.box(x,y+h+t*h*.66,z+d*.55*(1-t),width,.055,.09,
      row%2?mix(roofColor,COLORS.woodDark,.24):mix(roofColor,COLORS.white,.13));
  }
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
function villageStatic(useRealTrees=false,useRealBuildings=false):Float32Array {
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
  if(!useRealBuildings){
    house(m,-17,-11,9.1,7,5.4,'post');
    house(m,17,-14,9.4,7.4,5.7,'library');
  }
  house(m,27,-27,6,5,3.7,'cabin');
  house(m,-27,-22,6.7,5.6,3.8,'cabin');
  for(const [x,z] of [[-14,-6],[14,-10],[12,-24],[-7,3],[8,3],[-19,-22],[3,-33]]) mailbox(m,x,z);
  for(let i=0;i<92;i++){
    const x=rand()*92-46,z=rand()*82-44;
    if(Math.abs(x)<9&&z>-16 || Math.hypot(x+17,z+11)<10 || Math.hypot(x-17,z+14)<11 ||
      Math.hypot(x-14,z+28)<9 || Math.hypot(x+27,z+22)<9)continue;
    if(!useRealTrees)pine(m,x,z,4.5+rand()*6.7,1.3+rand()*1.4);
  }
  for(let i=0;i<95;i++){
    const x=rand()*79-40,z=rand()*65-35;
    if(Math.abs(x)<3&&z>2)continue;
    flower(m,x,z,[COLORS.white,COLORS.lavender,COLORS.rose,COLORS.gold][Math.floor(rand()*4)]);
  }
  // Original sculpted environment assets: temperate broadleaf canopy, ferns,
  // small granite outcrops, stone trails, timber benches and a forest pond.
  for(let i=0;i<33;i++){
    const x=rand()*91-45,z=rand()*81-43;
    if(Math.abs(x)<11&&z>-20 || Math.hypot(x+17,z+11)<13 ||
      Math.hypot(x-17,z+14)<14 || Math.hypot(x-14,z+28)<10)continue;
    if(!useRealTrees)broadleaf(m,x,z,5.5+rand()*3.8,1.8+rand()*.85,i%9===0);
  }
  for(let i=0;i<65;i++){
    const x=rand()*85-42,z=rand()*72-36;
    if(Math.abs(x)<2.8&&z>2)continue;
    fern(m,x,z,.7+rand()*.9);
  }
  for(let i=0;i<31;i++){
    const x=rand()*86-43,z=rand()*81-40;
    if(Math.abs(x)<3.5&&z>1)continue;
    weatheredRock(m,x,z,.55+rand()*.72);
  }
  // Uneven cobblestones on the walkways, all real raised 3D stones.
  for(let i=0;i<85;i++){
    const z=29-rand()*27,x=(rand()-.5)*2.9;
    const y=groundHeight(x,z);
    m.ellipsoid(x,y+.024,z,.18+rand()*.20,.039,.20+rand()*.17,
      mix(COLORS.stoneWarm,COLORS.dirtLight,rand()*.48),8,4);
  }
  // A shallow mountain pond and planted banks beside the distant trail.
  const pondX=-29,pondZ=-34,pondY=groundHeight(pondX,pondZ)+.027;
  for(let i=0;i<32;i++){
    const a=i*Math.PI*2/32,b=(i+1)*Math.PI*2/32;
    m.tri([pondX,pondY,pondZ],
      [pondX+6*Math.cos(a),pondY,pondZ+3.7*Math.sin(a)],
      [pondX+6*Math.cos(b),pondY,pondZ+3.7*Math.sin(b)],COLORS.lake);
    m.ellipsoid(pondX+6.1*Math.cos(a),pondY+.04,pondZ+3.8*Math.sin(a),
      .48,.19,.43,i%3===0?COLORS.stoneWarm:COLORS.moss,8,5);
  }
  for(const bx of [-8,8]){
    const bz=13,by=groundHeight(bx,bz);
    shadow(m,bx,bz,.94);
    for(const sx of [-.72,.72]){
      m.box(bx+sx,by+.50,bz,.12,.95,.82,COLORS.woodDark);
      m.box(bx+sx,by+1.15,bz+.26,.10,.69,.13,COLORS.woodDark);
    }
    for(let slat=0;slat<3;slat++){
      m.box(bx,by+1.01,bz-.24+slat*.23,1.85,.105,.16,COLORS.barkLight);
      m.box(bx,by+1.36+slat*.20,bz+.30,1.85,.14,.10,COLORS.barkLight);
    }
  }
  // Hillside stones and small bushes, using smooth geometry rather than cube props.
  for(let i=0;i<50;i++){
    const x=rand()*86-43,z=rand()*79-39,y=groundHeight(x,z);
    m.sphere(x,y+.22,z,.35+rand()*.55,mix(COLORS.rockMid,COLORS.meadow,rand()*.38),9,6);
  }
  return m.data();
}
type CharacterKind = WorldAvatar | 'alexis' | 'iver' | 'postmaster' | 'hiker';
/** Original, fully three-dimensional human character models: faces, hair, clothes,
 * boots, fitted jackets and equipment are actual geometry, not image sprites. */
function characterMesh(kind: CharacterKind): Float32Array {
  const m = new Mesh();
  const isAlexis=kind==='alexis',isIver=kind==='iver',isRanger=kind==='ranger';
  const isTraveler=kind==='traveler',isPost=kind==='postmaster',isHiker=kind==='hiker';
  const jacket=isAlexis?COLORS.jacketBlue:isTraveler?COLORS.jacketRust:isIver?COLORS.jacketRust:
    isRanger?COLORS.jacketOlive:isPost?COLORS.rose:isHiker?COLORS.jacketBlue:COLORS.jacketOlive;
  const skin=isRanger||isIver||isHiker?COLORS.skinWarm:COLORS.skin;
  const hair=isTraveler||isAlexis?COLORS.hairChestnut:COLORS.hairBrown;
  const trousers=isTraveler?COLORS.ink:isAlexis?COLORS.jeans:COLORS.trousers;
  const accent=isAlexis?COLORS.paper:isTraveler?COLORS.gold:isIver?COLORS.cream:COLORS.bronze;
  // Anatomically more natural proportions than the original toy-like avatar.
  // Grounded shoes with toe caps, leg segments, neck, shoulders and fitted torso.
  for(const side of [-1,1]){
    m.ellipsoid(side*.23,.52,0,.165,.44,.17,trousers,13,8);
    m.ellipsoid(side*.24,.25,-.075,.19,.22,.23,COLORS.leather,13,8);
    m.ellipsoid(side*.24,.105,-.19,.225,.115,.32,COLORS.woodDark,13,7);
    m.box(side*.24,.12,-.42,.26,.038,.036,COLORS.stoneWarm);
    m.ellipsoid(side*.47,1.16,0,.18,.36,.20,jacket,13,8);
    m.ellipsoid(side*.53,.81,-.04,.137,.16,.15,skin,12,7);
    m.ellipsoid(side*.455,1.48,0,.195,.18,.19,jacket,12,7);
  }
  m.ellipsoid(0,1.29,.015,.43,.58,.29,jacket,16,10);
  m.box(0,1.16,-.286,.10,.70,.025,mix(jacket,COLORS.cream,.4)); // jacket zipper
  m.sphere(0,1.64,0,.15,skin,12,7);
  m.ellipsoid(0,1.99,-.025,.39,.48,.38,skin,19,13);
  // Detailed ear geometry, eyes with pupils and light catch, eyebrows and small mouth.
  for(const side of [-1,1]){
    m.ellipsoid(side*.397,1.99,-.015,.085,.155,.09,skin,11,7);
    m.ellipsoid(side*.156,2.025,-.373,.083,.065,.023,COLORS.white,12,7);
    m.sphere(side*.157,2.02,-.399,.042,COLORS.hairBrown,11,7);
    m.sphere(side*.146,2.043,-.433,.016,COLORS.white,8,5);
    m.box(side*.166,2.129,-.366,.155,.032,.028,hair);
    m.ellipsoid(side*.26,1.85,-.343,.066,.036,.017,COLORS.blush,10,6);
  }
  m.ellipsoid(0,1.96,-.405,.052,.073,.055,skin,10,6);
  m.ellipsoid(0,1.795,-.366,.097,.023,.018,COLORS.hairBrown,12,6);
  // Character-specific volumetric hairstyles and accessories.
  m.ellipsoid(0,2.335,.04,.402,.19,.38,hair,17,9);
  for(const side of [-1,1])
    m.ellipsoid(side*.33,2.19,.07,.11,.19,.29,hair,11,7);
  if(isAlexis||isTraveler){
    m.ellipsoid(.36,2.03,.26,.19,.28,.18,hair,14,9); // ponytail
    m.ellipsoid(-.08,2.27,-.32,.26,.11,.11,hair,12,6);
  } else if(isRanger||isIver||isPost){
    const hat=isPost?COLORS.rose:isRanger?COLORS.jacketOlive:COLORS.woodDark;
    m.cylinder(0,2.34,.005,.40,.30,hat,19);
    m.cylinder(0,2.235,-.04,.57,.055,hat,22);
    m.box(0,2.31,-.414,.28,.075,.04,accent);
  } else {
    for(let i=0;i<4;i++)m.ellipsoid((i-1.5)*.15,2.39,-.12,.11,.115,.17,hair,10,6);
  }
  // Fabric panels, shirt seams, backpack straps or sling bag.
  for(const side of [-1,1]){
    m.box(side*.31,1.41,-.285,.08,.70,.04,mix(jacket,COLORS.ink,.18));
    m.sphere(side*.30,.92,-.257,.035,accent,9,5);
  }
  if(isTraveler||isPost){
    m.box(-.22,1.32,-.315,.07,.86,.05,COLORS.leather);
    m.ellipsoid(.32,.91,-.25,.21,.24,.10,COLORS.leather,12,7);
    m.box(.32,.96,-.355,.14,.055,.04,accent);
  }else{
    m.ellipsoid(0,1.07,.32,.36,.46,.20,COLORS.leather,14,9);
    m.box(0,1.40,.51,.27,.09,.04,accent);
    for(const side of [-1,1])m.box(side*.31,1.34,-.25,.062,.7,.045,COLORS.leather);
  }
  if(isAlexis||isIver){
    // A physical mail badge with tiny embossed envelope.
    m.box(.20,1.45,-.325,.24,.19,.055,COLORS.paper);
    m.box(.20,1.45,-.364,.15,.025,.018,COLORS.rose);
  }
  if(isHiker){
    m.ellipsoid(0,1.55,-.30,.22,.17,.085,COLORS.paper,12,8);
    m.box(0,1.58,-.39,.12,.05,.03,COLORS.blue);
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
uniform vec2 u_gait;
uniform float u_character;
varying vec3 v_color;
varying float v_fog;
void main(){
  // GPU-driven leg/arm articulation while moving; zero deformation at rest.
  vec3 local=a_position;
  if(u_character>0.5){
    float stride=sin(u_gait.x)*u_gait.y;
    if(local.y<0.91 && abs(local.x)>0.10){
      local.z+=sign(local.x)*stride*0.27*(1.0-smoothstep(0.16,0.96,local.y));
      local.y+=abs(stride)*0.045*(1.0-smoothstep(0.1,0.75,local.y));
    }
    if(local.y>0.78 && local.y<1.58 && abs(local.x)>0.43){
      local.z-=sign(local.x)*stride*0.17;
    }
  }
  float s=sin(u_pose.w),c=cos(u_pose.w);
  vec3 p=vec3(local.x*c-local.z*s,local.y,local.x*s+local.z*c)+u_pose.xyz;
  vec3 n=normalize(vec3(a_normal.x*c-a_normal.z*s,a_normal.y,a_normal.x*s+a_normal.z*c));
  vec4 view=u_view*vec4(p,1.0);
  gl_Position=u_projection*view;
  float lambert=max(0.0,dot(n,normalize(vec3(-0.47,0.91,0.36))));
  float fill=max(0.0,dot(n,normalize(vec3(0.38,0.52,-0.68))));
  float light=0.63+0.53*lambert+0.11*fill;
  v_color=clamp(a_color*light+vec3(0.022,0.025,0.018),0.0,1.0);
  v_fog=clamp((-view.z-54.0)/155.0,0.0,0.78);
}`;
const fragmentShader=String.raw`
precision mediump float;
varying vec3 v_color;
varying float v_fog;
void main(){
  vec3 daylight=pow(v_color,vec3(0.96));
  gl_FragColor=vec4(mix(daylight,vec3(0.77,0.84,0.81),v_fog),1.0);
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
  const emptyMoves=():Record<WorldMove,boolean>=>({forward:false,back:false,left:false,right:false,sprint:false});
  const keyboardMoves=emptyMoves(),touchMoves=emptyMoves(),moves=emptyMoves();
  const keyActivity:Record<WorldMove,number>={forward:0,back:0,left:0,right:0,sprint:0};
  let disposed=false,frame=0,last=0,lastPositionUpdate=0,ready=false;
  let x=0,z=18,avatarYaw=0,orbit=0,distance=8.9,jumpHeight=0,jumpSpeed=0;
  let chosenAvatar:WorldAvatar='explorer',stridePhase=0,strideBlend=0;
  let nearId:WorldLandmark['id']|null=null;
  let pointerId:number|null=null,lastPointerX=0;
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:true,powerPreference:'default',premultipliedAlpha:false});
  if(!gl){
    events.onError('3D graphics are unavailable on this device. Turn on hardware acceleration or try another browser.');
    return {setMove:()=>{},setAvatar:()=>{},jump:()=>{},interact:()=>events.onInteract(null),reset:()=>{},dispose:()=>{}};
  }
  const buffers:GPUBuffer[]=[];
  let program:WebGLProgram|null=null;
  let observer:ResizeObserver|null=null;
  // Attribute locations are queried only *after* the shader program is linked.
  let position=-1,normalAttr=-1,colorAttr=-1;
  let poseUniform:WebGLUniformLocation|null=null,viewUniform:WebGLUniformLocation|null=null,projectionUniform:WebGLUniformLocation|null=null;
  let gaitUniform:WebGLUniformLocation|null=null,characterUniform:WebGLUniformLocation|null=null;
  let world:GPUBuffer,players:Record<WorldAvatar,GPUBuffer>,alexis:GPUBuffer,iver:GPUBuffer,postmaster:GPUBuffer,hiker:GPUBuffer;
  let detailedWorld:GPUBuffer|null=null;
  const realModels:Partial<Record<ApoAssetName,GPUBuffer>>={};
  const assetAbort=new AbortController();
  const forestPositions:{x:number;z:number;kind:'pine'|'canopy';yaw:number}[]=[];
  const forestRandom=seeded(77342);
  for(let i=0;i<66;i++){
    const px=forestRandom()*94-47,pz=forestRandom()*82-44;
    const kind=forestRandom()>.65?'canopy':'pine';
    const yaw=forestRandom()*Math.PI*2;
    if((Math.abs(px)<10&&pz>-18) || Math.hypot(px+17,pz+11)<11 ||
      Math.hypot(px-17,pz+14)<11 || Math.hypot(px-14,pz+28)<8)continue;
    forestPositions.push({x:px,z:pz,kind,yaw});
  }
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
    gaitUniform=gl.getUniformLocation(program,'u_gait');
    characterUniform=gl.getUniformLocation(program,'u_character');
    world=createGPU(gl,villageStatic());
    players={
      explorer:createGPU(gl,characterMesh('explorer')),
      ranger:createGPU(gl,characterMesh('ranger')),
      traveler:createGPU(gl,characterMesh('traveler')),
    };
    alexis=createGPU(gl,characterMesh('alexis'));
    iver=createGPU(gl,characterMesh('iver'));
    postmaster=createGPU(gl,characterMesh('postmaster'));
    hiker=createGPU(gl,characterMesh('hiker'));
    buffers.push(world,...Object.values(players),alexis,iver,postmaster,hiker);
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
    gl.clearColor(.71,.84,.88,0);
  }catch{
    buffers.forEach(b=>gl.deleteBuffer(b.buffer));
    if(program)gl.deleteProgram(program);
    events.onError('We could not start this 3D world. Please try again with WebGL enabled.');
    return {setMove:()=>{},setAvatar:()=>{},jump:()=>{},interact:()=>events.onInteract(null),reset:()=>{},dispose:()=>{}};
  }
  // Load GLB assets in parallel, never blocking first playable frame.
  // Temporary fallback models remain in GPU memory until the route is disposed.
  // An individual unavailable CDN asset cannot prevent exploration.
  const allAssets=(Object.keys(APO_MODEL_ASSETS) as ApoAssetName[]);
  const requestedAssets=window.innerWidth<680
    ? allAssets.filter(name=>name!=='alexis'&&name!=='iver'&&name!=='canopy')
    : allAssets;
  void Promise.allSettled(requestedAssets.map(async name=>{
    const asset=APO_MODEL_ASSETS[name];
    const geometry=await loadApoGlb(asset.url,asset.height,assetAbort.signal);
    return {name,geometry};
  })).then(results=>{
    if(disposed)return;
    let imported=0;
    for(const result of results){
      if(result.status!=='fulfilled')continue;
      try{
        const {name,geometry}=result.value;
        const gpu=createGPU(gl,geometry);
        realModels[name]=gpu;buffers.push(gpu);imported++;
      }catch{/* Failure is restricted to this model only. */}
    }
    const hasForest=!!(realModels.pine||realModels.canopy);
    const hasVillage=!!(realModels.postOffice&&realModels.library);
    if(hasForest||hasVillage){
      try{
        detailedWorld=createGPU(gl,villageStatic(hasForest,hasVillage));
        buffers.push(detailedWorld);
      }catch{/* Keep the existing complete world as fallback. */}
    }
    events.onAssets?.(imported,requestedAssets.length);
  });
  const draw=(mesh:GPUBuffer,pose:[number,number,number,number],gait:[number,number]=[0,0])=>{
    gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);
    gl.vertexAttribPointer(position,3,gl.FLOAT,false,36,0);gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(normalAttr,3,gl.FLOAT,false,36,12);gl.enableVertexAttribArray(normalAttr);
    gl.vertexAttribPointer(colorAttr,3,gl.FLOAT,false,36,24);gl.enableVertexAttribArray(colorAttr);
    gl.uniform4f(poseUniform,pose[0],pose[1],pose[2],pose[3]);
    gl.uniform2f(gaitUniform,gait[0],gait[1]);
    gl.uniform1f(characterUniform,gait[1]>0?1:0);
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
  const jump=()=>{if(!disposed&&jumpHeight===0&&jumpSpeed===0)jumpSpeed=5.8;};
  // Separate physical-key and touch input so neither can leave a phantom
  // movement state when a pointer is cancelled or a browser menu steals focus.
  const keyMap:Record<string,WorldMove>={'w':'forward','arrowup':'forward','s':'back','arrowdown':'back','a':'left','arrowleft':'left','d':'right','arrowright':'right','shift':'sprint'};
  const clearMovement=()=>{
    for(const move of Object.keys(moves) as WorldMove[]){
      keyboardMoves[move]=false;touchMoves[move]=false;moves[move]=false;
    }
    strideBlend=0;
  };
  const keyDown=(event:KeyboardEvent)=>{
    const target=event.target as HTMLElement|null;
    if(event.altKey||event.ctrlKey||event.metaKey||target?.isContentEditable||
      target?.closest('button,a,input,textarea,select,[role="dialog"]'))return;
    const key=event.key.toLowerCase(),movement=keyMap[key];
    if(movement){
      keyboardMoves[movement]=true;keyActivity[movement]=performance.now();
      event.preventDefault();
    }
    if((key==='e'||key==='enter')&&!event.repeat){interact();event.preventDefault();}
    if((key===' '||key==='space')&&!event.repeat){jump();event.preventDefault();}
  };
  const keyUp=(event:KeyboardEvent)=>{
    // Always process release, even if focus moved to a button after keydown.
    const movement=keyMap[event.key.toLowerCase()];
    if(movement){keyboardMoves[movement]=false;moves[movement]=touchMoves[movement];}
  };
  const onVisibilityChange=()=>{if(document.hidden)clearMovement();};
  const onContextMenu=()=>clearMovement();
  const onPageHide=()=>clearMovement();
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
  window.addEventListener('blur',clearMovement);
  window.addEventListener('pagehide',onPageHide);
  window.addEventListener('contextmenu',onContextMenu,true);
  document.addEventListener('visibilitychange',onVisibilityChange);
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
      // Keyboard auto-repeat normally refreshes this watchdog; a missed keyup
      // or browser context menu cannot make the avatar walk forever.
      const now=performance.now();
      for(const move of Object.keys(moves) as WorldMove[]){
        if(keyboardMoves[move] && now-keyActivity[move]>2200)keyboardMoves[move]=false;
        moves[move]=keyboardMoves[move]||touchMoves[move];
      }
      const forward=Number(moves.forward)-Number(moves.back);
      const side=Number(moves.right)-Number(moves.left);
      const mag=Math.hypot(side,forward);
      if(mag){
        const speed=moves.sprint?7.4:4.4;
        const fx=Math.sin(orbit),fz=-Math.cos(orbit),sx=Math.cos(orbit),sz=Math.sin(orbit);
        const dx=(side*sx+forward*fx)/mag,dz=(side*sz+forward*fz)/mag;
        const nx=clamp(x+dx*speed*dt,-35,35),nz=clamp(z+dz*speed*dt,-33,32);
        // House foundations are solid: do not let the avatar walk through walls.
        const buildings=[[-17,-11,5.4],[17,-14,5.6],[27,-27,3.7],[-27,-22,3.9]];
        const blocked=(px:number,pz:number)=>buildings.some(([bx,bz,r])=>Math.hypot(px-bx,pz-bz)<r);
        if(!blocked(nx,z))x=nx;
        if(!blocked(x,nz))z=nz;
        avatarYaw=Math.atan2(-dx,-dz);
      }
      if(jumpHeight>0||jumpSpeed>0){
        jumpHeight=Math.max(0,jumpHeight+jumpSpeed*dt);
        jumpSpeed=jumpHeight===0?0:jumpSpeed-15.4*dt;
      }
      const eyeX=x+Math.sin(orbit)*distance,eyeZ=z+Math.cos(orbit)*distance;
      const eyeY=groundHeight(eyeX,eyeZ)+distance*.36+1.85;
      const target:V3=[x,groundHeight(x,z)+1.55,z-1.9];
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(viewUniform,false,lookAt([eyeX,eyeY,eyeZ],target));
      gl.uniformMatrix4fv(projectionUniform,false,perspective(Math.PI/3.25,canvas.width/Math.max(canvas.height,1),.12,260));
      draw(detailedWorld||world,[0,0,0,0]);
      if(detailedWorld&&(realModels.pine||realModels.canopy)){
        for(const tree of forestPositions){
          const model=realModels[tree.kind]||realModels.pine||realModels.canopy;
          if(model)draw(model,[tree.x,groundHeight(tree.x,tree.z),tree.z,tree.yaw]);
        }
      }
      if(detailedWorld&&realModels.postOffice&&realModels.library){
        draw(realModels.postOffice,[-17,groundHeight(-17,-11),-11,Math.PI]);
        draw(realModels.library,[17,groundHeight(17,-14),-14,Math.PI]);
      }
      draw(realModels.alexis||alexis,[-5,groundHeight(-5,3),3,Math.PI],[time*.0017,.07]);
      draw(realModels.iver||iver,[6,groundHeight(6,1),1,Math.PI],[time*.0016,.06]);
      draw(postmaster,[-10,groundHeight(-10,-5),-5,Math.PI*.91],[time*.0014,.045]);
      draw(hiker,[11,groundHeight(11,-3),-3,Math.PI*1.12],[time*.0019,.05]);
      strideBlend=events.reduceMotion?0:clamp(strideBlend+(mag?dt*6:-dt*10),0,1);
      if(mag>0)stridePhase+=dt*(moves.sprint?14.3:10.3);
      const bob=events.reduceMotion?0:strideBlend*Math.abs(Math.sin(stridePhase))*.055;
      draw(realModels[chosenAvatar]||players[chosenAvatar],[x,groundHeight(x,z)+jumpHeight+bob,z,avatarYaw],[stridePhase,strideBlend]);
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
  const reset=()=>{x=0;z=18;orbit=0;avatarYaw=0;strideBlend=0;jumpHeight=0;jumpSpeed=0;clearMovement();};
  const dispose=()=>{
    if(disposed)return;disposed=true;
    assetAbort.abort();
    window.cancelAnimationFrame(frame);
    window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',clearMovement);
    window.removeEventListener('pagehide',onPageHide);
    window.removeEventListener('contextmenu',onContextMenu,true);
    document.removeEventListener('visibilitychange',onVisibilityChange);
    window.removeEventListener('resize',resize);observer?.disconnect();
    canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);
    canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerUp);
    canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('webglcontextlost',contextLost);
    buffers.forEach(b=>gl.deleteBuffer(b.buffer));if(program)gl.deleteProgram(program);
  };
  return {setMove:(key,active)=>{touchMoves[key]=active;},setAvatar:(avatar)=>{if(avatar in players)chosenAvatar=avatar;},jump,interact,reset,dispose};
}
