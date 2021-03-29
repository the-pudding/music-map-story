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
import generateHex from './generateHex.js'
import "intersection-observer";
import scrollama from "scrollama";
import player from './player.js';

let scroller = null;

const $body = d3.select('body');
let previousWidth = 0;
let flyToTimeout = null;
let hexLayerAdded = false;
let formatComma = d3.format(",");

function resize() {
  // only do resize on width changes, not height
  // (remove the conditional if you want to trigger on height change)
  const width = $body.node().offsetWidth;
  if (previousWidth !== width) {
    previousWidth = width;
    graphic.resize();
  }
  if(scroller){
    scroller.resize;   
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

  player.init();

  mapboxgl.accessToken = 'pk.eyJ1IjoiZG9jazQyNDIiLCJhIjoiY2trOXV2MW9zMDExbTJvczFydTkxOTJvMiJ9.7qeHgJkUfxOaWEYtBGNU9w';
  mapboxgl.setRTLTextPlugin(
    'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
    null,
    true // Lazy load the plugin
  );


  scroller = scrollama();

  let chartTitle = d3.select(".chart-title")
  let fixedMap = d3.select(".fixed-map")

  
 
  


    // setup resize event
  
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

  let data = await loadData(['202102/city_data.csv', '202102/country_data.csv','202102/track_info.csv','geo_info.csv','a0.csv','countries-110m.json']).then(result => {
    return result;
  }).catch(console.error);

  //convert iso code to country name
  let countryCodeToString = new Map(data[4].map(d => [d.id,d.name]));
  let countryCodeToBounding = new Map(data[4].map(d => [d.id,d.bounding]));

  data[1].forEach(function(d){
    d.country_code = d.iso;
    d.views = d.max_views;
  })

  let uniqueSongs = d3.groups(data[0].concat(data[1]),d => d.track_link)
  let uniqueSongsMap = d3.group(data[0].concat(data[1]),d => d.track_link)
  let uniqueSongsCityOnlyMap = d3.group(data[0],d => d.track_link)


  let dedupedData = d3.rollups(data[0], v => d3.sum(v, d => +d.views), d => d.country_code, d => d.track_link)
    .map(function(d){
      return {key:d[0],value:d[1].sort((a,b) => d3.descending(a[1], b[1]))[0]}
    });

  let dedupedCountryData = data[1].filter(function(d){
    return dedupedData.map(d => d.key).indexOf(d.country_code) == -1;
  })

  dedupedData = dedupedData.concat(dedupedCountryData.map(d => { 
    return {key: d.country_code, value: [d.track_link, +d.max_views]}
  })).map(d => {
    return {key:d.key, track_link:d.value[0], views: d.value[1]};
  });

  let countryRollups = d3.groups(data[0], d => d.country_code).map(d => {
      return [d[0],d3.sum(d[1],d => d.views),d[1]]
    })
    .map(d => {
      let total = d[1];
      let rollup = d3.rollups(d[2], v => d3.sum(v, d => d.views)/total, d => d.track_link);
      return [d[0], d[1], rollup];
    }) 
    
  
  // let countryHitsUnfiltered = d3.rollups(countryCities, v => [v.length,v.length/countryCities.length,v], d => d.track_link)


  //#1 near you

  let closestLocation = closest.NearestCity(coors[0],coors[1],data[0].map(function(d,i){return [d,d.latitude,d.longitude]; }));

  //#1 that's different but same country and closest to you

  let closestDifferent = closest.NearestCity(closestLocation.latitude,closestLocation.longitude,data[0].filter(function(d){ return d.track_link != closestLocation.track_link; }).map(function(d,i){return [d,d.latitude,d.longitude]; }));

  d3.selectAll(".your-geo").text(closestLocation.geo_name);
  d3.selectAll(".your-geo-country").text(countryCodeToString.get(closestLocation.country_code));


  d3.selectAll(".top-song-in-your-geo").attr("data-link", `${closestLocation.track_link}`).html(function(d){
    let svg = "";
    if(d3.select(this).classed("song-highlight")){
      svg = `<svg width="" height="" version="1.1" viewBox="20 10 40 26"><path d="M 45,24 27,14 27,34" fill="#f3dbba"></path></svg>`
    }
    return `${closestLocation.track_name} by ${closestLocation.artist_name}${svg}` 
  });
  d3.selectAll(".top-song-in-your-geo-track").text(`${closestLocation.track_name}`);
  d3.selectAll(".nearby-geo").text(`${closestDifferent.geo_name}`);
  d3.selectAll(".top-song-in-nearby-geo").attr("data-link", `${closestDifferent.track_link}`).html(`${closestDifferent.track_name} by ${closestDifferent.artist_name} <svg width="" height="" version="1.1" viewBox="20 10 40 26"><path d="M 45,24 27,14 27,34" fill="#f3dbba"></path></svg>`);

  // generateMap.init(d3.select(".map-one").node(),[closestLocation.longitude,closestLocation.latitude],"#7f0101",closestLocation.track_name);
  // generateMap.init(d3.select(".map-two").node(),[closestLocation.longitude,closestLocation.latitude],"#017e23",closestDifferent.track_name);

  d3.selectAll(".chart-title").select(".chart-hed").select("span").style("color","#7f0101").html(`Where &ldquo;${closestLocation.track_name}&rdquo; by ${closestLocation.artist_name} is the most popular song`)
  d3.selectAll(".chart-title").select(".chart-dek").select("span").html(`YouTube Views Jan 15 - Feb 15, 2021`)


  

  // are you in a monoculture?

  //get 50 closest cities from nearest
  let closestFifty = closest.withinDistance(coors[0],coors[1],data[0].filter(d => { return d.country_code == closestLocation.country_code; }).map(function(d,i){return [d,d.latitude,d.longitude]; }));
  
  let mono = monoCulture.init(closestFifty);

  let monoText = "is a pop music mono culture, with the same top song within a 45 minute drive of the city."


  console.log(mono);
  if (mono.length < 3){
    console.log("mono culture");
  }
  else {
    monoText = `is a pop music melting pot, with a different #1 song depending on where you are. Each circle below represents the top song in a city.`
    d3.select(".non-mono-text").html(`This musical diversity is similarly found in`)
  }

  d3.selectAll(".mono-culture-text").html(monoText);

  let choroOutput = choro.init(data);

  //#1s in your country (if 4 or more)

  let countryCities = data[0].filter(d => { return closestLocation.country_code == d.country_code; });
  let countryHitsUnfiltered = d3.rollups(countryCities, v => [v.length,v.length/countryCities.length,v], d => d.track_link)

  let countryHits = countryHitsUnfiltered.filter(d => { 
    return d[1][0] > 4 && d[1][1] > .04;
  })

  //mini multiple?
  if(countryHits.length < 2){

    countryHits = countryHitsUnfiltered.filter(d => { 
      return d[1][0] > 1 && d[1][1] > .02;
    })
  
  }

  if(countryHits > 1){

    d3.selectAll(".mini-multiple-count").html(countryHits.length);

    let countryBoundingBox = countryCodeToBounding.get(closestLocation.country_code)

    let imageDiv = d3.select(".mini-multiple").selectAll("div")
      .data(countryHits)
      .enter()
      .append("div")
      .attr("class","mini-multiple-image")

    imageDiv.append("p")
      .attr("class","title")
      .html(function(d){
        let backgroundColor = choroOutput.colorPallete.circleColorsMap.get(d[0]);
        let color = d3.color(backgroundColor);
        let colorRgba = "rgba("+color.r+","+color.g+","+color.b+",.5)";
        return `Where <span style="background-color:${colorRgba};" data-link="${d[1][2][0].track_link}" class="song-highlight">${d[1][2][0].track_name} by ${d[1][2][0].artist_name} <svg width="" height="" version="1.1" viewBox="20 10 40 26"><path d="M 45,24 27,14 27,34" fill="#f3dbba"></path></svg></span> is most popular`;
      })
    
    imageDiv
      .append("img")
      .attr("src",function(d){
        let circleColor = choroOutput.colorPallete.circleColorsMap.get(d[0]);
        let trackLink = d[0];
        let minZoom = 3;
        let minSizeOne = 5;
        let maxSizeOne = 8;
        let defaultSizeOne = 5;
        return `https://api.mapbox.com/styles/v1/dock4242/ckm0ti7lz0opv17rmh48pf2f5/static/[${countryBoundingBox}]/900x500?access_token=pk.eyJ1IjoiZG9jazQyNDIiLCJhIjoiY2trOXV2MW9zMDExbTJvczFydTkxOTJvMiJ9.7qeHgJkUfxOaWEYtBGNU9w&addlayer={%22id%22:%22dot-overlay%22,%22type%22:%22circle%22,%22source%22:{%22type%22:%22vector%22,%22url%22:%22mapbox://dock4242.2kh67qno%22},%22source-layer%22:%22city_data_w_id-crit9s%22,%22paint%22:{%22circle-color%22:%22${circleColor}%22,%22circle-radius%22:[%20%22interpolate%22,%20[%22linear%22],%20[%22zoom%22],%20${minZoom},%20[%20%22case%22,%20[%20%22==%22,%20[%20%22typeof%22,%20[%22get%22,%20%22views%22]%20],%20%22number%22%20],%20[%20%22interpolate%22,%20[%22linear%22],%20[%20%22number%22,%20[%22get%22,%20%22views%22]%20],%2050000,%20${minSizeOne},%201000000,%20${maxSizeOne}%20],%20${defaultSizeOne}%20],%208,%20[%20%22case%22,%20[%20%22==%22,%20[%20%22typeof%22,%20[%22get%22,%20%22views%22]%20],%20%22number%22%20],%20[%20%22interpolate%22,%20[%22linear%22],%20[%20%22number%22,%20[%22get%22,%20%22views%22]%20],%2050000,%2010,%201000000,%2020%20],%205%20]%20]},"filter":["all",["match",["get","track_link"],[${JSON.stringify(trackLink)}],true,false]]}`
      })
      .style("width","450px")
      .style("height","auto")

      d3.selectAll(".song-highlight").on("click", function(d){
        player.playVideo(d3.select(this).attr("data-link"));
      })
  }

  else {
    d3.select(".text-wrapper-mini-multiple").style("display","none")
  }




  //closest country

  let closestCountry = closest.NearestCity(closestLocation.latitude,closestLocation.longitude,data[0]
      .filter(function(d){ 
        return d.country_code != closestLocation.country_code && [closestLocation.track_link,closestDifferent.track_link].indexOf(d.track_link) == -1 && countryHits.map(d => d[0]).indexOf(d.track_link) == -1; 
      })
      .map(function(d,i){return [d,d.latitude,d.longitude]; }));


  let mapCreated = await generateMap.fullMap(d3.selectAll(".map-container").node(),[closestLocation.longitude,closestLocation.latitude],data[0],closestCountry.track_name,choroOutput.colorPallete,choroOutput.filters,8);

  generateMap.filterForSpecific(closestLocation.track_name,"#7f0101")

  d3.selectAll(".diff-country-geo").html(`${closestCountry.geo_name}, ${countryCodeToString.get(closestCountry.country_code)}`);
  d3.selectAll(".diff-country-song").html(`&ldquo;${closestCountry.track_name}&rdquo; by ${closestCountry.artist_name}`);
  d3.selectAll(".diff-country-dist").html(`${Math.round(closest.getDistanceFromLatLonInKm(closestCountry.latitude, closestCountry.longitude, closestLocation.latitude, closestLocation.longitude))}`);

  

  //non monoculture

  let songsToRemove = [closestLocation.track_link,closestDifferent.track_link, closestCountry.track_link].concat(countryHitsUnfiltered.filter(d => d[1][1] > .04).map(d => d[0]))

  let nonMono = await generateHex.generateHex(data[0],choroOutput.colorPallete,closestLocation.country_code,songsToRemove);
  let nonMonoInCountry = nonMono[0];
  let nonMonoOutCountry = nonMono[1];
  let bubbleDiffHex = nonMono[2];



  //ensure it's far enough away from your location
  nonMonoInCountry = nonMonoInCountry.filter(function(d){
    let dist = closest.getDistanceFromLatLonInKm(closestLocation.latitude,closestLocation.longitude,d[1],d[0]);
    return dist > 100;
  })

  let nonMonoSelected = null;
  let nonMonoCenter = null;

  if(nonMonoInCountry.length > 1){
    nonMonoSelected = nonMonoInCountry[Math.floor(Math.random()*(nonMonoInCountry.length-1))];
    nonMonoCenter = nonMonoSelected[2][0].sort(function(a,b){ return +b.views - +a.views})[0];
  }
  else {
    nonMonoOutCountry = nonMonoOutCountry.filter(function(d){
      d.dist = closest.getDistanceFromLatLonInKm(closestLocation.latitude,closestLocation.longitude,d[1],d[0]);
      return d.dist > 50;
    }).sort(function(a,b){
      return a.dist - b.dist;
    })

    nonMonoSelected = nonMonoOutCountry[0];
    nonMonoCenter = nonMonoSelected[2][0].sort(function(a,b){ return +b.views - +a.views})[0];
  }


  


  let bubbleDiffHexSelected = bubbleDiffHex[Math.floor(Math.random()*(bubbleDiffHex.length-1))];
  let bubbleDiffHexCenter = bubbleDiffHexSelected[2][0].sort(function(a,b){ return +b.views - +a.views})[0];

  console.log(nonMonoSelected);

  d3.selectAll(".non-mono-geo").text(`${nonMonoCenter.geo_name}`);
  d3.selectAll(".non-mono-count").text(`${nonMonoSelected[2][1]}`);


  

  d3.selectAll(".bubble-diff-hex-geo").text(`${bubbleDiffHexCenter.geo_name}, ${countryCodeToString.get(bubbleDiffHexCenter.country_code).replace("the ","")}`);


  //sister cities
  
  // let sisterCities = uniqueSongsMap.get(closestLocation.track_link)
  //   .filter(function(d){
  //     return d.country_code != closestLocation.country_code
  //   })

  // sisterCities.sort()
  let sisterGeo = null;

  let sisterCountries = data[1].filter(d => d.country_code != closestLocation.country_code && d.track_link == closestLocation.track_link )
    .sort(function(a,b){ 
      return +b.max_views - +a.max_views
    }).filter(function(d){
      let match = false;
      let trackLink = d.track_link;
      let countryCode = d.country_code;
      let citiesInCountry = uniqueSongsCityOnlyMap.get(trackLink)
        .filter(function(d){
          return d.country_code == countryCode;
        })
      if(citiesInCountry.length > 0){
        return d;
      }
    });
  
  if(sisterCountries.length > 0){
    sisterGeo = sisterCountries[0];
    sisterGeo["geography"] = "country";
  }
  
  else {
    let sisterCities = data[0]
      .filter(d => d.country_code != closestLocation.country_code && d.track_link == closestLocation.track_link )
      .sort(function(a,b){ return +b.views - +a.views});

    
    if(sisterCities.length > 0){
      sisterGeo = sisterCities[0];
      sisterGeo["geography"] = "city";
    }

  }

  console.log(sisterGeo);

  if(sisterGeo){
    let sisterDist = formatComma(Math.floor(closest.getDistanceFromLatLonInKm(closestLocation.latitude, closestLocation.longitude, sisterGeo.latitude, sisterGeo.longitude)));

    d3.select(".sister-distance").text(`${sisterDist}`);
    d3.select(".sister-geo").text(`${countryCodeToString.get(sisterGeo.country_code)}`)  
  }
  else {
    d3.select(".sister-cities-text-wrapper").style("display","none")
    d3.select(".sister-cities-step").style("height","1px").style("display","none");
  }

  
  //opposite cities
  //most popular song in the world not mentioned + count of cities

  let bubbleHit = d3.rollups(dedupedData.filter(d => {
    return songsToRemove.indexOf(d.track_link) == -1;
  }), v => v.length, d => d.track_link).sort((a,b) => b[1] - a[1])[0][0];

  let bubbleCountry = countryCodeToString.get(uniqueSongsMap.get(bubbleHit).sort(function(a,b){return +b.views - +a.views })[0].country_code);
  




  let bubbleHitTrackInfo = uniqueSongsMap.get(bubbleHit)[0];
  let bubbleHitName = `${bubbleHitTrackInfo.track_name} by ${bubbleHitTrackInfo.artist_name}`;

  d3.select(".bubble-hit-song").attr("data-link", `${bubbleHitTrackInfo.track_link}`).html(`${bubbleHitName}  <svg width="" height="" version="1.1" viewBox="20 10 40 26"><path d="M 45,24 27,14 27,34" fill="#f3dbba"></path></svg>`)
  d3.select(".bubble-hit-geo").html(`${bubbleCountry}`);


  //hexagons with different songs from what's been mentioned 

  // or countries with songs different than anywhere else in the world
  // hexaongs with songs different than anywhere else in the world

  let bubbleDiffCountry = countryRollups.filter(d => {
    let match = true;
    for (let song in d[2]){

      if(songsToRemove.indexOf(d[2][song][0]) > -1){
        match = false;
      }
    }
    return match;
  })

  let bubbleDiffCountrySelected = bubbleDiffCountry[Math.floor(Math.random()*(bubbleDiffCountry.length-1))];
  let bubbleDiffCountryBbox = countryCodeToBounding.get(bubbleDiffCountrySelected[0])
  d3.selectAll(".bubble-diff-country-geo").html(countryCodeToString.get(bubbleDiffCountrySelected[0]));
  
  let labelCrosswalk = {
    "location-closest": {
      text: `Where &ldquo;${closestLocation.track_name}&rdquo; by ${closestLocation.artist_name} is the most popular song`,
      labelColor: choroOutput.colorPallete.labelColorsMap.get(closestLocation.track_link),
      circleColor: choroOutput.colorPallete.circleColorsMap.get(closestLocation.track_link),
      coors: [closestLocation.longitude,closestLocation.latitude],
      track_name: closestLocation.track_name
    },
    "location-diff":{
      text: `Where &ldquo;${closestDifferent.track_name}&rdquo; by ${closestDifferent.artist_name} is the most popular song`,
      labelColor: choroOutput.colorPallete.labelColorsMap.get(closestDifferent.track_link),
      circleColor: choroOutput.colorPallete.circleColorsMap.get(closestDifferent.track_link),
      coors: [closestDifferent.longitude,closestDifferent.latitude],
      track_name: closestDifferent.track_name
    },
    'all-dots': {
      text: `The most popular song, by city`,
      labelColor: null,
      circleColor: null,
      coors: [closestLocation.longitude,closestLocation.latitude],
      track_name: null
    },
    'non-mono': {
      text: `The most popular song, by city`,
      labelColor: null,
      circleColor: null,
      coors: [+nonMonoCenter.longitude,+nonMonoCenter.latitude],
      track_name: null,
      zoom_level: 7
    },
    'international-border': {
      text: `The most popular song, by city`,
      labelColor: null,
      circleColor: null,
      coors: [+closestCountry.longitude,+closestCountry.latitude],
      track_name: null,
      zoom_level: 8
    },
    'international-hex': {
      text: `The ${uniqueSongs.length} different #1 songs in the world, by location`,
      labelColor: null,
      circleColor: null,
      coors: null,
      track_name: null
    },
    "sister-cities": {
      text: `The ${uniqueSongs.length} different #1 songs in the world, by location`,
      labelColor: null,
      circleColor: null,
      coors: null,
      track_name: null,
      zoom_level: 8
    },
    "bubble-hit": {
      text: `The ${uniqueSongs.length} different #1 songs in the world, by location`,
      labelColor: choroOutput.colorPallete.labelColorsMap.get(bubbleHit),
      circleColor: choroOutput.colorPallete.circleColorsMap.get(bubbleHit),
      coors: null,
      track_name: bubbleHitTrackInfo.track_name
    },
    "bubble-diff-hex": {
      text: `The ${uniqueSongs.length} different #1 songs in the world, by location`,
      labelColor: null,
      circleColor: null,
      coors: [+bubbleDiffHexCenter.longitude,+bubbleDiffHexCenter.latitude],
      track_name: null,
      zoom_level: 7
    },
    "bubble-diff-country": {
      text: `The ${uniqueSongs.length} different #1 songs in the world, by location`,
      labelColor: null,
      circleColor: null,
      coors: null,
      track_name: null
    }
  }

  if(sisterGeo){
    labelCrosswalk["sister-cities"] = {
      text: `The ${uniqueSongs.length} different #1 songs in the world, by location`,
      labelColor: null,
      circleColor: null,
      coors: [sisterGeo.longitude,sisterGeo.latitude],
      track_name: null,
      zoom_level: 8
    }
  }

  let adjust = d3.scaleLinear().domain([0,1]).range([0,50]);
  // let height = fixedMap.node().offsetHeight


 // setup the instance, pass callback functions
  scroller
    .setup({
      step: ".step",
      progress: true,
      offset: 1,
      order: false
    })
    .onStepProgress((response) => {
      // let offset = -height/2 + -(Math.round(adjust(response.progress)))
      chartTitle.style("transform",`translate(0,${-(Math.round(adjust(response.progress)))}px)`);
      // fixedMap.style("transform",`translate3d(0,${offset}px,0)`);
      
      //fixedMap.style("transform",`translate3d(0,calc(-50% + ${-(Math.round(adjust(response.progress)))}px),0)`);
    })
    .onStepEnter((response) => {

      player.onClose();

      let geo = d3.select(response.element).attr("data-geo");
      if(flyToTimeout){
        clearTimeout(flyToTimeout);
      }

      if(["location-closest","location-diff"].indexOf(geo) > -1){
        
        d3.selectAll(".chart-title").select(".chart-hed").select("span").style("color",labelCrosswalk[geo].labelColor).html(labelCrosswalk[geo].text)
        generateMap.easeTo(labelCrosswalk[geo].coors,7,2000)

        generateMap.filterForSpecific(labelCrosswalk[geo].track_name,labelCrosswalk[geo].circleColor,labelCrosswalk[geo].labelColor)

      }
      else if (geo == 'all-dots'){
        generateMap.removeFilters(choroOutput.colorPallete);
        d3.selectAll(".chart-title").select(".chart-hed").select("span").style("color","#333").html(labelCrosswalk[geo].text)
        generateMap.easeTo(labelCrosswalk[geo].coors,7,2000)
      }

      else if (["non-mono","international-border","bubble-diff-hex"].indexOf(geo) > -1){
        generateMap.removeFilters(choroOutput.colorPallete);
        d3.selectAll(".chart-title").select(".chart-hed").select("span").style("color","#333").html(labelCrosswalk[geo].text)

        
        generateMap.showLayer('country-line')

        if(response.direction == "down"){
          generateMap.easeTo(labelCrosswalk[geo].coors,2,1000)

          mapCreated.once("moveend",function(d){
            generateMap.easeTo(labelCrosswalk[geo].coors,labelCrosswalk[geo].zoom_level,4000)
          })

          // flyToTimeout = window.setTimeout(function(d){
          //   //generateMap.flyTo(labelCrosswalk[geo].coors,8,.8)
          //   generateMap.easeTo(labelCrosswalk[geo].coors,8,2000)
          // },2000)
        }
        else {
          generateMap.jumpTo(labelCrosswalk[geo].coors,8)
        }        
      }

      else if (geo == "international-hex"){
        // generateMap.hideLayer('dots')
        mapCreated.fitBounds([
          [-129.550781,-38.548165],
          [151.347656,51.508742]
        ], { duration: 3000 });
        // generateMap.jumpTo([closestLocation.longitude,closestLocation.latitude],2)
        if(!hexLayerAdded){
          generateMap.addHexLayer();
          hexLayerAdded = true;
        }
        else {
          generateMap.showLayer('heatmap')
        }
      }

      else if (geo == 'sister-cities'){
        if(sisterGeo){

          generateMap.removeFilters(choroOutput.colorPallete);
          generateMap.unfilterHex(data[0])

          console.log(sisterGeo);


          if(sisterGeo["geography"] == "country"){

            let bbox = countryCodeToBounding.get(sisterGeo.country_code).split(",").map(d => +d.trim());

            mapCreated.fitBounds([[bbox[0],bbox[1]],[bbox[2],bbox[3]]]);
          }
          else {


            generateMap.easeTo(labelCrosswalk[geo].coors,2,1000)

            mapCreated.once("moveend",function(d){
              generateMap.easeTo(labelCrosswalk[geo].coors,labelCrosswalk[geo].zoom_level,4000)
            })

          }
        }
      }

      else if (geo == 'bubble-hit'){
        
        mapCreated.fitBounds([
          [-129.550781,-38.548165],
          [151.347656,51.508742]
        ], { duration: 0 });

        let filteredData = data[0].filter(d => d.track_link == bubbleHit);

        let hexColor = d3.color(labelCrosswalk[geo].circleColor);

        if(hexLayerAdded){
          generateMap.showLayer('heatmap')
          generateMap.filterHex(filteredData,[hexColor.r,hexColor.g,hexColor.b]);
        }
        else {
          generateMap.addHexLayer();
          hexLayerAdded = true;

          generateMap.filterHex(filteredData, [hexColor.r,hexColor.g,hexColor.b]);
        }

        generateMap.filterForSpecific(labelCrosswalk[geo].track_name,labelCrosswalk[geo].circleColor,labelCrosswalk[geo].labelColor)
        
      }
      else if (geo == 'bubble-diff-country'){

        generateMap.removeFilters(choroOutput.colorPallete);
        generateMap.unfilterHex(data[0])

        let bbox = bubbleDiffCountryBbox.split(",").map(d => +d.trim());

        mapCreated.fitBounds([[bbox[0],bbox[1]],[bbox[2],bbox[3]]], {
          padding: {top: 25, bottom:25, left: 25, right: 25}
        });
          
      }


      if(geo != 'international-border'){
        generateMap.hideLayer('country-line')
      }

      if(['international-hex','bubble-hit'].indexOf(geo) == -1){
        if(hexLayerAdded){
          generateMap.hideLayer('heatmap')
        }
        
      }


    })
    .onStepExit((response) => {
      player.onClose();
    });



    footer.init();

}

init();
