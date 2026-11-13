/* MATHORA — migrate old MathSphere cache without retaining obsolete UI. */
const CACHE_NAME='mathora-olympiad-v1';
const CORE=['./','./index.html','./manifest.json','./mathora-backend-config.js'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
  // Network first for navigation prevents stale MathSphere HTML after release.
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(res=>{
      if(res.ok){const copy=res.clone();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put(req,copy)));}
      return res;
    }).catch(()=>caches.match(req).then(v=>v||caches.match('./index.html'))));
    return;
  }
  event.respondWith(fetch(req).then(res=>{
    if(res.ok){const copy=res.clone();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put(req,copy)));}
    return res;
  }).catch(()=>caches.match(req)));
});