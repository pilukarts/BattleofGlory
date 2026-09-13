'use strict';

const NS = 'http://www.w3.org/2000/svg';
const W = 960, H = 640;
const cadets = [
  {id:'inferno',name:'INFERNO',icon:'🔥',color:'#ff604b',power:'Nova explosiva',speed:250,damage:2},
  {id:'glacier',name:'GLACIER',icon:'❄️',color:'#65ddff',power:'Congelación total',speed:220,damage:2},
  {id:'viper',name:'VIPER',icon:'🐍',color:'#6eff7d',power:'Ráfaga venenosa',speed:285,damage:1},
  {id:'celestial',name:'CELESTIAL',icon:'⭐',color:'#c27aff',power:'Pulso cósmico',speed:235,damage:3}
];

const dom = Object.fromEntries(['menu','game','game-over','cadet-grid','start-btn','again-btn','arena','entities','stars','message','score','wave','health','special','hud-cadet','final-score','final-wave','result-title','sound-btn'].map(id => [id.replaceAll('-','_'), document.getElementById(id)]));
const keys = new Set();
let selected = cadets[0], player, enemies=[], bullets=[], particles=[];
let playing=false, score=0, wave=1, specialReady=true, last=0, nextWaveTimer=0, muted=false, audio;

function svg(tag, attrs={}) {
  const node = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k,v]) => node.setAttribute(k,v));
  return node;
}

function setupMenu(){
  cadets.forEach((c,i)=>{
    const button=document.createElement('button');
    button.className='cadet'+(i===0?' selected':'');
    button.style.setProperty('--cadet',c.color);
    button.innerHTML=`<span class="cadet-icon">${c.icon}</span><strong>${c.name}</strong><small>${c.power}</small>`;
    button.onclick=()=>{
      selected=c;
      document.querySelectorAll('.cadet').forEach(x=>x.classList.remove('selected'));
      button.classList.add('selected');
      tone(420, .05);
    };
    dom.cadet_grid.appendChild(button);
  });
}

function makeStars(){
  for(let i=0;i<65;i++){
    dom.stars.appendChild(svg('circle',{cx:Math.random()*W,cy:Math.random()*H,r:Math.random()*1.8+.3,fill:'#fff',opacity:Math.random()*.55+.15}));
  }
}

function characterNode(c){
  const g=svg('g',{filter:'url(#glow)'});
  g.append(svg('circle',{r:24,fill:c.color,opacity:.18,stroke:c.color,'stroke-width':2}));
  g.append(svg('path',{d:'M0 -23 L18 17 L0 10 L-18 17 Z',fill:c.color,stroke:'#fff','stroke-width':2}));
  g.append(svg('circle',{cy:-4,r:5,fill:'#fff'}));
  return g;
}

function enemyNode(){
  const g=svg('g',{filter:'url(#glow)'});
  g.append(svg('circle',{r:19,fill:'#ff315f',opacity:.25,stroke:'#ff5475','stroke-width':2}));
  g.append(svg('path',{d:'M-15 -10 L0 -20 L15 -10 L12 15 L0 9 L-12 15 Z',fill:'#7c1738'}));
  g.append(svg('circle',{cx:-6,cy:-5,r:3,fill:'#fff'}));
  g.append(svg('circle',{cx:6,cy:-5,r:3,fill:'#fff'}));
  return g;
}

function position(obj){ obj.node.setAttribute('transform',`translate(${obj.x} ${obj.y}) rotate(${obj.angle||0})`); }

function startGame(){
  initAudio();
  dom.menu.classList.add('hidden');
  dom.game_over.classList.add('hidden');
  dom.game.classList.remove('hidden');
  dom.entities.replaceChildren();
  enemies=[]; bullets=[]; particles=[]; score=0; wave=1; specialReady=true;
  player={x:W/2,y:H-90,hp:100,dirX:0,dirY:-1,node:characterNode(selected),shotAt:0};
  dom.entities.append(player.node); position(player);
  playing=true; last=performance.now(); nextWaveTimer=0;
  dom.hud_cadet.textContent=selected.name;
  updateHud();
  announce('OLEADA 1');
  spawnWave();
  requestAnimationFrame(loop);
}

function spawnWave(){
  const count=3+wave*2;
  for(let i=0;i<count;i++){
    const edge=Math.floor(Math.random()*3);
    const e={x:edge===0?30:edge===1?W-30:60+Math.random()*(W-120),y:edge===2?35:50+Math.random()*260,hp:1+Math.floor(wave/3),speed:48+wave*6,node:enemyNode(),hitAt:0};
    dom.entities.append(e.node); position(e); enemies.push(e);
  }
}

function fire(){
  if(!playing || performance.now()-player.shotAt<180)return;
  player.shotAt=performance.now();
  const b={x:player.x+player.dirX*28,y:player.y+player.dirY*28,vx:player.dirX*560,vy:player.dirY*560,damage:selected.damage,node:svg('circle',{r:6,fill:selected.color,filter:'url(#glow)'})};
  dom.entities.append(b.node); bullets.push(b); tone(650,.035);
}

