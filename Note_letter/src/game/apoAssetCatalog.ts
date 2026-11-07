/**
 * Curated CC0 glTF assets for the new art direction.
 * Models are lazy-loaded on /world only and never used to populate letter content.
 * Production can vendor these URLs into /public/apo-models/ to remove CDN dependence.
 */
const base='https://raw.githubusercontent.com/nishit47/Blender-Pre-vis-Pipeline---Screenplay-to-Animatic/6d6de54a1d7143cf5487462d147bbef039de4837/assets/';
const source=(group:string,file:string)=>base+encodeURIComponent(group)+'/'+encodeURIComponent(file);
export type ApoAssetName = 'explorer'|'ranger'|'traveler'|'alexis'|'iver'|'pine'|'canopy'|'postOffice'|'library';
export const APO_MODEL_ASSETS:Record<ApoAssetName,{url:string;height:number;origin:string}> = {
  explorer:{url:source('Ultimate Modular Men Pack-glb','Adventurer.glb'),height:2.45,origin:'Quaternius — Ultimate Modular Men (CC0)'},
  ranger:{url:source('Ultimate Modular Men Pack-glb','Farmer.glb'),height:2.48,origin:'Quaternius — Ultimate Modular Men (CC0)'},
  traveler:{url:source('Ultimate Modular Women Pack-glb','Adventurer.glb'),height:2.4,origin:'Quaternius — Ultimate Modular Women (CC0)'},
  alexis:{url:source('Ultimate Modular Women Pack-glb','Animated Woman.glb'),height:2.35,origin:'Quaternius — Ultimate Modular Women (CC0)'},
  iver:{url:source('Ultimate Modular Men Pack-glb','Casual Character.glb'),height:2.45,origin:'Quaternius — Ultimate Modular Men (CC0)'},
  pine:{url:'https://raw.githubusercontent.com/anshaneja5/skyline-run/0c41526d8d4130c37c15e219c2c3737fa8cb4ad8/public/assets/models/tree1.glb',height:9,origin:'Quaternius — Stylized Nature MegaKit (CC0)'},
  canopy:{url:'https://raw.githubusercontent.com/anshaneja5/skyline-run/0c41526d8d4130c37c15e219c2c3737fa8cb4ad8/public/assets/models/tree2.glb',height:8.8,origin:'Quaternius — Stylized Nature MegaKit (CC0)'},
  postOffice:{url:source('Medieval Village Pack-glb','Fantasy House.glb'),height:5.6,origin:'Quaternius — Medieval Village Pack (CC0)'},
  library:{url:source('Medieval Village Pack-glb','Fantasy House-BH2XHWUNmF.glb'),height:5.8,origin:'Quaternius — Medieval Village Pack (CC0)'},
};
