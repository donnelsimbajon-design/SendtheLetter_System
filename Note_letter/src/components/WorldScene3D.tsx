import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { useWriterPreferences } from '../store/writerPreferences';
import type { MascotName } from './Mascot';

export type WorldKind = 'home' | 'overview' | 'library' | 'community' | 'messages' | 'profile' | 'settings' | 'capsule' | 'letter' | 'general';

type Props = {
  kind: WorldKind;
  className?: string;
  title?: string;
  opened?: boolean;
  controls?: boolean;
  compact?: boolean;
};

type Vec3 = [number, number, number];
type Vec4 = [number, number, number, number];
type Shape = { buffer: WebGLBuffer; count: number };
type Painter = (shape: Shape, position: Vec3, scale: Vec3, color: Vec4, angles?: [number, number], texture?: WebGLTexture) => void;

// All meshes are real three-dimensional geometry on a WebGL canvas; unlike the
// existing CSS relief system, they have a perspective camera and depth testing.
const vertexSource = [
  'attribute vec3 a_position;',
  'attribute vec3 a_normal;',
  'attribute vec2 a_uv;',
  'uniform vec3 u_position;',
  'uniform vec3 u_scale;',
  'uniform vec2 u_local;',
  'uniform vec2 u_world;',
  'uniform float u_aspect;',
  'varying float v_light;',
  'varying vec2 v_uv;',
  'vec3 yaw(vec3 p,float a) { float s=sin(a), c=cos(a); return vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c); }',
  'vec3 pitch(vec3 p,float a) { float s=sin(a), c=cos(a); return vec3(p.x,p.y*c-p.z*s,p.y*s+p.z*c); }',
  'void main(){',
  'vec3 p=pitch(yaw(a_position*u_scale,u_local.x),u_local.y)+u_position;',
  'p=pitch(yaw(p,u_world.x),u_world.y);',
  'vec3 n=pitch(yaw(a_normal,u_local.x),u_local.y);',
  'v_light=.72+.28*max(dot(normalize(n),normalize(vec3(-.45,.7,1.))),0.);',
  'v_uv=a_uv;',
  'gl_Position=vec4(p.x*4.2/max(1.,min(u_aspect,2.5)),p.y*4.2,1.8-p.z,7.1-p.z);',
  '}',
].join('\n');

const fragmentSource = [
  'precision mediump float;',
  'uniform vec4 u_color;',
  'uniform sampler2D u_image;',
  'uniform float u_textured;',
  'varying float v_light;',
  'varying vec2 v_uv;',
  'void main(){',
  'vec4 pixel=mix(vec4(1.),texture2D(u_image,v_uv),u_textured);',
  'gl_FragColor=vec4(u_color.rgb*v_light, u_color.a)*pixel;',
  'if(gl_FragColor.a<.01) discard;',
  '}',
].join('\n');

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('WebGL shader unavailable');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader) || 'WebGL shader failed';
    gl.deleteShader(shader);
    throw new Error(error);
  }
  return shader;
}

function makeGeometry(gl: WebGLRenderingContext, vertices: number[]): Shape {
  const buffer = gl.createBuffer();
  if (!buffer) throw new Error('WebGL buffer unavailable');
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  return { buffer, count: vertices.length / 8 };
}

function quadData(corners: Vec3[], normal: Vec3): number[] {
  const indices = [0, 1, 2, 0, 2, 3];
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const out: number[] = [];
  indices.forEach(index => out.push(...corners[index], ...normal, ...uv[index]));
  return out;
}

function createMeshes(gl: WebGLRenderingContext): Shape[] {
  const face = (p: Vec3[], n: Vec3) => quadData(p, n);
  const p = .5;
  const cube = [
    ...face([[-p,-p,p],[p,-p,p],[p,p,p],[-p,p,p]], [0,0,1]),
    ...face([[p,-p,-p],[-p,-p,-p],[-p,p,-p],[p,p,-p]], [0,0,-1]),
    ...face([[-p,-p,-p],[-p,-p,p],[-p,p,p],[-p,p,-p]], [-1,0,0]),
    ...face([[p,-p,p],[p,-p,-p],[p,p,-p],[p,p,p]], [1,0,0]),
    ...face([[-p,p,p],[p,p,p],[p,p,-p],[-p,p,-p]], [0,1,0]),
    ...face([[-p,-p,-p],[p,-p,-p],[p,-p,p],[-p,-p,p]], [0,-1,0]),
  ];
  const plane = face([[-p,-p,0],[p,-p,0],[p,p,0],[-p,p,0]], [0,0,1]);
  // A folded triangular envelope flap, hinged along its upper horizontal edge.
  const flap = [-.5,.5,0,0,0,1,0,1, .5,.5,0,0,0,1,1,1, 0,-.5,0,0,0,1,.5,0];
  return [makeGeometry(gl, cube), makeGeometry(gl, plane), makeGeometry(gl, flap)];
}