function special(){
  if(!playing || !specialReady)return;
  specialReady=false; dom.special.textContent='CARGANDO';
  tone(180,.28);
  enemies.forEach(e=>{
    const d=Math.hypot(e.x-player.x,e.y-player.y);
    const range=selected.id==='celestial'?360:270;
    if(d<range) e.hp-=selected.id==='inferno'?4:selected.id==='viper'?2:3;
    if(selected.id==='glacier' && d<range)e.speed*=.35;
  });
  const ring=svg('circle',{cx:player.x,cy:player.y,r:10,fill:'none',stroke:selected.color,'stroke-width':10,opacity:.9});
  dom.entities.prepend(ring);
  ring.animate([{r:10,opacity:1},{r:300,opacity:0}],{duration:650,easing:'ease-out'}).onfinish=()=>ring.remove();
  setTimeout(()=>{specialReady=true;dom.special.textContent='LISTO'},7000);
}

function loop(now){
  if(!playing)return;
  const dt=Math.min((now-last)/1000,.035); last=now;
  updatePlayer(dt); updateBullets(dt); updateEnemies(dt,now); cleanup();
  if(enemies.length===0){
    nextWaveTimer+=dt;
    if(nextWaveTimer>1.4){wave++;nextWaveTimer=0;announce('OLEADA '+wave);spawnWave();}
  }
  updateHud();
  requestAnimationFrame(loop);
}

function updatePlayer(dt){
  let dx=(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0);
  let dy=(keys.has('ArrowDown')?1:0)-(keys.has('ArrowUp')?1:0);
  if(dx||dy){const l=Math.hypot(dx,dy);dx/=l;dy/=l;player.dirX=dx;player.dirY=dy;player.angle=Math.atan2(dy,dx)*180/Math.PI+90}
  player.x=Math.max(28,Math.min(W-28,player.x+dx*selected.speed*dt));
  player.y=Math.max(28,Math.min(H-28,player.y+dy*selected.speed*dt));
  if(keys.has('Space'))fire();
  position(player);
}

function updateBullets(dt){
  bullets.forEach(b=>{
    b.x+=b.vx*dt;b.y+=b.vy*dt;
    b.node.setAttribute('cx',b.x);b.node.setAttribute('cy',b.y);
    enemies.forEach(e=>{
      if(!b.dead && Math.hypot(e.x-b.x,e.y-b.y)<25){e.hp-=b.damage;b.dead=true;score+=10}
    });
    if(b.x<0||b.x>W||b.y<0||b.y>H)b.dead=true;
  });
}

function updateEnemies(dt,now){
  enemies.forEach(e=>{
    const dx=player.x-e.x,dy=player.y-e.y,d=Math.max(1,Math.hypot(dx,dy));
    e.x+=dx/d*e.speed*dt;e.y+=dy/d*e.speed*dt;e.angle=Math.atan2(dy,dx)*180/Math.PI+90;position(e);
    if(d<45 && now-e.hitAt>700){e.hitAt=now;player.hp-=10;dom.arena.animate([{filter:'brightness(2)'},{filter:'none'}],{duration:180});tone(110,.08)}
    if(e.hp<=0){e.dead=true;score+=50;burst(e.x,e.y,selected.color)}
  });
  if(player.hp<=0)endGame();
}

function burst(x,y,color){
  for(let i=0;i<7;i++){
    const p=svg('circle',{cx:x,cy:y,r:3,fill:color});
    dom.entities.append(p);
    const a=Math.random()*Math.PI*2,d=20+Math.random()*50;
    p.animate([{transform:'translate(0 0)',opacity:1},{transform:`translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px)`,opacity:0}],{duration:450}).onfinish=()=>p.remove();
  }
}

function cleanup(){
  bullets=bullets.filter(b=>{if(b.dead){b.node.remove();return false}return true});
  enemies=enemies.filter(e=>{if(e.dead){e.node.remove();return false}return true});
}

function updateHud(){
  dom.score.textContent=score;
  dom.wave.textContent=wave;
  dom.health.textContent=Math.max(0,player?.hp||0);
}

function announce(text){
  dom.message.textContent=text;dom.message.classList.add('show');
  setTimeout(()=>dom.message.classList.remove('show'),900);
}

function endGame(){
  playing=false;
  dom.game.classList.add('hidden');dom.game_over.classList.remove('hidden');
  dom.final_score.textContent=score;dom.final_wave.textContent=wave;
  dom.result_title.textContent=wave>=8?'¡GLORIA CONQUISTADA!':'EL VACÍO VENCIÓ ESTA VEZ';
}

function initAudio(){if(!audio)try{audio=new (window.AudioContext||window.webkitAudioContext)()}catch{}}
function tone(freq,duration){if(muted||!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.frequency.value=freq;g.gain.setValueAtTime(.07,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.start();o.stop(audio.currentTime+duration)}

document.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code.startsWith('Shift'))special()});
document.addEventListener('keyup',e=>keys.delete(e.code));
document.querySelectorAll('[data-key]').forEach(btn=>{
  const code=btn.dataset.key;
  const down=e=>{e.preventDefault();keys.add(code);if(code.startsWith('Shift'))special()};
  const up=e=>{e.preventDefault();keys.delete(code)};
  btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);btn.addEventListener('pointerleave',up);
});
dom.start_btn.onclick=startGame;
dom.again_btn.onclick=()=>{dom.game_over.classList.add('hidden');dom.menu.classList.remove('hidden')};
dom.sound_btn.onclick=()=>{muted=!muted;dom.sound_btn.textContent=muted?'🔇':'🔊'};
setupMenu();makeStars();
