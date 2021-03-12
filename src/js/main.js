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
import choro from './choro.js'
import monoCulture from './monoCulture'

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

  let data = await loadData(['202102/city_data.csv', '202102/country_data.csv','202102/track_info.csv','geo_info.csv','a0.csv']).then(result => {
    return result;
  }).catch(console.error);

  //convert iso code to country name
  let countryCodeToString = new Map(data[4].map(d => [d.id,d.name]));

  //#1 near you

  let closestLocation = closest.NearestCity(coors[0],coors[1],data[0].map(function(d,i){return [d,d.latitude,d.longitude]; }));

  //#1 that's different but same country and closest to you

  let closestDifferent = closest.NearestCity(closestLocation.latitude,closestLocation.longitude,data[0].filter(function(d){ return d.track_link != closestLocation.track_link; }).map(function(d,i){return [d,d.latitude,d.longitude]; }));

  d3.selectAll(".your-geo").text(closestLocation.geo_name);
  d3.selectAll(".your-geo-country").text(countryCodeToString.get(closestLocation.country_code));


  d3.selectAll(".top-song-in-your-geo").html(`${closestLocation.track_name} by ${closestLocation.artist_name}`);
  d3.selectAll(".top-song-in-your-geo-track").text(`${closestLocation.track_name}`);
  d3.selectAll(".nearby-geo").text(`${closestDifferent.geo_name}`);
  d3.selectAll(".top-song-in-nearby-geo").html(`${closestDifferent.track_name} by ${closestDifferent.artist_name}`);

  // generateMap.init(d3.select(".map-one").node(),[closestLocation.longitude,closestLocation.latitude],"#7f0101",closestLocation.track_name);
  // generateMap.init(d3.select(".map-two").node(),[closestLocation.longitude,closestLocation.latitude],"#017e23",closestDifferent.track_name);

  d3.selectAll(".map-one").select(".headline").style("color","#7f0101").html(`Where &ldquo;${closestLocation.track_name}&rdquo; by ${closestLocation.artist_name} is the most popular song`)
  d3.selectAll(".map-two").select(".headline").style("color","#017e23").html(`Where &ldquo;${closestDifferent.track_name}&rdquo; by ${closestDifferent.artist_name} is the most popular song`)

  // are you in a monoculture?

  //get 50 closest cities from nearest

  let closestFifty = closest.withinDistance(coors[0],coors[1],data[0].filter(d => { return d.country_code == closestLocation.country_code; }).map(function(d,i){return [d,d.latitude,d.longitude]; }));
  
  let mono = monoCulture.init(closestFifty);

  let monoText = "is a pop music mono culture, with the same top song within a 45 minute drive of the city."

  if (mono.length < 2){
    console.log("mono culture");
  }
  else {
    let monoText = "is not a mono culture."
  }

  d3.selectAll(".mono-culture-text").html(monoText);

  let choroOutput = choro.init(data);


  //non monoculture
  // let nonMono = await generateMap.generateHex(data[0],choroOutput.colorPallete,closestLocation.country_code);

  d3.selectAll(".non-mono-geo")


  //#1s in your country (if 4 or more)
  let countryCities = data[0].filter(d => { return closestLocation.country_code == d.country_code; });
  let countryHits = d3.rollups(countryCities, v => [v.length,v.length/countryCities.length], d => d.track_link)

  countryHits = countryHits.filter(d => { 
    return d[1][0] > 4 && d[1][1] > .04;
  })


  //mini multiple?
  if(countryHits.length > 2){
    console.log(countryHits);
  }

  //closest country


  //CHANGE THIS SO NOT A TOP HIT IN THE US EITHER
  let closestCountry = closest.NearestCity(closestLocation.latitude,closestLocation.longitude,data[0].filter(function(d){ return d.track_link != closestLocation.track_link && d.country_code != closestLocation.country_code && d.track_link != closestDifferent.track_link; }).map(function(d,i){return [d,d.latitude,d.longitude]; }));


  let mapCreated = await generateMap.fullMap(d3.selectAll(".map-container").node(),[closestLocation.longitude,closestLocation.latitude],data[0],closestCountry.track_name,choroOutput.colorPallete,choroOutput.filters,8);



  generateMap.filterForSpecific(closestLocation.track_name,"#7f0101")

  mapCreated.flyTo({
    // These options control the ending camera position: centered at
    // the target, at zoom level 9, and north up.
    center: [closestLocation.longitude,closestLocation.latitude],
    zoom: 7,
    bearing: 0,
     
    // These options control the flight curve, making it move
    // slowly and zoom out almost completely before starting
    // to pan.
    speed: 0.2, // make the flying slow
    curve: 1, // change the speed at which it zooms out
     
    // This can be any easing function: it takes a number between
    // 0 and 1 and returns another number between 0 and 1.
    easing: function (t) {
    return t;
    },
     
    // this animation is considered essential with respect to prefers-reduced-motion
    essential: true
  });
    


  d3.selectAll(".diff-country-geo").html(closestCountry.geo_name);
  d3.selectAll(".diff-country-song").html(`&ldquo;${closestCountry.track_name}&rdquo; by ${closestCountry.artist_name}`);







  // graphic.init();
  // // load footer stories
  // footer.init();
}

init();
