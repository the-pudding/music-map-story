

import {HexagonLayer} from '@deck.gl/aggregation-layers';
import {MapboxLayer} from '@deck.gl/mapbox';


let map = null;
let hexagonLayer = null;

function showLayer(layer){
  map.setLayoutProperty(layer, 'visibility', 'visible');
}

function hideLayer(layer){
  map.setLayoutProperty(layer, 'visibility', 'none');
}




function removeFilters(colorPallete){
  map.setFilter('dots', null);


  map.setPaintProperty('dots', 'circle-color', {"base":"rgb(29,27,27)","stops":colorPallete.circleColors,"type":"categorical","property":"track_link","base":1,"default":"rgb(29,27,27)"});
  map.setPaintProperty('dots', 'circle-stroke-color', {"base":"rgb(29,27,27)","stops":colorPallete.circleColors,"type":"categorical","property":"track_link","base":1,"default":"rgb(29,27,27)"});
  map.setPaintProperty('dots', 'circle-stroke-color', {"base":"rgb(29,27,27)","stops":colorPallete.circleColors,"type":"categorical","property":"track_link","base":1,"default":"rgb(29,27,27)"});

  let textLayers = ["song-country-label","song-major-label","song-medium-label","song-minor-label"];


  for (let layer in textLayers){
    map.setLayoutProperty(textLayers[layer], 'text-field', [ "to-string", ["get", "track_name"] ]);
    map.setFilter(textLayers[layer], null);

    // map.setPaintProperty(textLayers[layer], 'text-color', ["case", // Begin case expression
    //   ["==", ["feature-state", "fillColor"], null], // If state.cases == null,
    //   "yellow", // ...then color the polygon grey.
    //   ["==", ["feature-state", "fillColor"], 0], // If state.cases == 0,
    //   "red","blue"]) // ...then also color the polygon grey.);

    map.setPaintProperty(textLayers[layer], 'text-color', {"base":"rgb(29,27,27)","stops":colorPallete.labelColors,"type":"categorical","property":"track_link","base":1,"default":"rgb(29,27,27)"});
    // map.setPaintProperty(textLayers[layer], 'text-halo-color', "#FFFFFF");
    map.setLayoutProperty(textLayers[layer], 'visibility', 'visible');
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
  if(hexagonLayer){
    map.addLayer(hexagonLayer,"dots");
    map.setLayerZoomRange('heatmap', 0, 6);
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
      style: 'mapbox://styles/dock4242/ckm0ti7lz0opv17rmh48pf2f5',
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





function fullMap(el,center,data,filteredTrack,colorPallete,filters,zoomLevel){

  return new Promise((resolve, reject) => {

    map = new mapboxgl.Map({
        container: el,
        center:center,
        zoom: zoomLevel,
        style: 'mapbox://styles/dock4242/ckm0ti7lz0opv17rmh48pf2f5',
        hash: false,
        attributionControl:false
    });

    map.on('load', function () {

      // console.log(map.getStyle().sources);
      // console.log(map.getStyle().layers);

      // data.forEach(function(row,i) {
      //
      //   let topSongIndex = colorPallete.topSongs.indexOf(row.track_link);
      //   let colorIndex = topSongIndex % colorPallete.topSongs.length;
      //
      //   map.setFeatureState({
      //     source: 'composite',
      //     sourceLayer: 'city_data-3og51f',
      //     id: row.geonameid
      //   }, {
      //     fillColor: 0//colorPallete.mapboxColors[colorIndex]
      //   });
      //
      // });

      var OPTIONS = ['radius', 'coverage', 'upperPercentile'];

      let COLOR_RANGE = colorPallete.deckGlColors;
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
          // if(topSongIndex > COLOR_RANGE.length - 1){
          //   return 0;
          // }
          //return topSongIndex+1;
        }
    
      });
    
      map.scrollZoom.disable();
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

      return resolve(map)

    })
  })
}

export default { init, fullMap, filterForSpecific, removeFilters, flyTo, jumpTo, easeTo, showLayer, hideLayer, addHexLayer };
