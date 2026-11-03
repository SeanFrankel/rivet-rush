"use strict";
const canvas=document.querySelector("canvas"), ctx=canvas.getContext("2d");
const el=id=>document.getElementById(id);
const palette=["#64e4ce","#ff8864"], dark=["#285b62","#784452"];
let match=Yard.create(), mode="ready", camera=0, last=0, debt=0;
const held=new Set(),pressed=new Set();
function box(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function line(x,y,a,b,color,w=2){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(a,b);ctx.stroke();}
function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,2*Math.PI);ctx.fill();}
function poly(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
function label(t,x,y,color="#e6e3d8",size=10){ctx.fillStyle=color;ctx.font="bold "+size+"px monospace";ctx.fillText(t,x,y);}
// Integer-seed adaptation of d3-random's randomLcg. See THIRD_PARTY.md.
let seed=219;
function random(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;}
const towers=Array.from({length:70},(_,i)=>({x:i*38,w:16+random()*52,h:20+random()*100}));
const stars=Array.from({length:120},()=>[random()*1200,random()*190,1+random()*1.4]);
function backdrop(){
  const sky=ctx.createLinearGradient(0,0,0,350);sky.addColorStop(0,"#17263e");sky.addColorStop(.65,"#595570");sky.addColorStop(1,"#cb876d");box(0,0,960,440,sky);
  for(const [x,y,r] of stars)box(x-camera*.08,y,r,r,"#cab4ad");
  const sx=714-camera*.09;circle(sx,104,56,"#eab27e");
  for(let i=0;i<4;i++)box(sx-58,128+i*6,118,2+i,"#6f6174");
  for(let i=0;i<2;i++){
    const offset=camera*(.13+i*.12);
    for(const t of towers){const x=t.x-offset;if(x+t.w<0||x>960)continue;
      const bottom=277+i*39,y=bottom-t.h*(.63+i*.27);
      box(x,y,t.w,bottom-y,i?"#354052":"#55556b");
      line(x+4,y,x+4,y-13,"#4d4d63");box(x+6,y+7,7,2,"#987872");
    }
  }
  for(let i=0;i<5;i++){
    const x=i*430-camera*.43-80;
    line(x,305,x+35,116,"#31394b",8);line(x+68,305,x+35,116,"#31394b",7);
    line(x-33,149,x+167,86,"#31394b",8);line(x+35,116,x+61,68,"#31394b",4);
    line(x+61,68,x+167,86,"#31394b",2);line(x+158,91,x+158,161,"#404151",2);
    box(x+151,162,15,5,"#454455");
  }
}
function deck(x,y,w,ground=false){
  box(x,y,w,ground?100:15,"#192a36");box(x,y,w,5,"#95939a");
  box(x,y+5,w,3,"#4b6170");
  for(let i=0;i<w;i+=42){
    box(x+i+3,y+1,13,3,"#d4ab6b");
    if(ground){line(x+i,y+14,x+i+35,y+51,"#30434e",5);box(x+i,y+55,35,5,"#334954");}
  }
}
function drawUnit(u){
  if(!u.hp)return;
  const c=u.flash>0?"#fff4cd":palette[u.team],d=dark[u.team];
  ctx.save();ctx.translate(Math.round(u.x),Math.round(u.y));ctx.scale(u.dir,1);
  if(u.kind==="pilot"){
    const stride=Math.sin(match.time*12+u.x*.05)*3;
    box(-11,-28,9,20,"#1a2532");box(-10,-24,6,8,c);
    box(-7,-12,6,11+stride*.3,"#29384b");box(2,-12,7,11-stride*.3,"#29384b");
    poly([[-8,-27],[5,-29],[10,-24],[6,-11],[-5,-11]],d);
    box(-6,-36,15,11,"#eac39c");box(-8,-36,16,4,c);box(1,-32,10,4,"#213342");
    box(-2,-24,10,5,c);box(5,-21,17,6,"#b4b6b1");box(17,-21,6,3,c);
  }else if(u.kind==="crawler"){
    box(-14,-8,29,8,"#15242c");for(const x of [-9,0,9])circle(x,-4,3,"#6d7780");
    poly([[-14,-8],[-9,-18],[5,-18],[14,-10],[12,-6]],d);
    box(-6,-16,13,4,c);box(7,-13,13,3,"#d7c9ae");
  }else if(u.kind==="sentry"){
    if(u.aim){
      const dx=(u.aim.x-u.x)*u.dir,dy=u.aim.y-(u.y-Yard.height(u)/2);
      const length=Math.hypot(dx,dy)||1;
      ctx.save();ctx.setLineDash([6,6]);
      line(0,-24,dx/length*(u.range+24),-24+dy/length*(u.range+24),"#ffe2aa",2);
      ctx.restore();
      circle(0,-48,4,"#fff1c9");
    }
    poly([[-24,0],[-13,-13],[-9,-43],[10,-43],[14,-13],[23,0]],"#344552");
    box(-13,-46,23,17,d);box(-8,-43,16,4,c);box(4,-36,26,8,"#bbc1bc");
    box(-13,-14,25,5,c);
  }else{
    box(-29,-9,58,9,"#1c2d38");poly([[-22,-9],[-18,-66],[-8,-78],[12,-78],[23,-64],[23,-9]],"#243745");
    box(-16,-64,33,51,d);for(let y=-59;y<-20;y+=9)box(-10,y,20,5,c);
    box(-21,-67,42,6,"#a5b1ad");box(-21,-15,42,5,"#879598");
  }
  ctx.restore();
  const y=u.y-Yard.height(u)-12, w=u.kind==="reactor"?52:28;
  box(u.x-w/2,y,w,3,"#172b37");box(u.x-w/2,y,w*u.hp/u.max,3,c);
  if(u===match.player)label("YOU",u.x-9,y-4,c,9);
}
function draw(){
  camera=Math.max(0,Math.min(Yard.width-960,match.player.x-425));
  backdrop();ctx.save();ctx.translate(-camera,0);
  deck(0,Yard.floor,Yard.width,true);
  for(const [a,b,y] of Yard.platforms(match))deck(a,y,b-a);
  box(710,178,9,30,"#253a47");box(704,173,23,13,"#eebb68");label("E",712,183,"#19252d");
  label(match.bridge>0?"CROSSING OPEN":"CRANE 07",670,157,"#ffe1ac");
  label("KILN  //  07",805,403,"#667780",21);
  for(const u of match.units)drawUnit(u);
  for(const s of match.shots)line(s.x,s.y,s.x-s.vx*.017,s.y-s.vy*.017,palette[s.team],3);
  for(const f of match.fx){ctx.globalAlpha=f.life/.36;ctx.strokeStyle="#ffce81";ctx.lineWidth=4;ctx.beginPath();ctx.arc(f.x,f.y,(1-f.life/.36)*f.size+2,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;
  ctx.restore();
  const cores=match.units.filter(u=>u.kind==="reactor");
  for(const core of cores){
    const x=core.team?752:16;box(x,14,192,36,"#162735");label(core.team?"CINDER REACTOR":"TORCH REACTOR",x+8,29,palette[core.team]);box(x+8,35,176,5,dark[core.team]);box(x+8,35,176*core.hp/core.max,5,palette[core.team]);
  }
  box(353,15,254,23,"#172935");label("YARD",362,30);line(398,26,594,26,"#70828a");
  for(const u of match.units)if(u.hp>0)box(398+u.x/Yard.width*196,23,u===match.player?5:3,u.kind==="crawler"?4:7,palette[u.team]);
  el("pilot").textContent="HP "+Math.ceil(match.player.hp)+" / 135   ·   SCRAP "+match.scrap+"   ·   GUN "+(match.rank+1);
  el("status").textContent="WAVE "+match.wave+"   /   PULSE "+(match.pulse>0?Math.ceil(match.pulse)+"s":"READY");
  if(match.notice>0||match.player.hp===0){box(295,365,370,30,"#172935");ctx.textAlign="center";label(match.player.hp===0?"REDEPLOY IN "+Math.ceil(match.player.respawn):match.note,480,385,"#ffd696",14);ctx.textAlign="left";}
}
function overlay(state,title,brief,button){
  mode=state;held.clear();pressed.clear();el("headline").textContent=title;el("brief").textContent=brief;
  el("start").textContent=button;el("panel").hidden=false;el("start").focus();
}
function pause(){if(mode==="play")overlay("pause","Shift paused","The yard is holding position.","RESUME MATCH →");}
function launch(){
  if(mode!=="pause")match=Yard.create();
  mode="play";debt=0;last=0;el("panel").hidden=true;
}
el("start").onclick=launch;
const keys=["KeyA","KeyD","KeyW","KeyJ","KeyK","KeyE","Digit1","Space","ArrowLeft","ArrowRight","ArrowUp"];
window.addEventListener("keydown",e=>{
  if(e.code==="Escape"&&!e.repeat){if(mode==="pause")launch();else pause();return;}
  if(mode!=="play"||!keys.includes(e.code))return;
  e.preventDefault();if(!held.has(e.code))pressed.add(e.code);held.add(e.code);
});
window.addEventListener("keyup",e=>held.delete(e.code));window.addEventListener("blur",pause);
function frame(now){
  if(mode==="play"){
    debt+=last?Math.min(.1,(now-last)/1000):0;
    while(debt>=1/60&&mode==="play"){
      Yard.step(match,{left:held.has("KeyA")||held.has("ArrowLeft"),right:held.has("KeyD")||held.has("ArrowRight"),
        jump:["KeyW","Space","ArrowUp"].some(k=>pressed.has(k)),fire:held.has("KeyJ"),pulse:pressed.has("KeyK"),crane:pressed.has("KeyE"),buy:pressed.has("Digit1")},1/60);
      pressed.clear();debt-=1/60;
      if(match.winner!==null)overlay("end",match.winner===0?"Yard secured":"Reactor lost","Shift complete after "+match.wave+" crawler waves.","PLAY AGAIN →");
    }
  }
  last=now;draw();requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
