import {HexagonLayer} from '@deck.gl/aggregation-layers';
import {Deck} from '@deck.gl/core';

function generateHex(data,colorPallete,countryCode){

    return new Promise((resolve, reject) => {
  
      let permiscuousBin = null;
      var OPTIONS = ['radius', 'coverage', 'upperPercentile'];
      let COLOR_RANGE = colorPallete.deckGlColors;
  
      const deckgl = new Deck({})
  
      let hexValues = [];
  
      let hexagonLayer = new HexagonLayer({
        id: 'heatmapTwo',
        data: data,
        radius: 50*1000,
        coverage: .95,
        upperPercentile: 100,
        colorRange: COLOR_RANGE,
        extruded: false,
        getPosition: d => [Number(d.longitude), Number(d.latitude)],
        opacity: 1,
        getColorValue: points => {
  
          let topSong = d3.rollups(points, v => d3.sum(v, d => +d.views), d => d.track_link)
  
          if(topSong.length > 2){
            hexValues.push([points,topSong.length]);
          }
          
  
  
          topSong = d3.greatest(topSong, d => d[1])[0];
  
          let topSongIndex = colorPallete.topSongs.indexOf(topSong);
  
          return topSongIndex  % colorPallete.deckGlColors.length;
          // if(topSongIndex > COLOR_RANGE.length - 1){
          //   return 0;
          // }
          //return topSongIndex+1;
        },
        onSetColorDomain: event => {
          
          let inCountry = hexValues.sort(function(a,b){ return b[1] - a[1] })
            .filter(function(d){
              return d[0].map(function(d,i){return d.country_code}).indexOf(countryCode) > -1;
            })
  
          let avgCoor = inCountry.map(function(d){
            let long = d3.mean(d[0], v => v.longitude);
            let lat = d3.mean(d[0], v => v.latitude);
  
            return [long,lat,d];
          })
  
          resolve(avgCoor)
  
  
  
        }
      });
  
      deckgl.setProps({
        layers: [hexagonLayer]
      });
  
    })
  
}

export default { generateHex };