'use strict';

const telegram=window.Telegram?.WebApp||null;
if(telegram){
  document.documentElement.classList.add('telegram');
  telegram.ready();
  telegram.expand();
  telegram.setHeaderColor?.('#050715');
  telegram.setBackgroundColor?.('#050715');
  telegram.setBottomBarColor?.('#050715');
  try{if(telegram.isVersionAtLeast?.('8.0'))telegram.requestFullscreen?.()}catch{}
}
function haptic(type='light'){
  try{telegram?.HapticFeedback?.impactOccurred(type)}catch{}
}

const NS = 'http://www.w3.org/2000/svg';
const W = 960, H = 640;
const cadets = [
  {id:'inferno',name:'INFERNO',icon:'🔥',color:'#ff604b',planet:'PYRA',power:'Nova explosiva',welcome:'El fuego de Pyra luchará contigo.',speed:330,damage:2},
  {id:'glacier',name:'GLACIER',icon:'❄️',color:'#65ddff',planet:'NIVALIS',power:'Congelación total',welcome:'Mantén la calma. Nivalis nos protege.',speed:300,damage:2},
  {id:'viper',name:'VIPER',icon:'🐍',color:'#6eff7d',planet:'VERDANT',power:'Ráfaga venenosa',welcome:'Velocidad, precisión y victoria.',speed:370,damage:1},
  {id:'celestial',name:'CELESTIAL',icon:'⭐',color:'#c27aff',planet:'ASTRA',power:'Pulso cósmico',welcome:'Las estrellas han marcado nuestro camino.',speed:315,damage:3}
];

const dom = Object.fromEntries(['menu','game','game-over','cadet-grid','start-btn','again-btn','arena','entities','stars','message','score','wave','health','special','hud-cadet','final-score','final-wave','result-title','sound-btn','bonus','welcome','welcome-avatar','welcome-title','welcome-copy'].map(id => [id.replaceAll('-','_'), document.getElementById(id)]));
const keys = new Set();
let selected = cadets[0], player, enemies=[], bullets=[], particles=[];
let playing=false, score=0, wave=1, specialReady=true, last=0, nextWaveTimer=0, muted=false, audio;
let pickups=[], activeBonus=null, bonusUntil=0, bonusRound=false;
const monsterTypes={
  drone:{label:'DRON',color:'#ff5475',hp:1,speed:1,score:50,size:19},
  hunter:{label:'CAZADOR',color:'#ffb347',hp:2,speed:1.55,score:90,size:16},
  tank:{label:'TITÁN',color:'#bd62ff',hp:5,speed:.62,score:150,size:27}
};
const bonusTypes={
  heal:{label:'VIDA',icon:'♥',color:'#63ff8b'},
  shield:{label:'ESCUDO',icon:'◆',color:'#61e8ff'},
  rapid:{label:'RÁFAGA',icon:'»',color:'#ffd45d'},
  triple:{label:'TRIPLE',icon:'✦',color:'#cf7dff'}
};

function svg(tag, attrs={}) {
  const node = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k,v]) => node.setAttribute(k,v));
  return node;
}

function getBest(id){return Number(localStorage.getItem('bog-best-'+id)||0)}

function saveBest(){
  const best=getBest(selected.id);
  if(score>best){
    localStorage.setItem('bog-best-'+selected.id,String(score));
    const label=document.querySelector('[data-best="'+selected.id+'"]');
    if(label)label.textContent=score;
  }
}

function gainScore(amount,x,y){
  score+=amount;
  if(x==null||y==null)return;
  const popup=svg('text',{x,y,class:'score-popup','text-anchor':'middle'});
  popup.textContent='+'+amount;
  dom.entities.append(popup);
  popup.animate([{transform:'translateY(0) scale(.7)',opacity:0},{transform:'translateY(-18px) scale(1.15)',opacity:1,offset:.28},{transform:'translateY(-58px) scale(1)',opacity:0}],{duration:900,easing:'ease-out'}).onfinish=()=>popup.remove();
}

function setupMenu(){
  cadets.forEach((c,i)=>{
    const button=document.createElement('button');
    button.className='cadet'+(i===0?' selected':'');
    button.style.setProperty('--cadet',c.color);
    button.innerHTML=`<span class="cadet-portrait" style="--portrait-index:${i}" role="img" aria-label="${c.name}"><img src="assets/cadets.png" alt=""></span><strong>${c.name}</strong><small>${c.power}</small><small class="cadet-planet">PLANETA ${c.planet}</small><small class="cadet-score">RÉCORD <b data-best="${c.id}">${getBest(c.id)}</b></small>`;
    button.onclick=()=>{
      selected=c;
      document.querySelectorAll('.cadet').forEach(x=>x.classList.remove('selected'));
      button.classList.add('selected');
      haptic('light');
      tone(420, .05);
    };
    dom.cadet_grid.appendChild(button);
  });
}

