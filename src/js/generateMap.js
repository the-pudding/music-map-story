

import {HexagonLayer} from '@deck.gl/aggregation-layers';
import {MapboxLayer} from '@deck.gl/mapbox';
import player from './player.js'


let map = null;
let hexagonLayer = null;
let COLOR_RANGE = null;

function showLayer(layer){
  map.setLayoutProperty(layer, 'visibility', 'visible');
}

function hideLayer(layer){
  map.setLayoutProperty(layer, 'visibility', 'none');
}

function removeFilters(colorPallete){
  map.setFilter('dots', null);

  map.setFilter('admin-0-fill', null);
  map.setFilter('admin-0-lines', null);

  map.setPaintProperty('dots', 'circle-color', {"base":"rgb(29,27,27)","stops":colorPallete.circleColors,"type":"categorical","property":"track_link","base":1,"default":"rgb(29,27,27)"});
  map.setPaintProperty('dots', 'circle-stroke-color', {"base":"rgb(29,27,27)","stops":colorPallete.circleColors,"type":"categorical","property":"track_link","base":1,"default":"rgb(29,27,27)"});
  map.setPaintProperty('dots', 'circle-stroke-color', {"base":"rgb(29,27,27)","stops":colorPallete.circleColors,"type":"categorical","property":"track_link","base":1,"default":"rgb(29,27,27)"});

  let textLayers = ["song-country-label","song-major-label","song-medium-label","song-minor-label"];
  map.setFilter("song-major-label", [ ">", ["get", "views"], 1000000 ]);
  map.setFilter("song-medium-label", [ "all", [ "<=", ["get", "views"], 1000000 ], [ ">=", ["get", "views"], 50000 ] ]);
  map.setFilter("song-minor-label", ["<", ["get", "views"], 50000]);
  map.setFilter("song-country-label", null);



  for (let layer in textLayers){
    map.setLayoutProperty(textLayers[layer], 'text-field', [ "to-string", ["get", "track_name"] ]);


    // map.setPaintProperty(textLayers[layer], 'text-color', ["case", // Begin case expression
    //   ["==", ["feature-state", "fillColor"], null], // If state.cases == null,
    //   "yellow", // ...then color the polygon grey.
    //   ["==", ["feature-state", "fillColor"], 0], // If state.cases == 0,
    //   "red","blue"]) // ...then also color the polygon grey.);

    map.setPaintProperty(textLayers[layer], 'text-color', {"base":"rgb(29,27,27)","stops":colorPallete.labelColors,"type":"categorical","property":"track_link","base":1,"default":"rgb(29,27,27)"});
    // map.setPaintProperty(textLayers[layer], 'text-halo-color', "#FFFFFF");
    map.setLayoutProperty(textLayers[layer], 'visibility', 'visible');
  }

  let labelLayers = ['settlement-major-label','settlement-minor-label','settlement-subdivision-label']

  for (let layer in labelLayers){
    map.setLayoutProperty(labelLayers[layer], 'visibility', 'none');
  }


  map.setLayoutProperty('dots', 'visibility', 'visible');


}

function jumpTo(coors,zoom){
  map.jumpTo({
    center: coors,
    zoom: zoom
  })
};

function addHexLayer(){
  console.log("adding hex layer");
  if(hexagonLayer){
    map.addLayer(hexagonLayer,"dots");
    map.setLayerZoomRange('heatmap', 0, 6);
    map.resize()

    if(d3.select("body").classed("is-mobile")){
      map.dragPan.disable();
      map.dragRotate.disable();
      map.scrollZoom.disable();
      map.boxZoom.disable();
      map.doubleClickZoom.disable();
      map.touchZoomRotate.disable();
      map.touchPitch.disable();
    }

  }

}

function easeTo(coors,zoom,duration){
  map.easeTo({
    center: coors,
    zoom: zoom,
    duration:duration
  })
}

function flyTo(coors,zoom,speed){
  map.flyTo({
    center: coors,
    zoom: zoom,
    bearing: 0,
    speed: speed, // make the flying slow
    curve: 1, // change the speed at which it zooms out
    easing: function (t) {
      return t;
    },
    essential: true
  });
}


