'use strict';
(() => {
const $=id=>document.getElementById(id), canvas=$('game'), ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;
let W=960;const H=480,GROUND=398,WORLD=4620;
let selected='gui',mode='select',last=0,elapsed=0,camera=0,score=0,kills=0,player,coins=[],enemies=[],particles=[],sound=false,audioContext;
const keys={left:false,right:false,jump:false,attack:false};
let jumpQueued=false,attackQueued=false;
const platforms=[{x:425,y:307,w:135,h:16},{x:685,y:253,w:145,h:16},{x:1005,y:305,w:170,h:16},{x:1420,y:300,w:170,h:16},{x:1650,y:240,w:150,h:16},{x:2110,y:308,w:190,h:16},{x:2410,y:252,w:160,h:16},{x:2770,y:310,w:150,h:16},{x:3200,y:300,w:180,h:16},{x:3440,y:244,w:165,h:16},{x:3820,y:310,w:180,h:16}];
const pits=[{x:1860,w:105},{x:3020,w:100}];
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};
function text(c,s,x,y,size=12,color='#424e40',align='left'){c.fillStyle=color;c.font=`bold ${size}px monospace`;c.textAlign=align;c.fillText(s,Math.round(x),Math.round(y));}
// Integer scanline polygons keep the artwork pixel sharp even on a scaled canvas.
function pixelShape(c,color,points){
 const minY=Math.floor(Math.min(...points.map(p=>p[1]))),maxY=Math.ceil(Math.max(...points.map(p=>p[1])));
 for(let y=minY;y<maxY;y++){
  const crossings=[];
  for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if((a[1]<=y+.5&&b[1]>y+.5)||(b[1]<=y+.5&&a[1]>y+.5))crossings.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));}
  crossings.sort((a,b)=>a-b);for(let i=0;i<crossings.length;i+=2)rect(c,Math.ceil(crossings[i]),y,Math.ceil(crossings[i+1])-Math.ceil(crossings[i]),1,color);
 }
}
function paintDog(c,x,y,scale,type,dir=1,frame=0,attack=false,front=false){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale*.55*dir,scale*.55);
 const black=type==='gui';
 const p=black?{ink:'#17191e',dark:'#25262e',fur:'#32333c',light:'#42434a',shade:'#b38a62',tan:'#d58c45',gold:'#edac62',cream:'#ecdbb9',white:'#fff0d2',pink:'#b77d7c'}:{ink:'#5a3828',dark:'#94572f',fur:'#bd7b40',light:'#d79550',shade:'#c19b6c',tan:'#dfa05b',gold:'#efbc7b',cream:'#ecd5ad',white:'#fff0cc',pink:'#b47c65'};
 const r=(x,y,w,h,col)=>rect(c,x,y,w,h,col),s=(col,pts)=>pixelShape(c,col,pts);
 // A thick ring with a dark spiral, rather than a single square tail.
 s(p.ink,[[-37,-27],[-43,-39],[-42,-51],[-35,-60],[-24,-63],[-15,-58],[-11,-48],[-14,-37],[-24,-33],[-29,-38],[-25,-46],[-28,-49],[-32,-46],[-32,-36],[-26,-27]]);
 s(p.shade,[[-36,-31],[-40,-40],[-39,-50],[-33,-57],[-24,-59],[-17,-55],[-14,-48],[-17,-40],[-23,-37],[-25,-40],[-21,-47],[-25,-52],[-31,-52],[-35,-46],[-34,-36]]);
 s(p.cream,[[-39,-45],[-36,-53],[-30,-58],[-23,-57],[-18,-53],[-16,-47],[-19,-43],[-21,-49],[-27,-54],[-33,-50],[-35,-42]]);
 r(-29,-59,6,2,p.white);
 if(front){
  // Upright portrait: the black dog's cream chest forks into a clear Y.
  s(p.ink,[[-20,-36],[-26,-25],[-25,-6],[-21,-1],[-12,0],[-8,-9],[8,-9],[11,0],[22,-1],[25,-7],[24,-28],[18,-37]]);
  s(p.fur,[[-17,-34],[-23,-23],[-21,-10],[-15,-7],[-13,-17],[-8,-10],[9,-10],[14,-18],[17,-8],[22,-10],[21,-25],[15,-34]]);
  s(p.dark,[[-21,-23],[-22,-11],[-17,-9],[-14,-22]]);
  s(p.tan,[[-20,-13],[-20,-3],[-12,-3],[-12,-17],[-16,-12]]);s(p.tan,[[12,-16],[12,-3],[21,-3],[20,-14],[16,-11]]);
  r(-19,-4,7,3,p.gold);r(13,-4,7,3,black?p.gold:p.white);r(-18,-3,1,2,p.shade);r(17,-3,1,2,p.shade);
  s(p.shade,[[-18,-31],[-16,-22],[-8,-16],[0,-13],[10,-17],[17,-24],[18,-31],[8,-26],[0,-23],[-8,-26]]);
  s(p.cream,[[-19,-32],[-13,-29],[-7,-25],[0,-23],[8,-26],[17,-32],[16,-26],[8,-21],[4,-18],[3,-13],[-3,-13],[-4,-19],[-11,-23],[-17,-26]]);
  if(!black)s(p.white,[[-15,-22],[-7,-19],[0,-18],[12,-23],[10,-17],[3,-12],[-5,-13],[-12,-17]]);
  // Broad cheeks, softly stepped silhouette and alert triangular ears.
  s(p.ink,[[-25,-40],[-25,-50],[-22,-54],[-22,-66],[-17,-69],[-7,-59],[8,-59],[18,-69],[24,-66],[24,-53],[27,-48],[26,-37],[21,-30],[10,-26],[-10,-26],[-20,-31]]);
  s(p.fur,[[-22,-40],[-22,-49],[-19,-53],[-19,-64],[-16,-65],[-7,-56],[9,-56],[19,-65],[21,-63],[21,-52],[24,-47],[23,-38],[17,-32],[8,-29],[-9,-29],[-18,-33]]);
  s(p.light,[[-18,-53],[-15,-57],[-7,-54],[7,-54],[16,-58],[20,-51],[11,-50],[4,-52],[-7,-50]]);
  s(p.pink,[[-18,-62],[-15,-61],[-10,-54],[-17,-52]]);s(p.pink,[[18,-62],[20,-61],[19,-52],[12,-54]]);
  r(-17,-60,2,6,p.shade);r(17,-59,2,6,p.shade);
  s(p.shade,[[-22,-42],[-15,-46],[-7,-42],[0,-39],[9,-42],[16,-46],[23,-42],[21,-34],[12,-29],[0,-27],[-12,-30],[-20,-35]]);
  s(p.cream,[[-21,-42],[-15,-44],[-8,-41],[-4,-38],[4,-38],[10,-42],[17,-44],[22,-41],[19,-35],[10,-31],[0,-29],[-10,-31],[-18,-35]]);
  s(p.white,[[-19,-41],[-13,-42],[-7,-39],[-6,-35],[-12,-34],[-17,-36]]);s(p.white,[[10,-40],[17,-42],[20,-40],[17,-35],[11,-34],[6,-36]]);
  s(black?p.tan:p.cream,[[-14,-50],[-9,-50],[-7,-47],[-12,-46]]);s(black?p.tan:p.cream,[[8,-49],[13,-50],[15,-47],[9,-46]]);
  r(-14,-45,8,5,p.ink);r(7,-45,8,5,p.ink);r(-11,-45,2,2,p.white);r(10,-45,2,2,p.white);
  s(p.ink,[[-5,-40],[5,-40],[4,-36],[1,-34],[-2,-35]]);r(-3,-40,5,1,'#616365');r(-1,-36,2,4,p.ink);
  s(p.ink,[[-11,-36],[-8,-33],[-3,-32],[3,-32],[9,-35],[11,-36],[9,-31],[4,-28],[-4,-28],[-9,-31]]);
  r(-4,-30,8,2,p.pink);r(-2,-30,4,1,'#e5a39a');
 }else{
  // Four articulated legs; far legs are shaded and stride opposite the near legs.
  const gait=Math.round(Math.sin(frame)*5);
  function leg(lx,offset,far=false){c.save();c.translate(lx,0);s(p.ink,[[-6,-23],[5,-22],[5+offset,-11],[8+offset,-4],[8+offset,0],[-3+offset,0],[-5+offset,-4],[-3+offset,-13]]);s(far?p.dark:p.fur,[[-4,-22],[3,-21],[2+offset,-12],[5+offset,-4],[-2+offset,-3],[-1+offset,-14]]);s(far?p.shade:p.tan,[[-1+offset,-13],[3+offset,-12],[5+offset,-4],[-2+offset,-3]]);r(-2+offset,-4,8,3,far?p.shade:p.cream);r(offset,-3,1,2,p.shade);r(offset+3,-3,1,2,p.shade);c.restore();}
  leg(-22,-gait,true);leg(10,gait,true);
  s(p.ink,[[-34,-38],[-27,-43],[-9,-42],[6,-44],[19,-39],[24,-27],[17,-15],[0,-15],[-9,-19],[-22,-15],[-34,-23]]);
  s(p.fur,[[-31,-36],[-26,-40],[-9,-39],[8,-41],[17,-37],[20,-27],[15,-18],[0,-18],[-9,-22],[-23,-18],[-31,-24]]);
  s(p.light,[[-28,-38],[-13,-39],[-8,-37],[5,-39],[10,-36],[-7,-34],[-23,-35]]);
  s(p.dark,[[-31,-28],[-25,-32],[-25,-23],[-17,-21],[-10,-23],[-4,-20],[9,-20],[14,-25],[18,-25],[14,-17],[0,-17],[-10,-21],[-24,-17]]);
  s(p.shade,[[-24,-18],[-17,-22],[-11,-22],[-5,-19],[9,-18],[10,-15],[-2,-15],[-12,-19],[-20,-16]]);
  s(p.cream,[[-22,-18],[-15,-21],[-10,-20],[-4,-17],[7,-16],[5,-14],[-5,-15],[-13,-18],[-19,-16]]);
  leg(-25,gait);
  if(!attack)leg(13,-gait);
  // Neck and front chest: cream cheek flows into the Y-shaped bib.
  s(p.fur,[[7,-46],[22,-44],[27,-30],[19,-17],[9,-19],[5,-31]]);
  s(p.shade,[[11,-36],[19,-32],[23,-33],[22,-27],[18,-20],[12,-21],[9,-29]]);
  s(p.cream,[[9,-36],[15,-33],[18,-29],[24,-32],[23,-27],[19,-24],[18,-18],[14,-19],[13,-25],[9,-28]]);
  r(13,-29,5,3,p.white);
  // Slight three-quarter face keeps both eyes readable at gameplay size.
  s(p.ink,[[5,-38],[3,-47],[7,-53],[8,-65],[12,-69],[20,-59],[27,-60],[34,-67],[39,-64],[38,-51],[42,-46],[43,-39],[36,-32],[25,-29],[14,-31]]);
  s(p.fur,[[8,-39],[6,-47],[10,-52],[10,-63],[13,-65],[20,-56],[28,-57],[35,-63],[36,-61],[35,-50],[39,-45],[40,-39],[34,-34],[25,-32],[15,-34]]);
  s(p.light,[[12,-54],[15,-57],[21,-54],[28,-55],[34,-51],[35,-47],[25,-49],[18,-47],[12,-48]]);
  s(p.pink,[[12,-62],[16,-58],[17,-54],[12,-53]]);s(p.pink,[[34,-60],[34,-53],[30,-54]]);
  s(p.shade,[[10,-42],[17,-46],[24,-42],[29,-43],[39,-42],[43,-38],[37,-33],[25,-30],[16,-32],[12,-36]]);
  s(p.cream,[[11,-41],[17,-44],[23,-40],[29,-41],[38,-40],[40,-36],[33,-33],[25,-32],[17,-34],[13,-37]]);
  s(p.white,[[14,-40],[18,-42],[23,-39],[21,-35],[16,-36]]);
  s(black?p.tan:p.cream,[[17,-51],[22,-51],[24,-48],[19,-47]]);r(32,-50,4,3,black?p.tan:p.cream);
  r(18,-46,7,5,p.ink);r(32,-46,5,4,p.ink);r(21,-46,2,2,p.white);r(34,-46,1,1,p.white);
  s(p.ink,[[36,-41],[44,-41],[44,-37],[40,-35],[37,-37]]);r(38,-41,4,1,'#676462');
  s(p.ink,[[25,-37],[28,-34],[35,-34],[39,-37],[38,-33],[33,-31],[28,-32]]);r(30,-33,5,2,p.pink);
  if(attack){s(p.ink,[[15,-27],[24,-26],[31,-22],[49,-23],[55,-26],[62,-25],[65,-20],[63,-14],[57,-11],[49,-13],[31,-14],[20,-17]]);s(p.fur,[[17,-25],[24,-24],[31,-20],[50,-21],[52,-16],[32,-17],[22,-19]]);s(p.cream,[[50,-21],[55,-24],[60,-23],[62,-20],[60,-15],[56,-14],[51,-16]]);r(59,-21,2,2,p.shade);r(59,-17,2,2,p.shade);}
 }
 c.restore();
}
const dogSprites=new Map();
function dog(c,x,y,scale,type,dir=1,frame=0,attack=false,front=false){
 const pose=Math.round((frame%(Math.PI*2))/(Math.PI/4))%8,key=[type,pose,attack,front].join(':');
 if(!dogSprites.has(key)){
  const sprite=document.createElement('canvas');sprite.width=128;sprite.height=80;
  paintDog(sprite.getContext('2d'),48,72,1/.55,type,1,pose*Math.PI/4,attack,front);dogSprites.set(key,sprite);
 }
 const zoom=scale*.55;c.save();c.imageSmoothingEnabled=false;c.translate(Math.round(x),Math.round(y));c.scale(dir,1);
 c.drawImage(dogSprites.get(key),Math.round(-48*zoom),Math.round(-72*zoom),Math.round(128*zoom),Math.round(80*zoom));c.restore();
}
function previewDogs(){for(const type of ['gui','miso']){const c=$(type+'-art').getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,180,100);rect(c,44,85,95,3,'#dad7bf');dog(c,98,85,type==='gui'?1.85:2.15,type,1,0,false,true);}}
function tone(freq,duration=.09,type='square',volume=.025){if(!sound)return;try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();audioContext.resume();const o=audioContext.createOscillator(),g=audioContext.createGain();o.type=type;o.frequency.setValueAtTime(freq,audioContext.currentTime);g.gain.setValueAtTime(volume,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);o.connect(g);g.connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+duration);}catch{}}
function burst(x,y,color,n=8){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*150,vy:-Math.random()*180,life:.5,color});}
function reset(){
 player={x:110,y:GROUND-50,w:selected==='gui'?38:48,h:selected==='gui'?50:60,vx:0,vy:0,dir:1,onGround:false,hp:3,inv:0,attack:0,cooldown:0,frame:0,checkpoint:110};player.y=GROUND-player.h;
 score=0;kills=0;elapsed=0;camera=0;particles=[];coins=[];
 for(let x=220;x<4260;x+=110){if(!pits.some(p=>x>p.x-20&&x<p.x+p.w+20))coins.push({x,y:GROUND-30,got:false});}
 for(const p of platforms)for(let x=p.x+25;x<p.x+p.w-10;x+=40)coins.push({x,y:p.y-28,got:false});
 enemies=[{x:620,type:'cat'},{x:1190,type:'bad'},{x:1530,type:'cat'},{x:2240,type:'bad'},{x:2640,type:'cat'},{x:2860,type:'cat'},{x:3350,type:'bad'},{x:3730,type:'cat'},{x:4090,type:'bad'}].map((e,i)=>({...e,start:e.x,y:GROUND-(e.type==='cat'?30:56),w:e.type==='cat'?35:30,h:e.type==='cat'?30:56,dir:i%2?1:-1,alive:true,hit:0}));
 clearInput();$('selection').hidden=true;$('result').hidden=true;$('paused').hidden=true;$('hud').hidden=false;$('pause').disabled=false;$('pause').textContent='暫停 ⏸';$('status').textContent='散步進行中・沿著街道向右探索';$('character-label').textContent=selected==='gui'?'桂桂':'Miso';$('total').textContent=String(coins.length).padStart(2,'0');mode='playing';updateHud();tone(440);setTimeout(()=>tone(660),90);
}
function clearInput(){for(const k in keys)keys[k]=false;jumpQueued=attackQueued=false;document.querySelectorAll('[data-action]').forEach(b=>b.classList.remove('pressed'));}
function updateHud(){$('health').textContent='♥'.repeat(Math.max(0,player.hp))+'♡'.repeat(3-Math.max(0,player.hp));$('coins').textContent=String(score).padStart(2,'0');$('clock').textContent=String(Math.floor(elapsed/60)).padStart(2,'0')+':'+String(Math.floor(elapsed%60)).padStart(2,'0');}
function finish(won){mode=won?'won':'lost';clearInput();$('result').hidden=false;$('pause').disabled=true;$('result-eyebrow').textContent=won?'A GOOD DAY FOR A WALK':'TAKE A BREATH, LITTLE SHIBA';$('result-title').textContent=won?'散步大成功！':'柴柴，休息一下吧';$('result-copy').textContent=won?`${selected==='gui'?'桂桂':'Miso'} 平安抵達小屋！收集 ${score} / ${coins.length} 枚金幣，擊退 ${kills} 位對手，花了 ${Math.floor(elapsed)} 秒。`:`這次收集了 ${score} 枚金幣。留意前方缺口，面向對手按 J 揮掌，再試一次！`;$('status').textContent=won?'今日散步完成・歡迎再來冒險':'散步暫告一段落';tone(won?784:165,.3);}
function hurt(){if(player.inv>0||mode!=='playing')return;player.hp--;player.inv=1.5;player.vy=-230;player.vx=-player.dir*160;burst(player.x+20,player.y+20,'#f2a17c');tone(120,.15,'sawtooth');if(player.hp<=0)finish(false);}
function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function update(dt){
 elapsed+=dt;player.inv=Math.max(0,player.inv-dt);player.cooldown=Math.max(0,player.cooldown-dt);player.attack=Math.max(0,player.attack-dt);
 const speed=selected==='gui'?215:195;player.vx=(Number(keys.right)-Number(keys.left))*speed;if(player.vx){player.dir=Math.sign(player.vx);player.frame+=dt*15;}
 if(jumpQueued&&player.onGround){player.vy=selected==='gui'?-470:-445;player.onGround=false;tone(320,.12,'triangle');}jumpQueued=false;
 if(attackQueued&&player.cooldown<=0){player.attack=.24;player.cooldown=.36;tone(200,.07,'triangle');}attackQueued=false;
 const prevY=player.y;player.x=Math.max(0,Math.min(WORLD-player.w,player.x+player.vx*dt));player.vy+=1150*dt;player.y+=player.vy*dt;player.onGround=false;
 const surfaces=platforms.concat(pits.reduce((a,p,i)=>{a.push({x:i?pits[i-1].x+pits[i-1].w:0,y:GROUND,w:p.x-(i?pits[i-1].x+pits[i-1].w:0),h:100});return a;},[]),[{x:3120,y:GROUND,w:WORLD-3120,h:100}]);
 if(player.vy>=0)for(const p of surfaces)if(player.x+player.w>p.x&&player.x<p.x+p.w&&prevY+player.h<=p.y+1&&player.y+player.h>=p.y){player.y=p.y-player.h;player.vy=0;player.onGround=true;}
 if(player.onGround&&player.y+player.h===GROUND&&!pits.some(p=>Math.abs(player.x-p.x)<160))player.checkpoint=player.x;
 if(player.y>H+100){hurt();if(mode==='playing'){player.x=player.checkpoint;player.y=GROUND-player.h;player.vy=0;player.inv=1.5;}}
 const px=player.x+player.w/2,py=player.y+player.h/2;
 for(const c of coins)if(!c.got&&Math.abs(c.x-px)<player.w/2+10&&Math.abs(c.y-py)<player.h/2+10){c.got=true;score++;burst(c.x,c.y,'#f4cd67',6);tone(880,.07);}
 const reach=selected==='gui'?48:64;
 const attackBox={x:player.dir>0?px:player.x-reach,y:player.y+8,w:reach+player.w/2,h:player.h-8};
 for(const e of enemies){if(!e.alive)continue;e.x+=e.dir*(e.type==='cat'?45:33)*dt;if(Math.abs(e.x-e.start)>60)e.dir*=-1;
  if(player.attack>0&&overlap(attackBox,e)){e.alive=false;kills++;burst(e.x+15,e.y+10,e.type==='cat'?'#d4bda0':'#a2b49a',12);tone(180,.1);}
  else if(overlap(player,e)){if(player.vy>130&&prevY+player.h<e.y+12){e.alive=false;kills++;player.vy=-290;burst(e.x,e.y,'#d2bd8c');tone(240);}else hurt();}
 }
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=500*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);
 camera=Math.max(0,Math.min(WORLD-W,player.x-W*.32));updateHud();if(player.x>4440)finish(true);
}
function cloud(x,y){rect(ctx,x,y,66,13,'#edf2dc');rect(ctx,x+10,y-10,39,15,'#edf2dc');rect(ctx,x+22,y-16,18,12,'#edf2dc');}
function building(x,width,height,body,trim,index){
 const y=GROUND-height;rect(ctx,x,y,width,height,body);rect(ctx,x-4,y-6,width+8,8,trim);rect(ctx,x+8,y+10,width-16,5,'#ffffff25');
 for(let row=0;row<2;row++){const yy=y+26+row*81;for(let col=0;col<3;col++){const xx=x+15+col*(width/3);rect(ctx,xx,yy,29,47,trim);rect(ctx,xx+3,yy+3,23,39,'#648b85');rect(ctx,xx+5,yy+5,9,17,'#a4c5b1');rect(ctx,xx+14,yy+3,2,39,trim);rect(ctx,xx-4,yy+46,36,5,'#e5d6ae');}
 if(row===0){rect(ctx,x-3,yy+55,width+6,4,trim);for(let j=0;j<width;j+=11)rect(ctx,x+j,yy+47,2,20,trim);rect(ctx,x-3,yy+66,width+6,4,trim);}}
 rect(ctx,x+10,GROUND-84,width-20,80,'#efe2be');rect(ctx,x+19,GROUND-70,width-38,66,'#526c61');rect(ctx,x+24,GROUND-65,width/2-28,49,'#a0bab0');rect(ctx,x+width/2+1,GROUND-65,width/2-28,49,'#a0bab0');rect(ctx,x+width/2-2,GROUND-68,4,63,trim);
 const awning=index%2?'#b56f48':'#718965';rect(ctx,x+4,GROUND-96,width-8,18,awning);for(let j=0;j<width-8;j+=22)rect(ctx,x+4+j,GROUND-96,11,18,'#f2deac');rect(ctx,x+2,GROUND-80,width-4,5,trim);
 rect(ctx,x+width/2-38,GROUND-128,76,25,'#efdfb6');text(ctx,['日和商店','柴柴麵包','喫茶 ひより','花草日常','MISO MART'][index%5],x+width/2,GROUND-111,10,trim,'center');
}
function plant(x){rect(ctx,x,GROUND-18,20,18,'#b47b58');rect(ctx,x-2,GROUND-21,24,5,'#d39969');rect(ctx,x+7,GROUND-44,5,24,'#536d51');rect(ctx,x-3,GROUND-37,14,9,'#6e8a5b');rect(ctx,x+11,GROUND-43,14,10,'#829764');}
function background(){
 rect(ctx,0,0,W,H,'#bbd8cc');
 for(let i=0;i<8;i++)cloud(i*210-camera*.12%210,45+(i%3)*18);
 for(let i=0;i<18;i++){const x=i*95-(camera*.23)%95,y=145+(i%4)*16;rect(ctx,x,y,74,230,'#9fbbb0');rect(ctx,x+3,y-7,66,8,'#acc5b7');for(let r=0;r<6;r++)for(let j=0;j<4;j++)rect(ctx,x+10+j*15,y+16+r*25,5,10,'#c4d6bf');}
 ctx.save();ctx.translate(-Math.floor(camera*.7),0);for(let i=-1;i<30;i++)building(i*215,180,235+(i%3)*22,['#d9b99a','#d8c9a8','#c8c7a0'][((i%3)+3)%3],'#817861',Math.abs(i));ctx.restore();
 ctx.save();ctx.translate(-Math.floor(camera),0);
 rect(ctx,0,GROUND-11,WORLD,11,'#c9c6a5');rect(ctx,0,GROUND,WORLD,H-GROUND,'#626d65');rect(ctx,0,GROUND, WORLD,5,'#f0e3bd');rect(ctx,0,GROUND+6,WORLD,9,'#878a72');
 for(let x=0;x<WORLD;x+=42){rect(ctx,x,GROUND+17,40,1,'#525f59');rect(ctx,x+12,GROUND+8,2,7,'#6b7462');}for(let x=0;x<WORLD;x+=95)rect(ctx,x,GROUND+56,42,4,'#b7b79a');
 for(const p of pits){rect(ctx,p.x,GROUND,p.w,H-GROUND,'#354b48');rect(ctx,p.x+4,GROUND+13,p.w-8,H-GROUND,'#293e3b');rect(ctx,p.x-5,GROUND-4,5,24,'#debe76');rect(ctx,p.x+p.w,GROUND-4,5,24,'#debe76');text(ctx,'!',p.x-22,GROUND-12,22,'#a87842');}
 for(let x=320;x<WORLD-250;x+=610){plant(x);rect(ctx,x+96,GROUND-74,42,74,'#5b8e80');rect(ctx,x+100,GROUND-69,34,8,'#e7e2b8');rect(ctx,x+101,GROUND-57,31,34,'#a9c5a1');for(let j=0;j<3;j++)for(let k=0;k<2;k++){rect(ctx,x+105+j*9,GROUND-53+k*15,5,10,['#dfac65','#e4dfb4','#bf7955'][j]);}rect(ctx,x+102,GROUND-14,27,8,'#355851');rect(ctx,x+95,GROUND-3,44,3,'#3f695e');}
 for(let x=170;x<WORLD;x+=980){rect(ctx,x,GROUND-192,5,192,'#6c7967');rect(ctx,x-3,GROUND-195,34,5,'#6c7967');rect(ctx,x+20,GROUND-191,14,9,'#f1e1a7');}
 for(const p of platforms){rect(ctx,p.x,p.y,p.w,p.h,'#557b6a');rect(ctx,p.x,p.y,p.w,5,'#d7d1a2');for(let x=p.x+4;x<p.x+p.w;x+=18)rect(ctx,x,p.y+5,9,9,'#88a184');rect(ctx,p.x+8,p.y+p.h,4,GROUND-p.y-p.h,'#817e62');rect(ctx,p.x+p.w-12,p.y+p.h,4,GROUND-p.y-p.h,'#817e62');}
 // Street-end home.
 rect(ctx,4355,GROUND-136,180,136,'#e5c898');rect(ctx,4340,GROUND-146,210,12,'#816b53');for(let i=0;i<6;i++)rect(ctx,4340+i*16,GROUND-146-i*8,210-i*32,8,'#b9794e');rect(ctx,4420,GROUND-73,49,73,'#687d66');rect(ctx,4427,GROUND-65,35,65,'#3c554b');rect(ctx,4375,GROUND-108,140,25,'#f5e7bd');text(ctx,'柴柴小屋',4445,GROUND-90,17,'#7e6749','center');rect(ctx,4490,GROUND-75,26,29,'#8caaa0');rect(ctx,4304,GROUND-156,4,156,'#657b65');rect(ctx,4308,GROUND-156,44,29,'#d99c63');text(ctx,'汪',4329,GROUND-135,16,'#fff1c8','center');plant(4544);
 if(mode==='select'){dog(ctx,170,GROUND-6,1.5,'gui');dog(ctx,240,GROUND-6,1.85,'miso');}
 ctx.restore();
}
function enemy(e){const x=e.x,y=e.y,bob=Math.sin(elapsed*9+e.start)*1.5;
 ctx.save();ctx.translate(Math.round(x+e.w/2),Math.round(y+e.h));ctx.scale(e.dir,1);
 if(e.type==='cat'){rect(ctx,-15,-20,30,15,'#696c60');rect(ctx,5,-28,17,17,'#717468');rect(ctx,4,-33,6,8,'#717468');rect(ctx,17,-33,6,8,'#717468');rect(ctx,7,-24,3,3,'#f0d982');rect(ctx,17,-24,3,3,'#f0d982');rect(ctx,13,-18,7,4,'#dbccb0');rect(ctx,-19,-26,5,20,'#696c60');rect(ctx,-13,-7,5,7+bob,'#474f46');rect(ctx,10,-7,5,7-bob,'#474f46');}
 else{rect(ctx,-10,-52,22,16,'#b99a76');rect(ctx,-12,-57,25,9,'#414c4b');rect(ctx,-10,-48,23,5,'#353d3d');rect(ctx,3,-46,4,2,'#e0ca9d');rect(ctx,-13,-35,28,22,'#6b7169');rect(ctx,-12,-33,26,4,'#89917c');rect(ctx,9,-31,11,7,'#b99a76');rect(ctx,-10,-14,8,14+bob,'#394b49');rect(ctx,4,-14,8,14-bob,'#394b49');rect(ctx,-13,-3+bob,12,4,'#b8ad8e');rect(ctx,4,-3-bob,13,4,'#b8ad8e');}ctx.restore();}