function makeStars(){
  for(let i=0;i<58;i++){
    const x=Math.random()*W,y=Math.random()*H,size=Math.random()*2.2+.7;
    const star=svg('path',{d:`M${x} ${y-size*2.4} L${x+size*.55} ${y-size*.55} L${x+size*2.4} ${y} L${x+size*.55} ${y+size*.55} L${x} ${y+size*2.4} L${x-size*.55} ${y+size*.55} L${x-size*2.4} ${y} L${x-size*.55} ${y-size*.55} Z`,fill:i%5===0?'#73eaff':'#fff',opacity:Math.random()*.48+.18,class:'space-star'});
    star.style.setProperty('--twinkle',`${1.8+Math.random()*3}s`);
    star.style.animationDelay=`${-Math.random()*4}s`;
    dom.stars.appendChild(star);
  }
}

function characterNode(c){
  const g=svg('g',{filter:'url(#glow)',class:'player-ship'});
  g.append(svg('path',{d:'M0 -31 L9 -9 L27 19 L9 14 L0 23 L-9 14 L-27 19 L-9 -9 Z',fill:'#111a35',stroke:c.color,'stroke-width':3,'stroke-linejoin':'round'}));
  g.append(svg('path',{d:'M0 -28 L8 8 L0 16 L-8 8 Z',fill:c.color,stroke:'#fff','stroke-width':1.4}));
  g.append(svg('path',{d:'M-8 8 L-24 17 L-11 2 Z M8 8 L24 17 L11 2 Z',fill:c.color,opacity:.72}));
  g.append(svg('ellipse',{cy:-5,rx:4.5,ry:7,fill:'#eaffff',stroke:c.color,'stroke-width':1.5}));
  g.append(svg('path',{d:'M-7 15 L-3 28 L0 20 L3 28 L7 15',fill:c.color,opacity:.85,class:'engine-flame'}));
  return g;
}

function enemyNode(type){
  const m=monsterTypes[type];
  const g=svg('g',{filter:'url(#glow)',class:'enemy-ship '+type});
  const shape=type==='tank'
    ?'M0 -28 L23 -17 L29 8 L16 24 L5 17 L0 27 L-5 17 L-16 24 L-29 8 L-23 -17 Z'
    :type==='hunter'
      ?'M0 -27 L10 -7 L25 18 L7 12 L0 22 L-7 12 L-25 18 L-10 -7 Z'
      :'M0 -23 L18 -10 L23 11 L9 19 L0 12 L-9 19 L-23 11 L-18 -10 Z';
  g.append(svg('path',{d:shape,fill:'#15152d',stroke:m.color,'stroke-width':3,'stroke-linejoin':'round'}));
  g.append(svg('path',{d:type==='tank'?'M-16 -10 L16 -10 L11 12 L0 5 L-11 12 Z':'M0 -18 L8 8 L0 15 L-8 8 Z',fill:m.color,opacity:.82}));
  g.append(svg('ellipse',{cy:-5,rx:type==='tank'?7:4.5,ry:type==='tank'?5:6,fill:'#fff',stroke:m.color,'stroke-width':1.5}));
  g.append(svg('path',{d:'M-6 15 L0 27 L6 15',fill:m.color,opacity:.75,class:'engine-flame'}));
  const label=svg('text',{y:m.size+18,class:'monster-label'});
  label.textContent=m.label;g.append(label);
  return g;
}

function position(obj){ obj.node.setAttribute('transform',`translate(${obj.x} ${obj.y}) rotate(${obj.angle||0})`); }

function startGame(){
  initAudio();
  haptic('medium');
  dom.menu.classList.add('hidden');
  dom.game_over.classList.add('hidden');
  dom.game.classList.remove('hidden');
  dom.entities.replaceChildren();
  enemies=[]; bullets=[]; particles=[]; pickups=[]; score=0; wave=1; specialReady=true; activeBonus=null; bonusUntil=0; bonusRound=false;
  player={x:W/2,y:H-90,hp:100,dirX:0,dirY:-1,node:characterNode(selected),shotAt:0};
  dom.entities.append(player.node); position(player);
  playing=false; nextWaveTimer=0;
  dom.hud_cadet.textContent=selected.name;
  updateHud();
  showWelcome(()=>{
    playing=true; last=performance.now();
    announce('OLEADA 1'); spawnWave(); requestAnimationFrame(loop);
  });
}

function showWelcome(onComplete){
  dom.welcome.style.setProperty('--welcome-color',selected.color);
  dom.welcome_avatar.innerHTML='<img src="assets/cadets.png" alt="">';
  dom.welcome_avatar.style.setProperty('--portrait-index',cadets.indexOf(selected));
  dom.welcome_avatar.setAttribute('aria-label',selected.name);
  dom.welcome_title.textContent=selected.name+' · LISTO';
  dom.welcome_copy.textContent=selected.welcome;
  dom.welcome.classList.remove('hidden','exit');
  tone(240,.18);
  setTimeout(()=>tone(520,.2),250);
  setTimeout(()=>{
    dom.welcome.classList.add('exit');
    setTimeout(()=>{dom.welcome.classList.add('hidden');dom.welcome.classList.remove('exit');onComplete()},380);
  },1050);
}