function filterForSpecific(filteredTrack,circleColor,labelColor){
  map.setFilter('dots', [ "all", [ "match", ["get", "track_name"], [filteredTrack], true, false ] ]);
  map.setPaintProperty('dots', 'circle-stroke-color',circleColor);
  map.setPaintProperty('dots', 'circle-color',circleColor);
  map.setLayoutProperty('dots', 'visibility', 'visible');
  map.setFilter('admin-0-fill', [ "all", [ "match", ["get", "track_name"], [filteredTrack], true, false ] ]);
  map.setFilter('admin-0-lines', [ "all", [ "match", ["get", "track_name"], [filteredTrack], true, false ] ]);





  let textLayers = ["song-country-label","song-major-label","song-medium-label","song-minor-label"];
  for (let layer in textLayers){

    map.setFilter(textLayers[layer], [ "all", [ "match", ["get", "track_name"], [filteredTrack], true, false ] ]);

    // map.setLayoutProperty(textLayers[layer], 'text-field', [
    //   'format',
    //   ['get', 'track_name'],
    //   { 'font-scale': 1 },
    //   '\n',
    //   {},
    //   ['get', 'geo_name'],
    //   {
    //     'font-scale': 0.75,
    //     'text-font': ['literal', ['Roboto Mono Regular', 'Rubik Black']],
    //   },
    // ]);

    map.setLayoutProperty(textLayers[layer], 'text-field', [ "to-string", ["get", "track_name"] ]);
    map.setPaintProperty(textLayers[layer], 'text-color',labelColor);

    // map.setPaintProperty(textLayers[layer], 'text-halo-color', "#FFFFFF");
    map.setLayoutProperty(textLayers[layer], 'visibility', 'visible');
  }

  let labelLayers = ['settlement-major-label','settlement-minor-label','settlement-subdivision-label']

  for (let layer in labelLayers){
    map.setLayoutProperty(labelLayers[layer], 'visibility', 'visible');
  }

  map.setLayoutProperty('dots', 'visibility', 'visible');




}


function init(el,center,color,filteredTrack){


  map = new mapboxgl.Map({
      container: el,
      center:center,
      zoom: 5,
      style: 'mapbox://styles/dock4242/ckmyaewuc1mpa17ps87tjovv5',
      // pitch:50,
      hash: false,
      attributionControl:false
  });

  map.on('load', function () {
    map.scrollZoom.disable();

    map.setFilter('dots', [ "all", [ "match", ["get", "track_name"], [filteredTrack], true, false ] ]);
    // map.setFilter('dot-labels', [ "all", [ "match", ["get", "track_name"], [filteredTrack], true, false ] ]);
    //

    map.setPaintProperty('dots', 'circle-stroke-color',color);
    map.setPaintProperty('dots', 'circle-color',color);
    // map.setPaintProperty('dot-labels', 'text-color',color);

    map.setLayoutProperty('dots', 'visibility', 'visible');
    // map.setLayoutProperty('dot-labels', 'visibility', 'visible');
  })
}

function makeFullScreen(){
  d3.select(".fixed-map").classed("full-screen",true);
  map.resize();
  map.scrollZoom.enable();
  map.dragPan.enable();
  if(d3.select("body").classed("is-mobile")){
    map.dragPan.enable();
    map.dragRotate.enable();
    map.scrollZoom.enable();
    map.boxZoom.enable();
    map.doubleClickZoom.enable();
    map.touchZoomRotate.enable();
    map.touchPitch.enable();
  }
}

function removeFullScreen(){
  d3.select(".fixed-map").classed("full-screen",false);
  map.scrollZoom.disable();
  map.dragPan.disable();
  if(d3.select("body").classed("is-mobile")){
    map.dragPan.disable();
    map.dragRotate.disable();
    map.scrollZoom.disable();
    map.boxZoom.disable();
    map.doubleClickZoom.disable();
    map.touchZoomRotate.disable();
    map.touchPitch.disable();
  }
  map.resize();
}

function filterHex(data,color){
  if(hexagonLayer){

    console.log("changing props");

    hexagonLayer.setProps({
      colorRange: [color],
      data: data
    });

  }
}

function unfilterHex(data){
  if(hexagonLayer){

    hexagonLayer.setProps({
      colorRange: COLOR_RANGE,
      data: data
    });

  }
}


