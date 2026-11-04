"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const Y = require("../match"), W = require("../protocol"), R = require("../replay");
const idle = {0:{},1:{},2:{},3:{}};
function step(m,n=1,input=idle) { for(let i=0;i<n;i++) Y.stepSeats(m,input); }
function isolated(mapId) {
  const m=Y.create({mapId,teamSize:2}); m.units=m.units.filter(u=>u.kind==="pilot"); m.nextWave=999;
  for(const p of m.units) p.x=p.team?1650:130;
  return m;
}
test("three unique mirrored layouts preserve base and wave routes",()=>{
  assert.equal(Object.keys(Y.maps).length,3);
  const layouts=new Set();
  for(const mapId of Object.keys(Y.maps)) {
    const m=Y.create({mapId}); layouts.add(JSON.stringify(Y.platforms(m)));
    for(const [a,b,y] of Y.platforms(m)) {
      assert.ok(a<b && a>=0 && b<=Y.width && y<Y.floor);
      assert.ok(Y.platforms(m).some(([c,d,z])=>c===Y.width-b && d===Y.width-a && z===y), mapId+" mirrored deck");
    }
    assert.deepEqual(m.units.filter(u=>u.kind==="sentry").map(u=>u.x),[365,1415]);
    assert.equal(m.units.filter(u=>u.kind==="crawler").length,6);
  }
  assert.equal(layouts.size,3);
});
test("relay needs four uncontested seconds, freezes under contest and awards a temporary crew buff",()=>{
  const m=isolated("skyway"),p=m.player,e=m.units.find(u=>u.seat===1);
  m.time=30; m.tick=1800; Object.assign(p,{x:870,y:205,grounded:true});
  step(m,120); assert.ok(m.relay.progress>1.99 && m.relay.progress<2.01);
  Object.assign(e,{x:920,y:205,grounded:true}); const before=m.relay.progress;
  step(m,60); assert.equal(m.relay.progress,before); assert.equal(m.contracts[0],0);
  e.x=1600; step(m,120); assert.equal(m.contracts[0],1); assert.ok(m.surgeUntil[0]>m.time+19);
  assert.equal(m.surgeUntil[1],0); assert.ok(m.relay.next>m.time+49);
  const view=Y.follow(W.unpack(JSON.parse(JSON.stringify(W.pack(m))),Y.stats,Y.kits));
  const predicted={...view.player,cooldowns:[...view.player.cooldowns]};
  Y.predictPilot(view,predicted,{right:true}); step(m,1,{...idle,0:{right:true}});
  assert.ok(Math.abs(predicted.x-p.x)<.011);
  p.x=100; p.y=345; p.vx=0; p.grounded=true;
  step(m,30,{...idle,0:{right:true}}); assert.ok(p.vx>Y.kits[p.kit].speed*1.19);
  m.time=m.surgeUntil[0]+1; step(m,30,{...idle,0:{right:true}}); assert.ok(p.vx<=Y.kits[p.kit].speed+.01);
});
test("relay progress decays when abandoned and changes ownership without inheriting progress",()=>{
  const m=isolated("skyway"),p=m.player,e=m.units.find(u=>u.seat===1); m.time=30;
  Object.assign(p,{x:890,y:205,grounded:true}); step(m,120); p.x=100; step(m,60);
  assert.ok(Math.abs(m.relay.progress-1)<.01);
  Object.assign(e,{x:890,y:205,grounded:true}); step(m);
  assert.equal(m.relay.team,1); assert.ok(m.relay.progress<.02);
});
test("twin camps respawn independently and either crew can steal a supply cache",()=>{
  const m=isolated("foundry"); m.time=32; step(m);
  const guards=m.units.filter(u=>u.kind==="keeper"); assert.equal(guards.length,2);
  assert.deepEqual(guards.map(u=>[u.x,u.y,u.hp]),[[620,255,150],[1160,255,150]]);
  const g=guards[0];
  m.shots.push({id:++m.serial,source:m.player.id,team:0,x:g.x-15,y:g.y-20,vx:600,vy:0,damage:999,left:50,originY:255});
  step(m); assert.ok(m.drops.some(d=>d.type==="supply"));
  assert.ok(m.camps[0].next>m.time+54); assert.equal(m.camps[1].next,null);
  const thief=m.units.find(u=>u.seat===1),friend=m.units.find(u=>u.seat===3);
  Object.assign(thief,{x:620,y:255,hp:60,grounded:true}); friend.hp=50; friend.x=1450;
  step(m); assert.equal(m.contracts[1],1); assert.equal(thief.scrap,8); assert.equal(friend.scrap,8);
  assert.equal(thief.hp,100); assert.equal(friend.hp,90); assert.equal(m.convoy[1],false);
  thief.x=1600; m.time=m.camps[0].next; step(m);
  assert.equal(m.units.filter(u=>u.kind==="keeper" && u.hp).length,2);
});
test("launch pads require a jump on the floor and are identical for either crew",()=>{
  for(const x of [400,1380]) for(const kit of Object.keys(Y.kits)) {
    const m=Y.createTraining(kit,"skyway"); m.player.x=x; step(m,1,{...idle,0:{jump:true}});
    assert.ok(m.player.vy < -590,kit); assert.equal(m.player.jumps,1);
    const other=Y.createTraining(kit,"foundry"); other.player.x=x; step(other,1,{...idle,0:{jump:true}});
    assert.ok(other.player.vy>-500);
  }
});
test("every map survives snapshot roundtrip and reproduces objective state in a replay",()=>{
  for(const mapId of Object.keys(Y.maps)) {
    const m=Y.create({mapId,teamSize:2}),rec=R.recorder(m);
    for(let i=0;i<4200;i++){const input={0:{right:i%500<200,fire:true,pulse:i%100===0}}; rec.capture(m.tick,input);Y.stepSeats(m,input);}
    const packet=W.unpack(JSON.parse(JSON.stringify(W.pack(m))),Y.stats,Y.kits);
    assert.equal(packet.mapId,mapId); assert.deepEqual(packet.camps,m.camps); assert.deepEqual(packet.relay,m.relay);
    const replay=R.load(rec.export(m)); while(replay.advance()){} assert.equal(replay.verified(),true,mapId);
    assert.throws(()=>R.load({...rec.export(m),mapId:"missing"}),/Invalid/);
  }
});

