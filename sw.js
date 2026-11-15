const CACHE='moavoca-v2';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg','./sync-config.js','./sync.js'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==location.origin)return;
 if(request.mode==='navigate'||url.pathname.endsWith('/sync-config.js')||url.pathname.endsWith('/sync.js')||url.pathname.endsWith('/index.html')){
   event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));return response}).catch(()=>caches.match(request)));
 }else event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));
});