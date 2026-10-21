(() => {
'use strict';
const $ = id => document.getElementById(id), categories = ['classical','jazz','lofi','ambient'];
const defaults = {classical:'https://www.youtube.com/watch?v=mdJU5ogrPMY',jazz:'https://www.youtube.com/watch?v=NJuSStkIZBg',lofi:'https://www.youtube.com/watch?v=ufpIzyk1FiQ',ambient:'https://www.youtube.com/watch?v=c0_ejQQcrwI'};
let prefs = {source:'youtube',category:'classical',volume:35,urls:{}};
try { const p=JSON.parse(localStorage.getItem('vulenor-radio-v1')); if(p){if(['youtube','archive'].includes(p.source))prefs.source=p.source;if(categories.includes(p.category))prefs.category=p.category;if(Number.isFinite(p.volume))prefs.volume=Math.max(0,Math.min(100,p.volume));if(p.urls&&typeof p.urls==='object')prefs.urls=p.urls;} } catch {}
let player=null, apiPromise=null, generation=0, playing=false, pending=false, tracks=[], archiveError='', ducked=false, duckTimer;
const audio=$('radio-audio');
function status(text){$('radio-status').textContent=text;}
function save(){try{localStorage.setItem('vulenor-radio-v1',JSON.stringify(prefs));}catch{status('Tercihler bu tarayıcıda kaydedilemiyor.');}}
function parseURL(raw){
 const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.port)throw Error('HTTPS YouTube bağlantısı kullan.');
 const host=u.hostname.toLowerCase();if(!['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtube-nocookie.com'].includes(host))throw Error('Yalnız YouTube video / liste bağlantısı kabul edilir.');
 let video=null,list=u.searchParams.get('list');
 if(host==='youtu.be')video=u.pathname.slice(1);else if(u.pathname==='/watch')video=u.searchParams.get('v');else if(/^\/(embed|shorts|live)\//.test(u.pathname))video=u.pathname.split('/')[2];else if(u.pathname!=='/playlist')throw Error('Video veya oynatma listesi bağlantısı kullan.');
 if(video&&!/^[A-Za-z0-9_-]{11}$/.test(video))throw Error('Video kimliği geçersiz.');
 if(list&&!/^[A-Za-z0-9_-]{10,100}$/.test(list))throw Error('Liste kimliği geçersiz.');
 if(!video&&!list)throw Error('Bağlantıda video veya liste kimliği yok.');
 return {video,list,url:video?'https://www.youtube.com/watch?v='+video+(list?'&list='+list:''):'https://www.youtube.com/playlist?list='+list};
}
function button(){ $('radio-play').textContent=playing?'Duraklat':pending?'Yükleniyor…':'Müziği başlat';$('radio-play').disabled=pending||(prefs.source==='archive'&&!available().length); }
function volume(){const v=ducked?Math.min(prefs.volume,10):prefs.volume;audio.volume=v/100;try{player?.setVolume(v);}catch{}$('radio-volume-value').value=prefs.volume+'%';}
function stop(){generation++;pending=false;playing=false;audio.pause();audio.removeAttribute('src');audio.load();if(player){try{player.destroy();}catch{}player=null;} $('radio-player-wrap').hidden=true;$('radio-player-wrap').replaceChildren(Object.assign(document.createElement('div'),{id:'radio-player'}));button();}
function available(){return tracks.filter(t=>t.category===prefs.category);}
function selection(){stop();const yt=prefs.source==='youtube';$('radio-url-form').hidden=!yt;$('radio-archive').hidden=yt;$('radio-external').hidden=!yt;$('radio-url').value=prefs.urls[prefs.category]||defaults[prefs.category];if(yt){try{$('radio-external').href=parseURL($('radio-url').value).url;status('Hazır. Başlat’a bas; video oynatıcısı görünür açılır.');}catch(e){status(e.message);}}else{const list=available();$('radio-track').replaceChildren();for(const t of list)$('radio-track').add(new Option(t.title,t.id));if(!list.length)$('radio-track').add(new Option('Bu türde henüz izinli parça yok',''));$('radio-track').disabled=!list.length;status(archiveError||(!list.length?'Arşivimiz henüz boş. İzinli yerel parçalar eklendiğinde burada görünecek.':'Yerel arşiv hazır.'));}button();save();}
function api(){if(window.YT?.Player)return Promise.resolve();if(apiPromise)return apiPromise;apiPromise=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';const timer=setTimeout(()=>{apiPromise=null;s.remove();reject(Error('YouTube API yüklenemedi. Ağ / engelleyici ayarlarını kontrol et.'));},15000);window.onYouTubeIframeAPIReady=()=>{clearTimeout(timer);resolve();};s.onerror=()=>{clearTimeout(timer);apiPromise=null;s.remove();reject(Error('YouTube bağlantısı engellendi.'));};document.head.append(s);});return apiPromise;}
function permitted(){const box=$('radio-player-wrap').getBoundingClientRect();const visible=!player||Math.max(0,Math.min(box.bottom,innerHeight)-Math.max(box.top,0))>=box.height*.5;return visible&&!document.body.classList.contains('zen')&&document.visibilityState==='visible';}
function pauseHidden(reason){if(prefs.source!=='youtube')return;try{player?.pauseVideo();}catch{}playing=false;button();if(player||pending)status(reason+' YouTube duraklatıldı; dönüşte Başlat’a bas.');}
async function play(){
 if(playing){if(prefs.source==='youtube')player?.pauseVideo();else audio.pause();playing=false;button();status('Müzik duraklatıldı.');return;}
 if(prefs.source==='archive'){const track=available().find(t=>t.id===$('radio-track').value);if(!track)return;const token=generation;try{if(audio.getAttribute('src')!==track.src)audio.src=track.src;await audio.play();if(token!==generation){audio.pause();return;}playing=true;button();status(track.title);}catch{status('Yerel parça çalınamadı; dosyayı ve ses iznini kontrol et.');}return;}
 if(player&&!document.body.classList.contains('zen'))$('radio-player-wrap').scrollIntoView({block:'center'});
 if(!permitted()){status('YouTube için odak modundan çık ve sekmeyi görünür tut.');return;}
 if(player){$('radio-player-wrap').scrollIntoView({block:'center'});player.playVideo();status('Oynatma isteniyor; gerekirse videodaki oynat düğmesine bas.');return;}
 let item;try{item=parseURL($('radio-url').value);}catch(e){status(e.message);return;}
 const token=++generation;pending=true;button();status('YouTube yükleniyor…');
 try{await api();if(token!==generation)return;pending=false;if(!permitted()){button();return;}$('radio-player-wrap').hidden=false;$('radio-player-wrap').scrollIntoView({block:'center'});
 player=new YT.Player('radio-player',{width:'100%',height:'270',videoId:item.video||'',playerVars:{autoplay:0,controls:1,playsinline:1,origin:location.origin,list:item.list||undefined,listType:item.list?'playlist':undefined},events:{onReady:e=>{if(token!==generation)return;volume();button();status('Video hazır. Oynatıcıdaki ▶ düğmesine bas.');},onStateChange:e=>{if(token!==generation)return;if(e.data===1&&!permitted()){pauseHidden('Odak / gizli sekme.');return;}playing=e.data===1;button();if(e.data===1)status('YouTube çalıyor.');else if(e.data===2)status('YouTube duraklatıldı.');else if(e.data===0)status('Yayın sona erdi.');},onError:e=>{if(token!==generation)return;playing=false;pending=false;button();status(({2:'Geçersiz video.',5:'YouTube HTML5 oynatma hatası.',100:'Video bulunamadı veya özel.',101:'YouTube bu gömülü oynatmayı reddetti (101). Video izni veya bot / oturum kontrolü olabilir; YouTube’da aç veya başka bağlantı seç.',150:'YouTube bu gömülü oynatmayı reddetti (150). Video izni veya bot / oturum kontrolü olabilir; YouTube’da aç veya başka bağlantı seç.',153:'YouTube istemci / Referer doğrulamasını reddetti.'})[e.data]||'YouTube oynatma hatası ('+e.data+').') ;}}});
 }catch(e){if(token===generation){pending=false;button();status(e.message);}}
}
$('radio-source').value=prefs.source;$('radio-category').value=prefs.category;$('radio-volume').value=prefs.volume;
$('radio-source').addEventListener('change',()=>{prefs.source=$('radio-source').value;selection();});$('radio-category').addEventListener('change',()=>{prefs.category=$('radio-category').value;selection();});
$('radio-volume').addEventListener('input',()=>{prefs.volume=Number($('radio-volume').value);volume();save();});
$('radio-url-form').addEventListener('submit',e=>{e.preventDefault();try{const item=parseURL($('radio-url').value);prefs.urls[prefs.category]=item.url;selection();}catch(err){status(err.message);}});
$('radio-default').addEventListener('click',()=>{delete prefs.urls[prefs.category];selection();});$('radio-play').addEventListener('click',play);$('radio-track').addEventListener('change',()=>{audio.pause();audio.removeAttribute('src');playing=false;button();status('Parça seçildi; Başlat’a bas.');});
$('radio').addEventListener('keydown',e=>e.stopPropagation());
new MutationObserver(()=>{if(document.body.classList.contains('zen'))pauseHidden('Saat odak modu.');}).observe(document.body,{attributes:true,attributeFilter:['class']});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseHidden('Sekme gizli.');});
new IntersectionObserver(entries=>{if(player&&entries[0].intersectionRatio<0.5)pauseHidden('Video ekran dışında.');},{threshold:[0,.5,1]}).observe($('radio-player-wrap'));
window.addEventListener('vulenor:alarm',()=>{ducked=true;volume();clearTimeout(duckTimer);duckTimer=setTimeout(()=>{ducked=false;volume();},1800);});
audio.addEventListener('ended',()=>{const list=available(),i=list.findIndex(t=>t.id===$('radio-track').value);if(list.length){$('radio-track').value=list[(i+1)%list.length].id;playing=false;play();}});audio.addEventListener('error',()=>{playing=false;button();status('Arşiv dosyası yüklenemedi.');});window.addEventListener('pagehide',()=>{audio.pause();try{player?.pauseVideo();}catch{}});
selection();volume();
fetch('/timer/archive/manifest.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(m=>{if(m.version!==1||!Array.isArray(m.tracks))throw Error();tracks=m.tracks.filter(t=>typeof t.id==='string'&&typeof t.title==='string'&&categories.includes(t.category)&&typeof t.license==='string'&&t.license.trim()&&typeof t.src==='string'&&/^\/timer\/archive\/tracks\/[A-Za-z0-9_-]+\.(mp3|ogg|m4a|wav)$/.test(t.src));if(prefs.source==='archive')selection();}).catch(()=>{archiveError='Arşiv listesi yüklenemedi. Daha sonra yeniden dene.';if(prefs.source==='archive')selection();});
})();