test("every hero can traverse all six checkpoints from either side using shared movement",()=>{
  for(const mapId of Object.keys(Y.maps)) for(const kit of Object.keys(Y.kits)) for(const team of [0,1]) {
    const m=Y.createTraining(kit,mapId),p=m.player; m.units=[p]; p.x=team?1615:165;
    for(const [gx,y] of Y.maps[mapId].gates) {
      const x=team?Y.width-gx:gx; let arrived=false;
      for(let t=0;t<900;t++) {
        const dx=x-p.x;
        if(Math.abs(dx)<18 && Math.abs(p.y-y)<2 && p.grounded){arrived=true;break;}
        step(m,1,{0:{left:dx < -7,right:dx > 7,crane:true,
          jump:Math.abs(dx)<40 && p.y>y+2 && (p.grounded || (p.jumps===1 && p.vy>-30)),
          down:Math.abs(dx)<30 && p.y<y-2 && p.grounded}});
      }
      assert.ok(arrived,`${mapId}/${kit}/side${team}: ${x},${y}; ended ${p.x},${p.y}`);
    }
  }
});

test("a rotating bot reaches and claims each new objective against idle defenders",()=>{
  for(const mapId of ["skyway","foundry"]) {
    const m=isolated(mapId); m.time=32; m.tick=1920;
    for(let i=0;i<3600 && !m.contracts[0];i++) Y.stepSeats(m,{1:{},2:{},3:{}});
    assert.equal(m.contracts[0],1,mapId);
  }
});