function colorOf(token: string, fallback: Vec4): Vec4 {
  if (typeof document === 'undefined') return fallback;
  const source = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  const found = source.match(/-?\d+(?:\.\d+)?/g);
  if (!found || found.length < 3) return fallback;
  const h = ((Number(found[0]) % 360) + 360) % 360;
  const s = Number(found[1]) / 100;
  const l = Number(found[2]) / 100;
  if (![h,s,l].every(Number.isFinite)) return fallback;
  const a = s * Math.min(l, 1 - l);
  const rgb = [0, 8, 4].map(n => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  });
  return [rgb[0], rgb[1], rgb[2], fallback[3]];
}

function portraitFor(kind: WorldKind): MascotName {
  if (kind === 'community') return 'piko';
  if (kind === 'messages') return 'chika';
  if (kind === 'library' || kind === 'letter') return 'basa';
  if (kind === 'profile') return 'sely';
  if (kind === 'capsule' || kind === 'settings') return 'araw';
  return 'lumi';
}

function drawWorld(
  draw: Painter,
  meshes: Shape[],
  kind: WorldKind,
  palette: { paper: Vec4; muted: Vec4; border: Vec4; accent: Vec4; rose: Vec4; sage: Vec4 },
  portrait: WebGLTexture | undefined,
  state: { time: number; open: number },
) {
  const [box, sheet, flap] = meshes;
  const { paper, muted, border, accent, rose, sage } = palette;
  const float = Math.sin(state.time * 1.15) * .09;
  // Dimensional shadow plane and solid stage.
  draw(box, [0,-1.2,-1.2], [4.6,.10,2.15], muted, [.08,0]);
  draw(box, [0,-1.09,-1.12], [4.4,.035,2.0], border, [.08,0]);

  if (kind === 'messages') {
    draw(box, [-.7,.25,.15], [2.0,1.05,.27], paper, [-.18,.10]);
    draw(box, [-.35,.47,.37], [1.5,.13,.05], border, [-.18,.10]);
    draw(box, [-.55,.17,.38], [1.13,.12,.05], sage, [-.18,.10]);
    draw(box, [.85,-.3,.8], [2.05,1.0,.3], rose, [.2,-.06]);
    draw(box, [.9,-.07,1.0], [1.5,.13,.05], paper, [.2,-.06]);
    draw(box, [.68,-.36,1.01], [1.1,.13,.05], paper, [.2,-.06]);
    draw(box, [1.45,-.93,.93], [.33,.37,.24], rose, [.4,.1]);
    if (portrait) draw(sheet, [-1.45,.25,.70], [.7,.7,1], [1,1,1,1], [.13,0], portrait);
    return;
  }

  if (kind === 'capsule' || kind === 'settings') {
    draw(box, [-.08,-.45,.30], [1.8,1.42,1.03], sage, [-.18,.08]);
    draw(box, [-.08,.27,.30], [1.95,.24,1.16], accent, [-.18, state.open * -.5]);
    draw(box, [-.08,-.47,.91], [1.24,1.0,.07], paper, [-.18,0]);
    draw(box, [-.08,-.35,.97], [.8,.08,.05], border, [-.18,0]);
    if (portrait) draw(sheet, [.03,-.65,1.08], [.62,.62,1], [1,1,1,1], [-.18,0], portrait);
  } else {
    // Thick bound book, visible spine, page block and real perspective.
    const bookX = kind === 'library' ? -.98 : -1.45;
    draw(box, [bookX,-.13,-.58], [1.02,1.85,.55], sage, [-.28,.06]);
    draw(box, [bookX+.04,-.13,-.245], [.84,1.60,.06], paper, [-.28,.06]);
    draw(box, [bookX-.42,-.13,-.20], [.12,1.63,.06], accent, [-.28,.06]);
    draw(box, [bookX+.09,-.82,-.12], [.55,.09,.05], border, [-.28,.06]);

    // Sealed envelope body, sliding sheet and folding triangular flap.
    const rise = state.open * .73;
    draw(box, [.37,-.40,.52], [2.02,1.27,.22], muted, [.13,-.08]);
    draw(box, [.37,-.40,.67], [1.92,1.16,.04], paper, [.13,-.08]);
    draw(box, [.37,-.17+rise,.73], [1.66,1.23,.045], paper, [.13,-.08]);
    draw(box, [.37,-.09+rise,.76], [1.1,.065,.04], border, [.13,-.08]);
    draw(box, [.37,-.26+rise,.76], [.82,.06,.04], border, [.13,-.08]);
    draw(flap, [.37,-.06,.79], [1.99,.96,1], accent, [.13,-state.open*2.40-.08]);
    draw(box, [.37,-.33,.93], [.42,.42,.05], rose, [.13,-.08]);

    if (kind === 'library') {
      draw(box, [1.55,-.72,-.33], [.45,1.12,.37], rose, [.27,.04]);
      draw(box, [1.98,-.74,-.4], [.42,1.08,.37], muted, [.22,.02]);
    }
  }

  // Real SVG mascot art mapped onto a rotating, elevated 3D plane.
  if (portrait) {
    const x = kind === 'library' ? 1.5 : 1.73;
    const y = kind === 'capsule' ? .65 : .78;
    draw(box, [x,y+float,-.02], [1.12,1.12,.20], paper, [-.3,.06]);
    draw(box, [x-.48,y+float,.10], [.09,1.12,.06], accent, [-.3,.06]);
    draw(sheet, [x,y+float,.16], [1.02,1.02,1], [1,1,1,1], [-.3,.06], portrait);
  }
  // Floating three-dimensional paper scraps accent the space.
  draw(box, [-1.97,.95,-1.10], [.55,.75,.06], rose, [.65,.25]);
  draw(box, [2.12,-.78,-.61], [.52,.73,.08], accent, [-.35,-.1]);
  draw(box, [.85,1.24,-1.0], [.48,.64,.06], paper, [.42,.2]);
}

