import { startApoWorld as startLegacyWorld, type WorldAvatar, type WorldController, type WorldLandmark, type WorldMove } from './apoWorldEngine';
import { mountApoThreeWorld } from './apoThreeWorldEngine';

type Events={
  onNearby:(location:WorldLandmark|null)=>void;
  onInteract:(location:WorldLandmark|null)=>void;
  onPosition:(position:{x:number;z:number})=>void;
  onReady:()=>void;
  onError:(message:string)=>void;
  onAssets?:(loaded:number,total:number)=>void;
  reduceMotion:boolean;
};

/** The 3D world now prefers real GLTF materials and skeletal animation.
 * The WebGL1 scene is only used when the enhanced engine cannot start. */
export function startApoWorld(canvas:HTMLCanvasElement,events:Events):WorldController {
  let disposed=false,world:WorldController|null=null;
  let chosenAvatar:WorldAvatar='explorer';
  const moveStates:Record<WorldMove,boolean>={forward:false,back:false,left:false,right:false,sprint:false};
  void mountApoThreeWorld(canvas,events).then(controller=>{
    if(disposed){controller.dispose();return;}
    world=controller;
    controller.setAvatar(chosenAvatar);
    for(const [key,active] of Object.entries(moveStates))
      if(active)controller.setMove(key as WorldMove,active);
  }).catch(cause=>{
    if(disposed)return;
    const reason=cause instanceof Error?cause.message:String(cause);
    canvas.dataset.apoBootError=reason.slice(0,250);
    console.error('Apo Letter World: enhanced renderer could not initialize',cause);
    world=startLegacyWorld(canvas,events);
    world.setAvatar(chosenAvatar);
    for(const [key,active] of Object.entries(moveStates))
      if(active)world.setMove(key as WorldMove,active);
  });
  return {
    setMove:(key,active)=>{moveStates[key]=active;world?.setMove(key,active);},
    setAvatar:(avatar)=>{chosenAvatar=avatar;world?.setAvatar(avatar);},
    jump:()=>world?.jump(),
    interact:()=>world?.interact(),
    reset:()=>world?.reset(),
    dispose:()=>{disposed=true;world?.dispose();}
  };
}
