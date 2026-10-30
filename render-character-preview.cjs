// Render the game's exact pixel drawing commands for a larger art review.
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/game.js','utf8');
const start=source.indexOf('function pixelShape('),end=source.indexOf('function previewDogs()');
const shapes=[],labels=[];let matrix=[1,1,0,0],stack=[];
const c={fillStyle:'#000',save(){stack.push([...matrix]);},restore(){matrix=stack.pop();},translate(x,y){matrix[2]+=x*matrix[0];matrix[3]+=y*matrix[1];},scale(x,y){matrix[0]*=x;matrix[1]*=y;},fillRect(x,y,w,h){const x1=x*matrix[0]+matrix[2],x2=(x+w)*matrix[0]+matrix[2],y1=y*matrix[1]+matrix[3],y2=(y+h)*matrix[1]+matrix[3];shapes.push({x:Math.round(Math.min(x1,x2)),y:Math.round(Math.min(y1,y2)),w:Math.round(Math.max(x1,x2))-Math.round(Math.min(x1,x2)),h:Math.round(Math.max(y1,y2))-Math.round(Math.min(y1,y2)),color:this.fillStyle});}};
const scope={c};vm.createContext(scope);
vm.runInContext('const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};'+source.slice(start,end)+';globalThis.draw=paintDog;',scope);
for(const [row,type] of ['gui','miso'].entries()){
 const y=235+row*255,scale=type==='gui'?4.3:4.9;
 for(const [i,pose] of ['PORTRAIT','IDLE','WALK','PAW ATTACK'].entries()){
  const x=175+i*280;scope.draw(c,x,y,scale,type,1,pose==='WALK'?1.3:0,pose==='PAW ATTACK',pose==='PORTRAIT');
  labels.push({x:x-90,y:y+15,text:(type==='gui'?'GUIGUI':'MISO')+' / '+pose});
 }
}
fs.writeFileSync(__dirname+'/character-preview.json',JSON.stringify({width:1200,height:540,shapes,labels}));
const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
fs.writeFileSync(__dirname+'/character-preview.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="540" shape-rendering="crispEdges"><rect width="1200" height="540" fill="#f6f1e5"/><text x="35" y="35" font-family="monospace" font-size="18" fill="#554a3b">SHIBA DAYS / CHARACTER REDRAW</text>${shapes.map(r=>`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.color}"/>`).join('')}${labels.map(l=>`<text x="${l.x}" y="${l.y+13}" font-family="monospace" font-size="12" fill="#77634b">${escape(l.text)}</text>`).join('')}</svg>`);
console.log('Character review exported from game.js');