function render(){
 ctx.imageSmoothingEnabled=false;background();if(!player||mode==='select')return;
 ctx.save();ctx.translate(-Math.floor(camera),0);
 for(const c of coins)if(!c.got&&c.x>camera-20&&c.x<camera+W+20){const width=5+Math.abs(Math.cos(elapsed*4+c.x))*8,y=c.y+Math.sin(elapsed*3+c.x)*2;rect(ctx,c.x-width/2-2,y-10,width+4,20,'#9f7937');rect(ctx,c.x-width/2,y-12,width,22,'#f6cf68');rect(ctx,c.x-width/2+2,y-9,Math.max(2,width-4),15,'#e3af45');rect(ctx,c.x-1,y-6,2,9,'#ffe7a0');}
 for(const e of enemies)if(e.alive&&e.x>camera-80&&e.x<camera+W+80)enemy(e);
 if(player.inv<=0||Math.floor(player.inv*12)%2===0){rect(ctx,player.x+3,player.y+player.h-1,player.w-6,4,'#48584c44');dog(ctx,player.x+player.w/2,player.y+player.h-4,selected==='gui'?1.3:1.6,selected,player.dir,player.vx?player.frame:0,player.attack>0);if(player.attack>.08){const x=player.x+player.w/2+player.dir*(selected==='gui'?50:67);text(ctx,'✦',x,player.y+20,24,'#fff0ba','center');}}
 for(const p of particles)rect(ctx,p.x,p.y,4,4,p.color);ctx.restore();
 if(elapsed<5&&mode==='playing'){rect(ctx,W/2-190,434,380,26,'#344b42d9');text(ctx,'向右探索 →  金幣在等你，遇到對手按 J 揮掌！',W/2,451,12,'#f2e6bc','center');}
}
function tick(t){const dt=Math.min((t-last)/1000||0,1/30);last=t;if(mode==='playing')update(dt);render();requestAnimationFrame(tick);}
function setAction(action,down){if(down&&!keys[action]){if(action==='jump')jumpQueued=true;if(action==='attack')attackQueued=true;}keys[action]=down;}
const bindings={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'jump',w:'jump',W:'jump',' ':'jump',j:'attack',J:'attack',x:'attack',X:'attack'};
document.addEventListener('keydown',e=>{if(bindings[e.key]&&mode==='playing'){e.preventDefault();if(!e.repeat)setAction(bindings[e.key],true);}if((e.key==='p'||e.key==='P'||e.key==='Escape')&&!e.repeat&&['playing','paused'].includes(mode))togglePause();});
document.addEventListener('keyup',e=>{if(bindings[e.key])setAction(bindings[e.key],false);});
document.querySelectorAll('[data-action]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();if(mode!=='playing')return;b.setPointerCapture(e.pointerId);setAction(b.dataset.action,true);b.classList.add('pressed');});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>{setAction(b.dataset.action,false);b.classList.remove('pressed');});});
function togglePause(){if(!['playing','paused'].includes(mode))return;mode=mode==='playing'?'paused':'playing';clearInput();$('paused').hidden=mode!=='paused';$('pause').textContent=mode==='paused'?'繼續 ▶':'暫停 ⏸';}
function selectScreen(){mode='select';player=null;camera=0;clearInput();$('selection').hidden=false;$('result').hidden=true;$('paused').hidden=true;$('hud').hidden=true;$('pause').disabled=true;$('pause').textContent='暫停 ⏸';$('status').textContent='選一隻柴柴，一起出發';}
document.querySelectorAll('[data-dog]').forEach(b=>b.onclick=()=>{selected=b.dataset.dog;document.querySelectorAll('[data-dog]').forEach(o=>{o.classList.toggle('selected',o===b);o.setAttribute('aria-pressed',String(o===b));});});
$('start').onclick=reset;$('again').onclick=reset;$('change').onclick=selectScreen;$('restart').onclick=selectScreen;$('pause').onclick=togglePause;$('resume').onclick=togglePause;
$('sound').onclick=()=>{sound=!sound;$('sound').textContent='音效 '+(sound?'ON':'OFF');$('sound').setAttribute('aria-label',sound?'關閉音效':'開啟音效');tone(660);};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.querySelector('.game-shell').requestFullscreen)await document.querySelector('.game-shell').requestFullscreen();}catch{$('status').textContent='此瀏覽器不支援全螢幕，可將手機橫放遊玩';}};
window.addEventListener('blur',()=>{clearInput();if(mode==='playing')togglePause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')togglePause();});
function resize(){const bounds=canvas.getBoundingClientRect();W=Math.max(320,Math.round(bounds.width/bounds.height*H));canvas.width=W;canvas.height=H;}
window.addEventListener('resize',resize);document.addEventListener('fullscreenchange',resize);
if(typeof ResizeObserver!=='undefined')new ResizeObserver(resize).observe($('stage'));
resize();previewDogs();requestAnimationFrame(tick);
})();
