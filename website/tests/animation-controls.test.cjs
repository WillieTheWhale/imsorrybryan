// Control-flow tests, with a stub GL context. Real shader rendering is verified in the browser.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = readFileSync(path.join(__dirname, '..', 'hero-art.js'), 'utf8').replace(/^import[\s\S]*?from "[^"]+";\n/gm, '');
function boot(reduced) {
  let now = 0;
  const events = new Map();
  const node = () => ({dataset:{},textContent:'',attrs:{},classList:{add(){}},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,fn){events.set(this.id+':'+k,fn)}});
  const nodes = Object.fromEntries(['#hero-canvas','#art-stage','#art-index','#art-title','#art-description'].map(id=>[id,Object.assign(node(),{id})]));
  const gl = new Proxy({}, {get(_,key){
    if (key==='getContextAttributes') return ()=>({stencil:true});
    if (key==='getShaderParameter'||key==='getProgramParameter') return ()=>true;
    return ()=>0;
  }});
  nodes['#hero-canvas'].getContext=()=>gl;
  nodes['#hero-canvas'].getBoundingClientRect=()=>({width:1280,height:480});
  const context = {
    FRAGMENT:'',PRINT_WIPE:'',NC_CONTOURS:[],NEURAL_EDGE_VERTEX:'',NEURAL_EDGE_FRAGMENT:'',NEURAL_NODE_VERTEX:'',NEURAL_NODE_FRAGMENT:'',
    makeNeuralGeometry:()=>({edges:new Float32Array(),discs:new Float32Array()}),
    console,Float32Array,performance:{now:()=>now},requestAnimationFrame:()=>1,cancelAnimationFrame(){},
    window:{devicePixelRatio:1,matchMedia:()=>({matches:reduced,addEventListener:(event,fn)=>events.set('preference',fn)})},
    document:{hidden:false,querySelector:id=>nodes[id],addEventListener(){}},
    ResizeObserver:class{observe(){}},IntersectionObserver:class{observe(){}},
  };
  vm.runInNewContext(source+'\nglobalThis.engineForTest=engine;',context);
  assert.ok(context.engineForTest, 'animation should initialize');
  return {engine:context.engineForTest,nodes,events,setTime:t=>{now=t}};
}
const regular=boot(false);
for(let i=0;i<6;i++){
 regular.engine.render(i*96+50);
 assert.equal(regular.nodes['#art-stage'].dataset.scene,String(i),'all six scenes remain available');
}
regular.setTime(5000);
regular.events.get('preference')({matches:true});
assert.equal(regular.engine.paused,true);
assert.equal(regular.engine.reducedMotion,true);
assert.equal(regular.nodes['#art-stage'].dataset.scene,'4');
assert.equal(regular.engine.frozenFrame,120);
regular.setTime(15000);
regular.engine.resize();
assert.equal(regular.engine.frozenFrame,120,'resize must keep a reduced-motion frame');
regular.events.get('preference')({matches:false});
assert.equal(regular.engine.currentFrame(),120,'animation resumes from its paused time');
assert.equal(regular.engine.paused,false);
const reduced=boot(true);
assert.equal(reduced.engine.paused,true);
assert.equal(reduced.nodes['#art-stage'].dataset.scene,'4','reduced motion opens on the Old Well still');
reduced.events.get('preference')({matches:false});
assert.equal(reduced.engine.reducedMotion,false);
assert.equal(reduced.engine.paused,false);
reduced.events.get('preference')({matches:true});
assert.equal(reduced.engine.paused,true);
assert.equal(reduced.nodes['#art-stage'].dataset.scene,'4');
console.log('PASS: six scenes, reduced-motion still, paused resize, and preference changes.');