function fullMap(el,center,data,filteredTrack,colorPallete,filters,zoomLevel){

  return new Promise((resolve, reject) => {

    map = new mapboxgl.Map({
        container: el,
        center:center,
        zoom: zoomLevel,
        style: 'mapbox://styles/dock4242/ckmyaewuc1mpa17ps87tjovv5',
        hash: false,
        attributionControl:false
    });

    map.on('load', function () {
      map.addControl(new mapboxgl.AttributionControl(), 'bottom-right');

      var OPTIONS = ['radius', 'coverage', 'upperPercentile'];

      COLOR_RANGE = colorPallete.deckGlColors;
      // COLOR_RANGE.unshift([255,255,255]);

      console.log("creating hex layer");

      hexagonLayer = new MapboxLayer({
        type: HexagonLayer,
        id: 'heatmap',
        data: data,
        radius: 150*1000,
        coverage: .8,
        upperPercentile: 100,
        colorRange: COLOR_RANGE,
        extruded: false,
        getPosition: d => [Number(d.longitude), Number(d.latitude)],
        opacity: 1,
        getColorValue: points => {

          let topSong = d3.rollups(points, v => d3.sum(v, d => +d.views), d => d.track_link)

          topSong = d3.greatest(topSong, d => d[1])[0];

          let topSongIndex = colorPallete.topSongs.indexOf(topSong);

          return topSongIndex  % colorPallete.deckGlColors.length;

        }

      });

      map.scrollZoom.disable();
      if(d3.select("body").classed("is-mobile")){
        map.dragPan.disable();

      }

      map.addControl(new mapboxgl.NavigationControl());

      // map.setPaintProperty('dots', 'circle-color', {"base":"rgb(29,27,27)","stops":colorPallete.circleColors,"type":"categorical","property":"track_link","base":1,"default":"rgb(29,27,27)"});
      // map.setPaintProperty('dots', 'circle-stroke-color', {"base":"rgb(29,27,27)","stops":colorPallete.circleColors,"type":"categorical","property":"track_link","base":1,"default":"rgb(29,27,27)"});
      // map.setPaintProperty('dots', 'circle-stroke-color', {"base":"rgb(29,27,27)","stops":colorPallete.circleColors,"type":"categorical","property":"track_link","base":1,"default":"rgb(29,27,27)"});

      // let textLayers = ["song-country-label","song-major-label","song-medium-label","song-minor-label"];


      // for (let layer in textLayers){
      //   map.setLayoutProperty(textLayers[layer], 'text-field', [ "to-string", ["get", "track_name"] ]);

      //   // map.setPaintProperty(textLayers[layer], 'text-color', ["case", // Begin case expression
      //   //   ["==", ["feature-state", "fillColor"], null], // If state.cases == null,
      //   //   "yellow", // ...then color the polygon grey.
      //   //   ["==", ["feature-state", "fillColor"], 0], // If state.cases == 0,
      //   //   "red","blue"]) // ...then also color the polygon grey.);

      //   map.setPaintProperty(textLayers[layer], 'text-color', {"base":"rgb(29,27,27)","stops":colorPallete.labelColors,"type":"categorical","property":"track_link","base":1,"default":"rgb(29,27,27)"});
      //   // map.setPaintProperty(textLayers[layer], 'text-halo-color', "#FFFFFF");
      //   map.setLayoutProperty(textLayers[layer], 'visibility', 'visible');
      // }

      // map.setLayoutProperty('dots', 'visibility', 'visible');

      map.addSource("admin-0", {
        type: "vector",
        url: "mapbox://mapbox.enterprise-boundaries-a0-v1"
      });
      //
      // map.addSource("admin-1", {
      //   type: "vector",
      //   url: "mapbox://mapbox.enterprise-boundaries-a1-v1"
      // });
      //
      // map.addSource("postal-1", {
      //   type: "vector",
      //   url: "mapbox://mapbox.enterprise-boundaries-p1-v1"
      // });
      //
      map.addLayer({
        "id": "admin-0-fill",
        "type": "fill",
        "source": "admin-0",
        "maxzoom": 6,
        "source-layer": "boundaries_admin_0",
        "paint": {
            "fill-outline-color":"rgba(0,0,0,0)",
            // "default":"rgba(0,0,0,0)",
            "fill-opacity":.04,
            "fill-color": {
                "default":"rgba(0,0,0,0)",
                "property": "id",
                "type": "categorical",
                "stops": colorPallete.countryStopsFill
            }
        }
      }, 'mapbox-terrain-rgb');

      // map.addLayer({
      //   "id": "admin-1-fill",
      //   "type": "fill",
      //   "filter":filters.adminOne,
      //   "maxzoom": 15,
      //   "source": "admin-1",
      //   "source-layer": "boundaries_admin_1",
      //   "paint": {
      //       "fill-outline-color":"rgba(0,0,0,0)",
      //       "fill-opacity":1,
      //       "fill-color": {
      //           "default":"rgba(0,0,0,0)",
      //           "property": "id",
      //           "type": "categorical",
      //           "stops": colorPallete.stopsAdminOneFill
      //       }
      //   }
      // }, 'dots');
      //
      // map.addLayer({
      //   "id": "postal-1-fill",
      //   "maxzoom": 15,
      //   "type": "fill",
      //   "source": "postal-1",
      //   "source-layer": "boundaries_postal_1",
      //   "paint": {
      //       "fill-outline-color":"rgba(0,0,0,0)",
      //       // "default":"rgba(0,0,0,0)",
      //       "fill-opacity":1,
      //       "fill-color": {
      //           "default":"rgba(0,0,0,0)",
      //           "property": "id",
      //           "type": "categorical",
      //           "stops": colorPallete.stopsPostalOneFill
      //       }
      //   }
      // }, 'dots');
      //
      // map.addLayer({
      //   "id": "country-borders-bg",
      //   "type": "line",
      //   "source": "admin-0",
      //   "source-layer": "boundaries_admin_0",
      //   "paint": {
      //       "line-width": [
      //         "interpolate", ["linear"], ["zoom"],
      //         // zoom is 5 (or less) -> circle radius will be 1px
      //         2, 1,
      //         // zoom is 10 (or greater) -> circle radius will be 5px
      //         6, 8
      //       ],
      //       "line-opacity":.2,
      //       "line-blur":0,
      //       "line-color": "rgb(214,214,214)"
      //   }
      // }, 'dots');
      //
      // map.addLayer({
      //   "id": "postal-1-lines",
      //   "type": "line",
      //   "source": "postal-1",
      //   "source-layer": "boundaries_postal_1",
      //   "paint": {
      //       "line-opacity":.1,
      //       "line-blur":0,
      //       "line-width":1,
      //       "line-color": {
      //         "default":"rgba(0,0,0,0)",
      //           "property": "id",
      //           "type": "categorical",
      //           "stops": colorPallete.stopsPostalOneLine
      //       }
      //   }
      // }, 'dots');
      //
      //

      map.addLayer({
          "id": "admin-0-lines",
          "type": "line",
          "source": "admin-0",
          "source-layer": "boundaries_admin_0",
          "maxzoom": 6,
          "paint": {
              "line-opacity":1,
              "line-blur":0,
              "line-width":1,
              "line-color": {
                "default":"rgba(0,0,0,0)",
                  "property": "id",
                  "type": "categorical",
                  "stops": colorPallete.countryStopsLine
              }
          }
        }, 'mapbox-terrain-rgb');
      //
          // map.addLayer({
          //   "id": "admin-0-lines-background",
          //   "type": "line",
          //   "source": "admin-0",
          //   "filter":["in", "id", "XX"],
          //   "maxzoom": 10,
          //   "source-layer": "boundaries_admin_0",
          //   "paint": {
          //       "line-width": [
          //         "interpolate", ["linear"], ["zoom"],
          //         // zoom is 5 (or less) -> circle radius will be 1px
          //         2, 1,
          //         // zoom is 10 (or greater) -> circle radius will be 5px
          //         8, 5
          //       ],
          //       "line-opacity":.5,
          //       "line-blur":0,
          //       "line-color": "rgb(100,100,100)"
          //   }
          // }, 'dots');
      //
      // map.addLayer({
      //   "id": "admin-1-lines",
      //   "type": "line",
      //   "source": "admin-1",
      //   "source-layer": "boundaries_admin_1",
      //   "paint": {
      //       "line-blur":0,
      //       "line-width":1,
      //       "line-opacity":.2,
      //       "line-color": {
      //         "default":"rgba(0,0,0,0)",
      //           "property": "id",
      //           "type": "categorical",
      //           "stops": colorPallete.stopsAdminOneLine
      //       }
      //
      //   }
      // }, 'dots');
      //

      d3.select(".full-screen-close").on("click",function(){
        removeFullScreen();
      })

      map.on('click', function(e) {
        let features = map.queryRenderedFeatures(e.point,{ layers: ["song-country-label","song-major-label","song-medium-label","song-minor-label"] });

        let playSong = false;


        if(!d3.select("body").classed("is-mobile")){
          playSong = true;
          d3.select(".text-container").classed("map-engaged",true);
        }
        else {
          if(d3.select(".fixed-map").classed("full-screen")){
            playSong = true;
          }
          else {
            makeFullScreen();
          }
        }
        if(features.length > 0 && playSong){

          let trackData = features[0].properties;

          console.log(trackData);
          let trackLink = trackData.track_link;

          let songSelected = trackData.track_name;

          let artistSelected = trackData.artist_name;

          // map.flyTo({center: [trackData["longitude"],trackData["latitude"]]});
          // flying = true;

          // map.once("moveend",function(d){
          //   if(!mobile){
          //     playerElementWrapper.classed("player-fixed-moved",true).style("top",marker["_pos"].y+"px").style("left",marker["_pos"].x+"px");
          //   }

          //   flying = false;
          // })
          player.playVideo(trackLink)
          // }
        }
      })

      return resolve(map)

    })
  })
}

export default { makeFullScreen, init, fullMap, filterForSpecific, removeFilters, flyTo, jumpTo, easeTo, showLayer, hideLayer, addHexLayer, filterHex, unfilterHex };
