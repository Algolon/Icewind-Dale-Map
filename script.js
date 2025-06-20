const mapEl = document.getElementById('map');
const markersEl = document.getElementById('markers');

// ----- Panzoom -----
const panzoomInstance = Panzoom(mapEl, {
  maxScale: 3,
  minScale: 0.4,
  contain: 'outside'
});
document.getElementById('map-container').addEventListener('wheel', panzoomInstance.zoomWithWheel);
document.getElementById('zoomIn').addEventListener('click',()=>panzoomInstance.zoomIn());
document.getElementById('zoomOut').addEventListener('click',()=>panzoomInstance.zoomOut());

// apply same transform to markers layer
mapEl.addEventListener('panzoomchange', e=>{
  const {detail:{scale,x,y}}=e;
  markersEl.style.transform=`translate(${x}px,${y}px) scale(${scale})`;
});

// ----- Markers -----
fetch('data/markers.json')
 .then(r=>r.json())
 .then(data=>{
    data.forEach(m=>{
       const el=document.createElement('div');
       el.className='marker '+m.size+(m.pulse?' pulse':'');
       el.style.left=m.x+'%';
       el.style.top=m.y+'%';
       el.dataset.desc=m.description;
       el.dataset.name=m.name;

       el.addEventListener('mouseenter', showTip);
       el.addEventListener('mouseleave', removeTip);
       el.addEventListener('click', e=>popup(m,e));
       markersEl.appendChild(el);
    });
 });

function showTip(e){
  const t=document.createElement('div');
  t.className='popup';
  t.innerText=e.target.dataset.name;
  document.body.appendChild(t);
  positionTip(t,e.pageX,e.pageY);
  e.target._tip=t;
}
function removeTip(e){
  e.target._tip?.remove();
}
function positionTip(t,x,y){
  const margin=10;
  t.style.left=x+margin+'px';
  t.style.top=y+margin+'px';
}
function popup(marker,event){
  const p=document.createElement('div');
  p.className='popup';
  p.innerText=marker.name+": "+marker.description;
  document.body.appendChild(p);
  positionTip(p,event.pageX,event.pageY);
  setTimeout(()=>p.remove(),4000);
}

// ----- Intro overlay -----
const intro=document.getElementById('intro');
const revealBtn=document.getElementById('reveal');
const skipCb=document.getElementById('skipIntro');

if(localStorage.getItem('skipIntro')) intro.classList.remove('intro-visible');

revealBtn.addEventListener('click',()=>{
   intro.classList.remove('intro-visible');
   if(skipCb.checked) localStorage.setItem('skipIntro','1');
});