function spawnWave(){
  bonusRound=wave%3===0;
  if(bonusRound) announce('💎 TORMENTA DE CRISTALES 💎');
  const count=(bonusRound?5:3)+wave*2;
  for(let i=0;i<count;i++){
    const edge=Math.floor(Math.random()*3);
    const roll=Math.random();
    const type=wave>=4&&roll<.2?'tank':wave>=2&&roll<.48?'hunter':'drone';
    const m=monsterTypes[type];
    const e={type,x:edge===0?30:edge===1?W-30:60+Math.random()*(W-120),y:edge===2?35:50+Math.random()*260,hp:m.hp+Math.floor(wave/5),speed:(68+wave*7)*m.speed,node:enemyNode(type),hitAt:0};
    dom.entities.append(e.node); position(e); enemies.push(e);
  }
  if(bonusRound){
    for(let i=0;i<8;i++) dropBonus(90+Math.random()*(W-180),90+Math.random()*(H-180),i%2?'rapid':'triple');
  }
}

function fire(){
  const cooldown=activeBonus==='rapid'?48:125;
  if(!playing || performance.now()-player.shotAt<cooldown)return;
  player.shotAt=performance.now();
  const angles=activeBonus==='triple'?[-.24,0,.24]:[0];
  angles.forEach(offset=>{
    const base=Math.atan2(player.dirY,player.dirX)+offset;
    const dx=Math.cos(base),dy=Math.sin(base);
    const b={x:player.x+dx*28,y:player.y+dy*28,vx:dx*760,vy:dy*760,damage:selected.damage,node:svg('circle',{r:6,fill:selected.color,filter:'url(#glow)'})};
    dom.entities.append(b.node); bullets.push(b);
  });
  tone(650,.035);
  haptic('light');
}

function special(){
  if(!playing || !specialReady)return;
  haptic('heavy');
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
  updatePlayer(dt); updateBullets(dt); updateEnemies(dt,now); updatePickups(now); cleanup();
  if(enemies.length===0){
    nextWaveTimer+=dt;
    if(nextWaveTimer>.65){wave++;nextWaveTimer=0;announce('OLEADA '+wave);spawnWave();}
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
      if(!b.dead && Math.hypot(e.x-b.x,e.y-b.y)<25){e.hp-=b.damage;b.dead=true;gainScore(10,b.x,b.y)}
    });
    if(b.x<0||b.x>W||b.y<0||b.y>H)b.dead=true;
  });
}

function updateEnemies(dt,now){
  enemies.forEach(e=>{
    const dx=player.x-e.x,dy=player.y-e.y,d=Math.max(1,Math.hypot(dx,dy));
    e.x+=dx/d*e.speed*dt;e.y+=dy/d*e.speed*dt;e.angle=Math.atan2(dy,dx)*180/Math.PI+90;position(e);
    if(d<45 && now-e.hitAt>700){
      e.hitAt=now;
      const damage=activeBonus==='shield'?4:e.type==='tank'?18:10;
      player.hp-=damage;haptic('heavy');dom.arena.animate([{filter:'brightness(2)'},{filter:'none'}],{duration:180});tone(110,.08)
    }
    if(e.hp<=0){
      e.dead=true;
      gainScore(monsterTypes[e.type].score,e.x,e.y);
      burst(e.x,e.y,monsterTypes[e.type].color);
      const chance=bonusRound?.45:.14;
      if(Math.random()<chance)dropBonus(e.x,e.y);
    }
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

function dropBonus(x,y,forced){
  const keys=Object.keys(bonusTypes),type=forced||keys[Math.floor(Math.random()*keys.length)],b=bonusTypes[type];
  const node=svg('g',{class:'bonus-orb',style:`color:${b.color}`});
  node.append(svg('circle',{r:17,fill:b.color,opacity:.25,stroke:b.color,'stroke-width':3}));
  const t=svg('text',{y:7,'text-anchor':'middle','font-size':20,fill:'#fff'});t.textContent=b.icon;node.append(t);
  const p={type,x,y,node,created:performance.now()};dom.entities.append(node);position(p);pickups.push(p);
}

function updatePickups(now){
  pickups.forEach(p=>{
    if(Math.hypot(p.x-player.x,p.y-player.y)<38){
      p.dead=true;gainScore(100,p.x,p.y);activateBonus(p.type);haptic('medium');tone(920,.12);
    }
    if(now-p.created>12000)p.dead=true;
  });
  if(activeBonus && now>bonusUntil){activeBonus=null;dom.bonus.textContent='—'}
}

function activateBonus(type){
  if(type==='heal'){player.hp=Math.min(100,player.hp+35);dom.bonus.textContent='+VIDA';return}
  activeBonus=type;bonusUntil=performance.now()+8000;dom.bonus.textContent=bonusTypes[type].label;
}

function cleanup(){
  bullets=bullets.filter(b=>{if(b.dead){b.node.remove();return false}return true});
  enemies=enemies.filter(e=>{if(e.dead){e.node.remove();return false}return true});
  pickups=pickups.filter(p=>{if(p.dead){p.node.remove();return false}return true});
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
  saveBest();
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

window.addEventListener('load',()=>setTimeout(()=>document.getElementById('boot-screen')?.classList.add('boot-done'),450));
