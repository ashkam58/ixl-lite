
// /engine/router.js
(async function(){
  window.Manifest = await (await fetch('manifest.json')).json();
})();
