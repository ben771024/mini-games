// Exercises the real game loop with a minimal DOM/canvas adapter, without browser dependencies.
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const elements={};const drawing=new Proxy({},{get:()=>()=>{}});
const get=id=>elements[id]??={hidden:false,textContent:'',classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},getContext:()=>drawing,getBoundingClientRect:()=>({width:960,height:480})};
const sandbox={document:{getElementById:get,createElement:()=>({getContext:()=>drawing}),querySelectorAll:()=>[],addEventListener(){}},window:{addEventListener(){}},requestAnimationFrame(){},setTimeout(){},console};
vm.createContext(sandbox);
const source=fs.readFileSync(__dirname+'/game.js','utf8').replace('resize();previewDogs();requestAnimationFrame(tick);',`globalThis.test={reset,update,render,setAction,selectScreen,togglePause,hurt,get:()=>({player,coins,enemies,mode,score,kills}),select:t=>selected=t, jump:()=>jumpQueued=true,attack:()=>attackQueued=true};`);
vm.runInContext(source,sandbox);const g=sandbox.test,dt=1/120;
for(const type of ['gui','miso']){
 g.select(type);g.reset();g.update(dt);let {player:p,coins,enemies}=g.get();
 assert.equal(p.onGround,true);assert.equal(p.hp,3);
 g.jump();g.update(dt);assert.ok(p.vy<0,'jump must rise');for(let i=0;i<130;i++)g.update(dt);assert.equal(p.onGround,true);
 // Landing on an elevated one-way platform.
 p.x=450;p.y=220;p.vy=0;for(let i=0;i<70;i++)g.update(dt);assert.equal(p.y+p.h,307);
 // Coin collection and attack resolve using actual collision code.
 const priorScore=g.get().score;p.x=coins[0].x-p.w/2;p.y=398-p.h;g.update(dt);assert.equal(g.get().score,priorScore+1);
 p.x=enemies[0].x-p.w-12;p.dir=1;g.attack();g.update(dt);assert.equal(enemies[0].alive,false);assert.equal(g.get().kills,1);
 // Both road gaps can be crossed by both dogs at regular speed.
 for(const pit of [{x:1860,w:105},{x:3020,w:100}]){g.reset();p=g.get().player;p.x=pit.x-p.w-12;g.update(dt);g.setAction('right',true);g.jump();for(let i=0;i<120;i++)g.update(dt);assert.ok(p.x>pit.x+pit.w,'must clear gap');assert.equal(p.hp,3);assert.equal(p.onGround,true);}
 // An unattended fall costs one heart and respawns on solid ground.
 g.reset();p=g.get().player;p.x=1870;p.y=500;for(let i=0;i<45;i++)g.update(dt);assert.equal(p.hp,2);assert.ok(p.x<1860);
 g.togglePause();assert.equal(g.get().mode,'paused');g.togglePause();assert.equal(g.get().mode,'playing');
 // Walk the complete level with normal movement, timed jumps and attacks.
 g.reset();p=g.get().player;g.setAction('right',true);
 for(let frame=0;frame<5000&&g.get().mode==='playing';frame++){
   if(p.onGround&&((p.x>1800&&p.x<1860)||(p.x>2960&&p.x<3020)))g.jump();
   g.attack();g.update(dt);if(frame%120===0)g.render();
 }
 assert.equal(g.get().mode,'won',`${type} must complete the actual level: x=${p.x}, hp=${p.hp}`);assert.ok(g.get().score>10);assert.equal(p.hp,3);
 g.selectScreen();assert.equal(g.get().mode,'select');g.reset();g.hurt();g.get().player.inv=0;g.hurt();g.get().player.inv=0;g.hurt();assert.equal(g.get().mode,'lost');
 console.log('PASS',type,': jumping, platforms, coins, attack, gaps, respawn, pause, full-level completion, game over');
}

