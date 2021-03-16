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
import { csvParse } from 'd3-dsv';

let scroller = null;

const $body = d3.select('body');
let previousWidth = 0;
let flyToTimeout = null;
let hexLayerAdded = false;

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

  d3.selectAll(".chart-title").select(".chart-hed").select("span").style("color","#7f0101").html(`Where &ldquo;${closestLocation.track_name}&rdquo; by ${closestLocation.artist_name} is the most popular song`)
  d3.selectAll(".chart-title").select(".chart-dek").select("span").html(`YouTube Views Jan 15 - Feb 15, 2021`)


  

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
  let nonMono = await generateHex.generateHex(data[0],choroOutput.colorPallete,closestLocation.country_code);

  console.log(nonMono);

  let nonMonoSelected = nonMono[Math.floor(Math.random()*(nonMono.length-1))];
  console.log(nonMonoSelected);
  let nonMonoCenter = nonMonoSelected[2][0].sort(function(a,b){ return +b.views - +a.views})[0];
  console.log(nonMonoCenter);



  d3.selectAll(".non-mono-geo").text(`${nonMonoCenter.geo_name} `);


  //#1s in your country (if 4 or more)
  let countryCities = data[0].filter(d => { return closestLocation.country_code == d.country_code; });
  let countryHits = d3.rollups(countryCities, v => [v.length,v.length/countryCities.length,v], d => d.track_link)

  countryHits = countryHits.filter(d => { 
    return d[1][0] > 4 && d[1][1] > .04;
  })

  //mini multiple?
  if(countryHits.length > 2){
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
        return `Where <span style="background-color:${colorRgba};" class="song-highlight">${d[1][2][0].track_name} by ${d[1][2][0].artist_name}</span> is most popular`;
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
      track_name: null
    },
    'international-border': {
      text: `The most popular song, by city`,
      labelColor: null,
      circleColor: null,
      coors: [+closestCountry.longitude,+closestCountry.latitude],
      track_name: null
    },
    'international-hex': {
      text: `The most popular song, by city`,
      labelColor: null,
      circleColor: null,
      coors: null,
      track_name: null
    }
  }

  let adjust = d3.scaleLinear().domain([0,1]).range([0,50]);


 // setup the instance, pass callback functions
  scroller
    .setup({
      step: ".step",
      progress: true,
      offset: 1,
      order: false
    })
    .onStepProgress((response) => {
      chartTitle.style("transform",`translate(0,${-(Math.round(adjust(response.progress)))}px`);
    })
    .onStepEnter((response) => {

      let geo = d3.select(response.element).attr("data-geo");
      if(flyToTimeout){
        clearTimeout(flyToTimeout);
      }

      if(["location-closest","location-diff"].indexOf(geo) > -1){
        
        d3.selectAll(".chart-title").select(".chart-hed").select("span").style("color",labelCrosswalk[geo].labelColor).html(labelCrosswalk[geo].text)
        generateMap.flyTo(labelCrosswalk[geo].coors,7,.2)

        generateMap.filterForSpecific(labelCrosswalk[geo].track_name,labelCrosswalk[geo].circleColor,labelCrosswalk[geo].labelColor)

      }
      else if (geo == 'all-dots'){
        generateMap.removeFilters(choroOutput.colorPallete);
        d3.selectAll(".chart-title").select(".chart-hed").select("span").style("color","#333").html(labelCrosswalk[geo].text)
        generateMap.flyTo(labelCrosswalk[geo].coors,6,.2)
      }
      // else if (geo == 'non-mono'){
      //   generateMap.removeFilters(choroOutput.colorPallete);
      //   d3.selectAll(".chart-title").select(".chart-hed").select("span").style("color","#333").html(labelCrosswalk[geo].text)
      //   generateMap.easeTo(labelCrosswalk[geo].coors,8,4000)
      // }

      else if (["non-mono","international-border"].indexOf(geo) > -1){
        generateMap.removeFilters(choroOutput.colorPallete);
        d3.selectAll(".chart-title").select(".chart-hed").select("span").style("color","#333").html(labelCrosswalk[geo].text)

        
        generateMap.showLayer('country-line')

        if(response.direction == "down"){
          generateMap.jumpTo([closestLocation.longitude,closestLocation.latitude],4)

          flyToTimeout = window.setTimeout(function(d){
            generateMap.flyTo(labelCrosswalk[geo].coors,8,.8)
            //generateMap.easeTo(labelCrosswalk[geo].coors,8,4000)
          },2000)
        }
        else {
          generateMap.jumpTo(labelCrosswalk[geo].coors,8)
        }        
      }

      else if (geo == "international-hex"){

        generateMap.hideLayer('dots')
        mapCreated.fitBounds([
          [-129.550781,-38.548165],
          [151.347656,51.508742]
        ]);
        // generateMap.jumpTo([closestLocation.longitude,closestLocation.latitude],2)
        if(!hexLayerAdded){
          generateMap.addHexLayer();
          hexLayerAdded = true;
        }
        else {
          generateMap.showLayer('heatmap')
        }
      }


      if(geo != 'international-border'){
        generateMap.hideLayer('country-line')
      }

      if(geo != 'international-hex'){
        if(hexLayerAdded){
          generateMap.hideLayer('heatmap')
        }
        
      }


    })
    .onStepExit((response) => {
      // { element, index, direction }
    });







  // graphic.init();
  // // load footer stories
  // footer.init();
}

init();
