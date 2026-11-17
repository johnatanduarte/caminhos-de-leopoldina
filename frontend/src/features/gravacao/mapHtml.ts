export const HTML = String.raw`<!doctype html>
<html lang="pt-BR"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
  *{box-sizing:border-box}html,body,#map{margin:0;width:100%;height:100%;overflow:hidden;background:#e3ece5;font-family:system-ui,Arial,sans-serif}
  #map{position:relative;touch-action:none;user-select:none;-webkit-user-select:none}
  #tiles{position:absolute;inset:0;overflow:hidden}
  #tiles img{position:absolute;width:256px;height:256px;max-width:none;pointer-events:none;user-select:none}
  #route{position:absolute;left:0;top:0;width:100%;height:100%;overflow:hidden;pointer-events:none}
  #zoom{position:absolute;left:10px;top:10px;display:flex;flex-direction:column;gap:5px}
  #zoom button{width:40px;height:40px;border:1px solid #bbcabd;border-radius:9px;background:white;color:#17633e;font-size:25px;font-weight:700;box-shadow:0 1px 5px #0002}
  #attribution{position:absolute;bottom:3px;right:4px;padding:3px 5px;font:10px Arial;color:#283f35;background:#ffffffdb;border-radius:3px}
  #alert{display:none;position:absolute;left:10px;right:10px;bottom:31px;background:#fff8e8;border:1px solid #ead3a0;border-radius:7px;padding:10px;color:#705020;font-size:12px;line-height:17px}
</style></head>
<body><div id="map"><div id="tiles"></div><svg id="route" aria-hidden="true"></svg>
<div id="zoom"><button id="plus" aria-label="Aproximar mapa">+</button><button id="minus" aria-label="Afastar mapa">−</button></div>
<div id="alert">Não foi possível baixar o mapa. Verifique a conexão de internet e tente novamente. O GPS e o trajeto continuam sendo registrados.</div>
<div id="attribution">© OpenStreetMap contributors</div></div>
<script>
(function(){
  'use strict';
  var viewport=document.getElementById('map'), tiles=document.getElementById('tiles'),svg=document.getElementById('route');
  var alertBox=document.getElementById('alert'),attr=document.getElementById('attribution');
  var w=0,h=0,zoom=14,lat=-21.531,lon=-42.642,mode='standard';
  var segments=[],current=null,showPosition=false;
  var tileCache={},tileFailCount=0,tileOkCount=0,alerted=false,dragging=false;
  var startX=0,startY=0,startMX=0,startMY=0,pinchDistance=0,changed=false;
  function emit(type,detail){
    try{if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({type:type,detail:detail||''})); else window.parent.postMessage({channel:'caminhos-map',type:type,detail:detail},'*');}catch(e){}
  }
  function clamp(x,a,b){return Math.min(b,Math.max(a,x));}
  function toWorld(la,lo,z){
    var m=Math.sin(clamp(la,-85.051129,85.051129)*Math.PI/180),n=Math.pow(2,z)*256;
    return {x:(lo+180)/360*n,y:(0.5-Math.log((1+m)/(1-m))/(4*Math.PI))*n};
  }
  function fromWorld(x,y,z){
    var n=Math.pow(2,z)*256,nn=Math.PI-2*Math.PI*y/n;
    return {latitude:180/Math.PI*Math.atan(Math.sinh(nn)),longitude:x/n*360-180};
  }
  function routePoint(p,ox,oy){var t=toWorld(p.latitude,p.longitude,zoom);return [(t.x-ox).toFixed(1),(t.y-oy).toFixed(1)];}
  function draw(){
    w=viewport.clientWidth;h=viewport.clientHeight;if(w<1||h<1)return;
    var c=toWorld(lat,lon,zoom),ox=c.x-w/2,oy=c.y-h/2;
    var loX=Math.floor(ox/256),hiX=Math.floor((ox+w)/256),loY=Math.floor(oy/256),hiY=Math.floor((oy+h)/256);
    var needed={},max=Math.pow(2,zoom);
    for(var y=loY;y<=hiY;y++)for(var x=loX;x<=hiX;x++){
      if(y<0||y>=max)continue;
      var wrapped=((x%max)+max)%max,key=mode+'/'+zoom+'/'+wrapped+'/'+y;
      needed[key]=true;
      var img=tileCache[key];
      if(!img){
        img=document.createElement('img');img.alt='';img.decoding='async';
        img.onload=function(){tileOkCount++;alertBox.style.display='none';tileFailCount=0;};
        img.onerror=function(){tileFailCount++;if(tileFailCount>=3&&!alerted){alerted=true;alertBox.style.display='block';emit('tilesError','Falha ao carregar imagens do mapa. Confirme a conexão de internet.');}};
        img.src=mode==='satellite'
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/'+zoom+'/'+y+'/'+wrapped
          : 'https://tile.openstreetmap.org/'+zoom+'/'+wrapped+'/'+y+'.png';
        tileCache[key]=img;tiles.appendChild(img);
      }
      img.style.left=(x*256-ox)+'px';img.style.top=(y*256-oy)+'px';
    }
    Object.keys(tileCache).forEach(function(key){if(!needed[key]){tileCache[key].remove();delete tileCache[key];}});
    var d='';segments.forEach(function(seg){seg.forEach(function(p,i){var v=routePoint(p,ox,oy);d+=(i===0?'M':'L')+v[0]+','+v[1]+' ';});});
    var first=segments.length&&segments[0].length?segments[0][0]:null;
    var last=null;for(var j=segments.length-1;j>=0;j--){if(segments[j].length){last=segments[j][segments[j].length-1];break;}}
    function dot(p,color,r){if(!p)return '';var v=routePoint(p,ox,oy);return '<circle cx="'+v[0]+'" cy="'+v[1]+'" r="'+r+'" stroke="white" stroke-width="3" fill="'+color+'"/>';}
    svg.setAttribute('viewBox','0 0 '+w+' '+h);
    svg.innerHTML='<path d="'+d+'" fill="none" stroke="white" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>'+
      '<path d="'+d+'" fill="none" stroke="#137543" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>'+
      dot(first,'#20a45b',7)+dot(last,'#db4d46',7)+(showPosition?dot(current,'#2678ff',8):'');
    attr.textContent=mode==='satellite'?'Imagens © Esri, Maxar e colaboradores':'© OpenStreetMap contributors';
  }
  function center(latitude,longitude,z){if(!Number.isFinite(latitude)||!Number.isFinite(longitude))return;lat=clamp(latitude,-85,85);lon=longitude;if(Number.isFinite(z))zoom=clamp(Math.round(z),3,19);draw();}
  function pan(dx,dy){var c=toWorld(lat,lon,zoom),p=fromWorld(c.x-dx,c.y-dy,zoom);center(p.latitude,p.longitude);}
  function setZoom(z){zoom=clamp(Math.round(z),3,19);draw();}
  function fit(coords){if(!coords||!coords.length)return;var south=90,north=-90,west=180,east=-180;
    coords.forEach(function(p){south=Math.min(south,p.latitude);north=Math.max(north,p.latitude);west=Math.min(west,p.longitude);east=Math.max(east,p.longitude);});
    var midLat=(south+north)/2,midLon=(west+east)/2;
    for(var z=18;z>=3;z--){var a=toWorld(south,west,z),b=toWorld(north,east,z);
      if(Math.abs(a.x-b.x)<Math.max(80,w-84)&&Math.abs(a.y-b.y)<Math.max(80,h-84)){center(midLat,midLon,z);return;}}
    center(midLat,midLon,3);
  }
  function resize(){draw();}
  document.getElementById('plus').addEventListener('click',function(e){e.stopPropagation();setZoom(zoom+1);});
  document.getElementById('minus').addEventListener('click',function(e){e.stopPropagation();setZoom(zoom-1);});
  viewport.addEventListener('touchstart',function(e){
    if(e.target.tagName==='BUTTON')return;
    if(e.touches.length===1){dragging=true;changed=false;startX=e.touches[0].clientX;startY=e.touches[0].clientY;}
    if(e.touches.length===2){pinchDistance=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);dragging=false;}
  },{passive:false});
  viewport.addEventListener('touchmove',function(e){
    if(e.target.tagName==='BUTTON')return;e.preventDefault();
    if(e.touches.length===1&&dragging){var dx=e.touches[0].clientX-startX,dy=e.touches[0].clientY-startY;
      if(Math.abs(dx)>1||Math.abs(dy)>1){if(!changed){emit('drag');changed=true;}pan(dx,dy);startX=e.touches[0].clientX;startY=e.touches[0].clientY;}}
    if(e.touches.length===2){var dist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
      if(pinchDistance&&dist/pinchDistance>1.45){emit('drag');setZoom(zoom+1);pinchDistance=dist;}
      else if(pinchDistance&&dist/pinchDistance<0.69){emit('drag');setZoom(zoom-1);pinchDistance=dist;}}
  },{passive:false});
  viewport.addEventListener('touchend',function(){dragging=false;});
  viewport.addEventListener('mousedown',function(e){if(e.target.tagName==='BUTTON')return;dragging=true;changed=false;startX=e.clientX;startY=e.clientY;});
  window.addEventListener('mousemove',function(e){if(!dragging)return;var dx=e.clientX-startX,dy=e.clientY-startY;if(dx||dy){if(!changed){emit('drag');changed=true;}pan(dx,dy);startX=e.clientX;startY=e.clientY;}});
  window.addEventListener('mouseup',function(){dragging=false;});
  window.__routeMapCommand=function(msg){
    try{switch(msg.type){
      case 'ping':emit('ready');break;
      case 'editing':window.routeEditing=!!msg.value;break;
      case 'data':segments=msg.segments||[];current=msg.current||null;showPosition=!!msg.showPosition;draw();break;
      case 'center':center(msg.latitude,msg.longitude,msg.zoom);break;
      case 'fit':fit(msg.coords);break;
      case 'mode':mode=msg.value==='satellite'?'satellite':'standard';tileOkCount=0;tileFailCount=0;alerted=false;alertBox.style.display='none';draw();break;
    }}catch(e){emit('error',String(e));}
  };
  window.addEventListener('message',function(e){if(e.source===window.parent&&e.data&&e.data.channel==='caminhos-command')window.__routeMapCommand(e.data.command);});
  viewport.addEventListener('click',function(e){
    if(!window.routeEditing||changed||e.target.tagName==='BUTTON')return;
    var r=viewport.getBoundingClientRect(),c=toWorld(lat,lon,zoom),p=fromWorld(c.x+e.clientX-r.left-w/2,c.y+e.clientY-r.top-h/2,zoom);
    p.longitude=((p.longitude+180)%360+360)%360-180;emit('point',p);
  });
  window.addEventListener('resize',resize);
  draw();emit('ready');
})();
</script></body></html>`;
