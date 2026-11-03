"use strict";
const Yard = (() => {
  const width = 1780, floor = 345;
  const ledges = [[295,505,275],[565,755,208],[1025,1215,208],[1275,1485,275]];
  const stats = {pilot:[135,155,235,10,.26], crawler:[48,46,142,7,.95],
    sentry:[320,0,238,12,.82], reactor:[540,0,120,8,1.1]};
  function unit(kind, team, x) {
    const [max,speed,range,damage,rate] = stats[kind];
    return {kind,team,x,y:floor,hp:max,max,speed,range,damage,rate,cd:0,vy:0,
      jumps:0,dir:team===0?1:-1,respawn:0,flash:0};
  }
  function wave(m) {
    for (const team of [0,1]) for (let i=0;i<3;i++) {
      const offset=120+i*28;
      m.units.push(unit("crawler",team,team===0?offset:width-offset));
    }
    m.wave++; m.nextWave=12;
  }
  function create() {
    const units=[];
    for(const team of [0,1]) {
      const mirror=x=>team===0?x:width-x;
      for(const [kind,x] of [["reactor",65],["sentry",365],["pilot",165]]) units.push(unit(kind,team,mirror(x)));
    }
    const m={units,player:units[2],shots:[],time:0,wave:0,nextWave:0,pulse:0,bridge:0,
      scrap:0,rank:0,winner:null,fx:[],note:"",notice:0};
    wave(m);return m;
  }
  const height=u=>({reactor:70,sentry:48,pilot:33,crawler:19})[u.kind];
  const radius=u=>u.kind==="reactor"?23:u.kind==="sentry"?18:12;
  const middle=u=>u.y-height(u)/2;
  function hit(m,u,damage) {
    if(u.hp<=0)return;
    u.hp=Math.max(0,u.hp-damage);u.flash=.12;
    if(!u.hp){
      m.fx.push({x:u.x,y:middle(u),life:.36,size:34});
      if(u.team===1)m.scrap+=({crawler:2,pilot:8,sentry:15,reactor:0})[u.kind];
      if(u.kind==="pilot")u.respawn=5;
      if(u.kind==="reactor")m.winner=1-u.team;
    }
  }
  function fire(m,u,x,y) {
    if(u.cd>0)return;
    const dx=x-u.x,dy=y-middle(u);
    const len=Math.hypot(dx,dy)||1;
    m.shots.push({x:u.x,y:middle(u),vx:dx/len*600,vy:dy/len*600,team:u.team,damage:u.damage,left:u.range+24});
    u.cd=u.rate;
  }
  function fireAtUnit(m,u,target) {
    fire(m,u,target ? target.x : u.x+u.dir,target ? middle(target) : middle(u));
  }
  function sentryStep(m,u,dt) {
    if(u.aim){
      u.aim.remaining-=dt;
      if(u.aim.remaining<=0){
        fire(m,u,u.aim.x,u.aim.y);
        u.aim=null;
        u.cd-=sentryWindup;
      }
      return;
    }
    if(u.cd>0)return;
    const target=targetFor(m,u,u.range);
    if(target){
      u.dir=Math.sign(target.x-u.x)||u.dir;
      u.aim={x:target.x,y:middle(target),remaining:sentryWindup};
    }
  }
  const sentryWindup=.42;
  function platforms(m){return m.bridge>0?[...ledges,[755,1025,208]]:ledges;}
  function targetFor(m,u,range,front=false){
    let best=null,dist=range;
    for(const other of m.units){
      if(other.team===u.team||other.hp<=0||(front&&(other.x-u.x)*u.dir<0))continue;
      const d=Math.hypot(other.x-u.x,middle(other)-middle(u));
      if(d<=dist){best=other;dist=d;}
    }
    return best;
  }
  function note(m,message){m.note=message;m.notice=2;}
  function playerStep(m,u,k,dt){
    const axis=Number(!!k.right)-Number(!!k.left);
    if(axis)u.dir=axis;
    u.x=Math.max(22,Math.min(width-22,u.x+axis*u.speed*dt));
    if(k.jump&&u.jumps<2){u.vy=-360;u.jumps++;}
    const old=u.y;u.vy+=920*dt;u.y+=u.vy*dt;
    for(const [a,b,y] of [...platforms(m),[0,width,floor]]){
      if(u.x>=a&&u.x<=b&&old<=y&&u.y>=y){u.y=y;u.vy=0;u.jumps=0;break;}
    }
    if(k.fire)fireAtUnit(m,u,targetFor(m,u,u.range,true));
    if(k.pulse&&m.pulse<=0){
      m.fx.push({x:u.x,y:middle(u),life:.36,size:128});
      for(const other of m.units)if(other.team!==u.team&&Math.hypot(other.x-u.x,middle(other)-middle(u))<=128)hit(m,other,36);
      m.pulse=4;
    }
    if(k.crane){
      if(Math.abs(u.x-715)<65&&Math.abs(u.y-208)<35){m.bridge=10;note(m,"CROSSING OPEN · 10s");}
      else note(m,"Reach the upper crane switch");
    }
    if(k.buy){
      if(m.rank>=3)note(m,"Rivet gun fully upgraded");
      else if(m.scrap>=12){m.scrap-=12;m.rank++;u.damage+=4;note(m,"Rivet gun upgraded");}
      else note(m,"Upgrade costs 12 scrap");
    }
  }
  function step(m,k,dt){
    if(m.winner!==null)return;
    m.time+=dt;m.nextWave-=dt;if(m.nextWave<=0)wave(m);
    for(const key of ["pulse","bridge","notice"])m[key]=Math.max(0,m[key]-dt);
    for(const u of m.units){
      u.cd-=dt;u.flash-=dt;
      if(!u.hp){
        if(u.kind==="pilot"&&(u.respawn-=dt)<=0){
          u.x=u.team===0?165:width-165;u.y=floor;u.hp=u.max;u.vy=0;u.jumps=0;
        }continue;
      }
      if(u===m.player){playerStep(m,u,k,dt);continue;}
      if(u.kind==="sentry"){sentryStep(m,u,dt);continue;}
      const target=targetFor(m,u,u.range);
      if(target){u.dir=Math.sign(target.x-u.x)||u.dir;fireAtUnit(m,u,target);}
      else {u.dir=u.team===0?1:-1;u.x=Math.max(20,Math.min(width-20,u.x+u.dir*u.speed*dt));}
    }
    for(const s of m.shots){
      s.x+=s.vx*dt;s.y+=s.vy*dt;s.left-=600*dt;
      const victim=m.units.find(u=>u.team!==s.team&&u.hp>0&&Math.abs(u.x-s.x)<=radius(u)&&s.y>=u.y-height(u)&&s.y<=u.y);
      if(victim){hit(m,victim,s.damage);s.left=0;}
    }
    m.shots=m.shots.filter(s=>s.left>0);
    m.units=m.units.filter(u=>u.hp>0||u.kind!=="crawler");
    for(const f of m.fx)f.life-=dt;m.fx=m.fx.filter(f=>f.life>0);
  }
  return {width,floor,height,create,step,platforms};
})();
if(typeof module!=="undefined")module.exports=Yard;
