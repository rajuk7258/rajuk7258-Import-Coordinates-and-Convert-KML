self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('utm2kml-cache').then(cache => {
      return cache.addAll([
        'index.html',
        'app.js',
        'manifest.json',
        'icon.png',
        'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.8.0/proj4.min.js'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});