function tryStart(
  canvas: HTMLCanvasElement,
  kind: WorldKind,
  refs: {
    open: { current: boolean };
    moving: { current: boolean };
    yaw: { current: number };
    pitch: { current: number };
  },
  motion: boolean,
  onFail: () => void,
): () => void {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: 'low-power' })
    || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
  if (!gl) { onFail(); return () => {}; }
  let disposed = false;
  let visible = true;
  const observer = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver(entries => { visible = Boolean(entries[0]?.isIntersecting); })
    : null;
  observer?.observe(canvas);
  let raf = 0;
  let program: WebGLProgram | null = null;
  let shapes: Shape[] = [];
  const textures: WebGLTexture[] = [];
  const images: HTMLImageElement[] = [];
  try {
    const vs = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    program = gl.createProgram();
    if (!program) throw new Error('WebGL program unavailable');
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'WebGL link failed');
    gl.useProgram(program);
    shapes = createMeshes(gl);
  } catch {
    shapes.forEach(item => gl.deleteBuffer(item.buffer));
    if (program) gl.deleteProgram(program);
    onFail();
    return () => {};
  }

  const attributes = {
    point: gl.getAttribLocation(program, 'a_position'),
    normal: gl.getAttribLocation(program, 'a_normal'),
    uv: gl.getAttribLocation(program, 'a_uv'),
  };
  const uniforms = {
    offset: gl.getUniformLocation(program, 'u_position'),
    scale: gl.getUniformLocation(program, 'u_scale'),
    local: gl.getUniformLocation(program, 'u_local'),
    world: gl.getUniformLocation(program, 'u_world'),
    aspect: gl.getUniformLocation(program, 'u_aspect'),
    color: gl.getUniformLocation(program, 'u_color'),
    textured: gl.getUniformLocation(program, 'u_textured'),
    image: gl.getUniformLocation(program, 'u_image'),
  };

  const palette = {
    paper: colorOf('--card',[.98,.95,.88,1]),
    muted: colorOf('--muted',[.83,.79,.70,1]),
    border: colorOf('--border',[.62,.58,.5,1]),
    accent: colorOf('--surface-gold',[.84,.73,.48,1]),
    rose: colorOf('--surface-rose',[.82,.65,.65,1]),
    sage: colorOf('--surface-sage',[.6,.69,.6,1]),
  };
  const portrait = gl.createTexture();
  if (portrait) {
    textures.push(portrait);
    gl.bindTexture(gl.TEXTURE_2D, portrait);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255,255,255,0]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const asset = new Image();
    images.push(asset);
    asset.onload = () => {
      if (disposed) return;
      gl.bindTexture(gl.TEXTURE_2D, portrait);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, asset);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      if (!motion) paint(performance.now());
    };
    asset.src = '/mascots/' + portraitFor(kind) + '.svg';
  }
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0,0,0,0);

  let openProgress = refs.open.current ? 1 : 0;
  let lastFrame = -1000;
  const paint = (stamp: number) => {
    if (disposed || !program) return;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.max(1, Math.min(1152, Math.round(bounds.width * pixelRatio)));
    const height = Math.max(1, Math.min(700, Math.round(bounds.height * pixelRatio)));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width; canvas.height = height;
      gl.viewport(0,0,width,height);
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);
    const aspect = width / height;
    const t = motion ? stamp / 1000 : 0;
    const target = refs.open.current ? 1 : 0;
    openProgress = motion ? openProgress + (target - openProgress)*.12 : target;
    const worldYaw = refs.yaw.current + (motion && !refs.moving.current ? Math.sin(t*.37)*.12 : 0);
    gl.uniform2f(uniforms.world, worldYaw, refs.pitch.current);
    gl.uniform1f(uniforms.aspect, aspect);
    gl.uniform1i(uniforms.image, 0);

    const draw: Painter = (shape, position, scale, color, angles=[0,0], texture) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, shape.buffer);
      gl.enableVertexAttribArray(attributes.point);
      gl.enableVertexAttribArray(attributes.normal);
      gl.enableVertexAttribArray(attributes.uv);
      gl.vertexAttribPointer(attributes.point, 3, gl.FLOAT, false, 32, 0);
      gl.vertexAttribPointer(attributes.normal, 3, gl.FLOAT, false, 32, 12);
      gl.vertexAttribPointer(attributes.uv, 2, gl.FLOAT, false, 32, 24);
      gl.uniform3fv(uniforms.offset, position);
      gl.uniform3fv(uniforms.scale, scale);
      gl.uniform2fv(uniforms.local, angles);
      gl.uniform4fv(uniforms.color, color);
      gl.uniform1f(uniforms.textured, texture ? 1 : 0);
      if (texture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
      }
      gl.drawArrays(gl.TRIANGLES, 0, shape.count);
    };
    drawWorld(draw, shapes, kind, palette, portrait || undefined, { time: t, open: openProgress });
  };

  const onContextLost = (event: Event) => { event.preventDefault(); onFail(); };
  canvas.addEventListener('webglcontextlost', onContextLost);
  const tick = (stamp: number) => {
    if (disposed) return;
    if (visible && document.visibilityState === 'visible' && stamp - lastFrame > 32) {
      lastFrame = stamp;
      paint(stamp);
    }
    if (motion) raf = requestAnimationFrame(tick);
  };
  if (motion) raf = requestAnimationFrame(tick);
  else paint(0);
  return () => {
    disposed = true;
    observer?.disconnect();
    cancelAnimationFrame(raf);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    images.forEach(asset => { asset.onload = null; asset.onerror = null; });
    textures.forEach(texture => gl.deleteTexture(texture));
    shapes.forEach(shape => gl.deleteBuffer(shape.buffer));
    if (program) gl.deleteProgram(program);
  };
}

