/* global d3 */
import debounce from 'lodash.debounce';
import isMobile from './utils/is-mobile';
import linkFix from './utils/link-fix';
import modalSetup from './utils/modal-a11y';
import graphic from './graphic';
import footer from './footer';
import locate from './utils/locate';
import closest from './utils/closest'
import loadData from './load-data'
import generateMap from './generateMap.js'

const $body = d3.select('body');
let previousWidth = 0;

function resize() {
  // only do resize on width changes, not height
  // (remove the conditional if you want to trigger on height change)
  const width = $body.node().offsetWidth;
  if (previousWidth !== width) {
    previousWidth = width;
    graphic.resize();
  }
}

// function setupStickyHeader() {
//   const $header = $body.select('header');
//   if ($header.classed('is-sticky')) {
//     const $menu = $body.select('#slide__menu');
//     const $toggle = $body.select('.header__toggle');
//
//     modalSetup($toggle, $toggle, $header, $menu, 'a, button, .logo', true);
//   }
// }

async function init() {


  mapboxgl.accessToken = 'pk.eyJ1IjoiZG9jazQyNDIiLCJhIjoiY2trOXV2MW9zMDExbTJvczFydTkxOTJvMiJ9.7qeHgJkUfxOaWEYtBGNU9w';
  mapboxgl.setRTLTextPlugin(
    'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
    null,
    true // Lazy load the plugin
  );

  // adds rel="noopener" to all target="_blank" links
  linkFix();
  // add mobile class to body tag
  $body.classed('is-mobile', isMobile.any());
  // setup resize event
  window.addEventListener('resize', debounce(resize, 150));
  // setup sticky header menu
  // setupStickyHeader();
  // kick off graphic code

  let location = await locate.init();
  let coors = location.loc.split(",");

  let data = await loadData(['202102/city_data.csv', '202102/country_data.csv']).then(result => {
    return result;
  }).catch(console.error);

  let closestLocation = closest.NearestCity(coors[0],coors[1],data[0].map(function(d,i){return [d,d.latitude,d.longitude]; }));
  let closestDifferent = closest.NearestCity(closestLocation.latitude,closestLocation.longitude,data[0].filter(function(d){ return d.track_link != closestLocation.track_link; }).map(function(d,i){return [d,d.latitude,d.longitude]; }));

  d3.select(".your-geo").text(closestLocation.geo_name);
  d3.select(".top-song-in-your-geo").html(`&ldquo;${closestLocation.track_name}&rdquo; by ${closestLocation.artist_name}`);
  d3.select(".top-song-in-your-geo-track").text(`${closestLocation.track_name}`);

  d3.select(".nearby-geo").text(`${closestDifferent.geo_name}`);
  d3.select(".top-song-in-nearby-geo").html(`&ldquo;${closestDifferent.track_name}&rdquo; by ${closestDifferent.artist_name}`);
  //
  generateMap.init(d3.select(".map-one").node(),[closestLocation.longitude,closestLocation.latitude],"#7f0101",closestLocation.track_name);
  generateMap.init(d3.select(".map-two").node(),[closestLocation.longitude,closestLocation.latitude],"#017e23",closestDifferent.track_name);

  d3.select(".map-one").select(".headline").style("color","#7f0101").html(`Where &ldquo;${closestLocation.track_name}&rdquo; by ${closestLocation.artist_name} is the most popular song`)
  d3.select(".map-two").select(".headline").style("color","#017e23").html(`Where &ldquo;${closestDifferent.track_name}&rdquo; by ${closestDifferent.artist_name} is the most popular song`)

  generateMap.fullMap(d3.select(".map-full").node(),[closestLocation.longitude,closestLocation.latitude],data[0]);










  // graphic.init();
  // // load footer stories
  // footer.init();
}

init();