export default function WorldScene3D({ kind, className='', title, opened, controls=true, compact=false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [poseVersion, setPoseVersion] = useState(0);
  const [supported, setSupported] = useState(true);
  const preferences = useWriterPreferences(state => state.preferences);
  const controlled = opened !== undefined;
  const isConversation = kind === 'messages';
  const isCapsule = kind === 'capsule' || kind === 'settings';
  const subject = isCapsule ? 'capsule' : 'letter';
  const actualOpen = controlled ? Boolean(opened) : expanded;
  const openRef = useRef(actualOpen);
  const movingRef = useRef(false);
  const yawRef = useRef(.22);
  const pitchRef = useRef(-.07);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const motion = !preferences.reduceMotion;
  const enabled = preferences.depth3D;
  useEffect(() => { openRef.current = actualOpen; }, [actualOpen]);

  useEffect(() => {
    if (!enabled || !canvasRef.current || !supported) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const useMotion = motion && !query.matches;
    const stop = tryStart(canvasRef.current, kind, {
      open: openRef, moving: movingRef, yaw: yawRef, pitch: pitchRef,
    }, useMotion, () => setSupported(false));
    return stop;
  }, [enabled, kind, motion, preferences.theme, supported, actualOpen && !motion, poseVersion]);

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    movingRef.current = true;
    lastX.current = event.clientX;
    lastY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!movingRef.current) return;
    yawRef.current = Math.max(-1, Math.min(1, yawRef.current + (event.clientX-lastX.current)*.008));
    pitchRef.current = Math.max(-.6,Math.min(.6,pitchRef.current+(event.clientY-lastY.current)*.008));
    lastX.current = event.clientX;
    lastY.current = event.clientY;
  };
  const onPointerUp = () => { movingRef.current = false; };
  return (
    <section className={'stl-webgl-world group relative isolate min-w-0 overflow-hidden rounded-[1.8rem] border border-border/80 bg-card/55 ' + className} aria-label={title || 'Interactive 3D SendTheLetter world'}>
      <div aria-hidden="true" className="pointer-events-none absolute -left-10 -top-12 h-44 w-44 rounded-full bg-[hsl(var(--surface-rose))]/40 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 right-0 h-52 w-52 rounded-full bg-[hsl(var(--surface-sage))]/50 blur-3xl" />
      {enabled && supported ? (
        <canvas
          ref={canvasRef}
          data-renderer="webgl"
          aria-hidden="true"
          className={`relative block h-full w-full cursor-grab touch-pan-y active:cursor-grabbing ${compact ? "min-h-0" : "min-h-[140px] sm:min-h-[165px]"}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      ) : (
        <div className={`relative flex h-full flex-col items-center justify-center gap-2 p-4 ${compact ? "min-h-0" : "min-h-[165px]"}`}>
          <img src={'/mascots/'+portraitFor(kind)+'.svg'} alt="" className="h-20 w-20" />
          <span className="text-center text-xs text-muted-foreground">SendTheLetter story world</span>
        </div>
      )}
      {controls && (
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
          <div className="pointer-events-none min-w-0 rounded-2xl border border-border/70 bg-card/85 px-3 py-2 text-[11px] shadow-sm backdrop-blur">
            <span className="flex items-center gap-1.5 font-bold"><Sparkles size={13} aria-hidden="true"/> Real-time 3D</span>
            <span className="block text-[10px] text-muted-foreground">{enabled && supported ? 'Drag the world to rotate' : 'Simple view'}</span>
          </div>
          {enabled && supported && (
            <div className="flex shrink-0 items-center gap-1.5">
              <button type="button" aria-label="Rotate 3D view" title="Rotate 3D view" onClick={() => { yawRef.current += .40; setPoseVersion(n => n + 1); }} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card/95 shadow-md hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary">
                <RotateCcw size={16} aria-hidden="true" />
              </button>
            <button
              type="button"
              aria-label={isConversation ? 'Rotate 3D messages' : (actualOpen ? 'Close 3D ' + subject : 'Open 3D ' + subject)}
              aria-pressed={isConversation ? undefined : actualOpen}
              onClick={() => {
                if (controlled) return;
                if (isConversation) yawRef.current += .45;
                setExpanded(value => !value);
              }}
              disabled={controlled}
              className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-card/95 px-3 text-[11px] font-bold shadow-md transition-colors hover:bg-muted disabled:opacity-50"
            >
              <RotateCcw size={13} aria-hidden="true" />
              {isConversation ? 'Rotate chat' : (actualOpen ? 'Close ' + subject : 'Open ' + subject)}
            </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
