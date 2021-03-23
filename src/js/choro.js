



function init(data){

  let geo_info = data[3];
  let track_data = data[2];
  let country_data = data[1];
  let city_data = data[0];

  let colorPallete = {};
  let filters = {};

  var colorsManual = [
 
    // "#213E9A",
    // "#461FA9",
    // "#9B1BBA",
    // "#CA168E",
    // "#DA102C",
    // "#E95E08",
    // "#F9E200"
    // //
    //
    "#7994b5",
    "#6c6d94",
    "#93b778",
    "#d17c3f",
    "#711518",
    "#7a4b3a",
    "#b63e36",
    "#dfa837",
    "#be7249",
    "#864735",
    "#433635",
    "#33431e",
    
    "#bfbac0",
    "#281f3f",
    "#584c77",
    "#513e32",
    
    "#b8bfaf",
    "#ab924b",
    "#252024",
    "#bebeb3",
    "#cd6d57",
    "#61ac86",
    "#5c6b8f",
    "#766051",
    
    "#5d6161",
    "#39334a",
    
    "#77747f",
    "#7a4848",
    "#979c84",
    "#a75536",
    "#383867",
    
    "#555152",
    "#657abb",
    "#b2b599",
    
    
    "#3f3033",
    "#423937",
    
    "#553d3a",
    "#533552",
    "#454445",
    "#ab9649",
    "#b7757c",
    "#b5493a",
    
    "#e9c49d",
    "#ce536b",
    
    "#4d3635",
    "#4f638d",
    "#a36629",
    "#1c1949",
    "#a77d35",
    "#6e3b31",
    "#67765b",
    "#453b32",
    "#612741",
    "#9c9d9a",
    "#adba98",
    "#4a475c",
    "#92462f",
    "#413f44",
    "#8590ae",
    "#3a2f52",
    "#946943",
    "#463759",
    "#613936",
    "#5b5c61",
    "#719ba2",
    "#b74a70",
    "#7d8c55",
    "#a4b6a7",
    "#c76b4a",
    "#6f88af",
    "#6fb5a8",
    "#8aa1a6",
    "#bfbbb0",
    "#8a8d84",
    "#8e9849",
    "#bb603c"


//     "#12939A",
// "#DDB27C",
// "#88572C",
// "#FF991F",
// "#F15C17",
// "#223F9A",
// "#DA70BF",
// "#125C77",
// "#4DC19C",
// "#776E57",
// "#17B8BE",
// "#F6D18A",
// "#B7885E",
// "#FFCB99",
// "#F89570",
// "#829AE3",
// "#E79FD5",
// "#1E96BE",
// "#89DAC1",
// "#B3AD9E"

    // "rgb(1, 126, 35)",
    // "rgb(127, 1, 1)",
    // "#020c55",
    // '#380255',
    // '#550241',
    // '#024f55',
    // '#475502',
    // '#552b02',
    // "#ff7f0e",
    // "#9467bd",
    // "#98df8a",
    // "#1f77b4",
    // "#9edae5",
    // "#f7b6d2",
    // "#c5b0d5",
    // "#d62728",
    // "#bcbd22",
    // "#ff9896",
    // "#dbdb8d",
    // "#ffbb78",
    // "#2ca02c",
    // "#e377c2",
    // "#c49c94",
    // "#17becf",
    // "#8c564b",
    // "#aec7e8"
  ];

  colorsManual = colorsManual.map(function(d){
    return {label:d,fill:d};
  });


//
  let topSongs = d3.rollups(data[0], v => {
    return d3.sum(v, d => +d.views);
  }, d => d.track_link)
  .sort(([, a], [, b]) => d3.descending(a, b))

  topSongs = topSongs.map(([key]) => key)



  colorPallete.topSongs = topSongs;

  colorPallete.deckGlColors = colorsManual.map(function(d){
    let color = d3.color(d.label);
    return [color.r,color.g,color.b];
  })

  colorPallete.mapboxColors = colorsManual.map(function(d){
    return d.label;
  })

  colorPallete.circleColors = topSongs.map(function(d,i){
    return [d,d3.color(colorPallete.mapboxColors[i % colorPallete.mapboxColors.length]).toString()];
  })

  colorPallete.labelColors = topSongs.map(function(d,i){

    let color = colorPallete.mapboxColors[i % colorPallete.mapboxColors.length];
    if(d3.hsl(color).l > .4){
      color = d3.color(color).darker();
      if(d3.hsl(color).l > .4){
        color = d3.color(color).darker();
        if(d3.hsl(color).l > .4){
          color = d3.color(color).darker();
        }
      }

      // color = d3.hsl(color)
      // color.l = .5;
      // color = color.rgb();
    }
    else {
      color = d3.color(color);
    }

    return [d,color.toString()];
  })

  colorPallete.circleColorsMap = new Map(colorPallete.circleColors);
  colorPallete.labelColorsMap = new Map(colorPallete.labelColors);


  // colorPallete.circleColors = colorsManual.map(function(d,i){
  //   return [topSongs[i],d3.color(d.fill).toString()]
  // })
  //
  // colorPallete.labelColors = colorsManual.map(function(d,i){
  //   // return [topSongs[i],d3.color(d.fill).toString()]
  //   return [topSongs[i],d3.color(d.fill).darker(.1).toString()]
  // })

  var colorSliceAmount = colorPallete.labelColors.length;

  var otherScale = d3.scaleLinear().domain([colorSliceAmount,topSongs.length-1]).range(["#929292","#f6f6f4"]);
//
  var colorEasingFill = .5
  var colorEasingLine = .5
  var colorEasingFillScale = d3.scaleLinear().domain([0,1]).range([.85,.99]);

  var matchExpression = ['match', ['get', 'iso_3166_1']];

  colorPallete.countryStopsFill = country_data.map(function(d){

    var color;

    let topSongIndex = topSongs.indexOf(d.track_link)
    if(topSongIndex == -1){
      return [d.iso,"#333333"];
    }

    return [d.iso,colorPallete.mapboxColors[topSongIndex % colorPallete.mapboxColors.length]];

    // var color;
    // if (topSongs.slice(0,colorSliceAmount).indexOf(d.track_link) > -1){
    //   color = colorsManual[topSongs.slice(0,colorSliceAmount).indexOf(d.track_link)]["fill"];
    // }
    // else{
    //   color = otherScale(topSongs.indexOf(d.track_link));
    // }
    // color = d3.hsl(color);
    // color.l = colorEasingFillScale(color.l);
    // color = color.toString()
  
    // matchExpression.push(d.iso,color);
    // let blending = d3.interpolateRgb("#f7dbb6",color);
    // color = blending(.2);
  
    // return [d.iso,color]
  });
  //

  colorPallete.countryStopsLine = country_data.map(function(d){
    var color;

    let topSongIndex = topSongs.indexOf(d.track_link)
    if(topSongIndex == -1){
      return [d.iso,"#333333"];
    }

    return [d.iso,colorPallete.mapboxColors[topSongIndex % colorPallete.mapboxColors.length]];


    // if (topSongs.slice(0,colorSliceAmount).indexOf(d.track_link) > -1){
    //   color = colorsManual[topSongs.slice(0,colorSliceAmount).indexOf(d.track_link)]["label"];
    // }
    // else{
    //   color = otherScale(topSongs.indexOf(d.track_link));
    // }
    //


    return [d.iso,color]
  });

//   let topByAdminOne = d3.rollups(city_data, v => d3.sum(v, d => +d.views), d => d.boundaries_admin_1, d => d.track_link)
//     .map(function(d){
//       return {key:d[0],value:d[1].sort((a,b) => d3.descending(a[1], b[1]))[0]}
//     })
//     ;
//
//   filters.adminOne = ["in","id"].concat(topByAdminOne.map(function(d){return d.key;}));
//
//   let topByPostalOne = d3.rollups(city_data, v => d3.sum(v, d => +d.views), d => d.boundaries_postal_1, d => d.track_link)
//     .map(function(d){
//       return {key:d[0],value:d[1].sort((a,b) => d3.descending(a[1], b[1]))[0]}
//     })
//     ;
//
//   colorPallete.stopsAdminOneLine = topByAdminOne.map(function(d){
//     var color;
//     if (topSongs.slice(0,colorSliceAmount).indexOf(d.value[0]) > -1){
//       color = colorsManual[topSongs.slice(0,colorSliceAmount).indexOf(d.value[0])]["label"];
//     }
//     else{
//       color = otherScale(topSongs.indexOf(d.value[0]));
//     }
//     return [d.key,color]
//   });
//
//   colorPallete.stopsAdminOneFill = topByAdminOne.map(function(d){
//     var color;
//     if (topSongs.slice(0,colorSliceAmount).indexOf(d.value[0]) > -1){
//       color = colorsManual[topSongs.slice(0,colorSliceAmount).indexOf(d.value[0])]["fill"];
//     }
//     else{
//       color = otherScale(topSongs.indexOf(d.value[0]));
//     }
//     // color = d3.color(color).brighter();
//     let blending = d3.interpolateRgb("#f7dbb6",color);
//     // color.l = colorEasingFillScale(color.l);
//     color = blending(.2);
//     // color = d3.hsl(color);
//     // color.l = colorEasingFillScale(color.l);
//     color = color.toString()
//     return [d.key,color]
//   });
//
//   colorPallete.stopsAdminOneLine = topByAdminOne.map(function(d){
//     var color;
//     if (topSongs.slice(0,colorSliceAmount).indexOf(d.value[0]) > -1){
//       color = colorsManual[topSongs.slice(0,colorSliceAmount).indexOf(d.value[0])]["fill"];
//     }
//     else{
//       color = otherScale(topSongs.indexOf(d.value[0]));
//     }
//     // color = d3.color(color).brighter();
//     // color = d3.hsl(color);
//     // color.l = colorEasingFillScale(color.l);
//     let blending = d3.interpolateRgb("#f7dbb6",color);
//     // color.l = colorEasingFillScale(color.l);
//     color = blending(.2);
//
//     color = color.toString()
//     return [d.key,color]
//   });
//
//
//   colorPallete.stopsPostalOneFill = topByPostalOne.map(function(d){
//     var color;
//     if (topSongs.slice(0,colorSliceAmount).indexOf(d.value[0]) > -1){
//       color = colorsManual[topSongs.slice(0,colorSliceAmount).indexOf(d.value[0])]["fill"];
//       // color.l = colorEasingFill;
//       // color = color.toString()
//     }
//     else{
//       color = otherScale(topSongs.indexOf(d.value[0]));
//     }
//     color = d3.hsl(color);
//
//     //let blending = d3.scaleLinear().domain([0,1]).range(["#f7dbb6",color]);
//     let blending = d3.interpolateRgb("#f7dbb6",color);
//     // color.l = colorEasingFillScale(color.l);
//     color = blending(.2);
//     color = color.toString()
//     return [d.key,color]
//   });
// //
//   colorPallete.stopsPostalOneLine = topByPostalOne.map(function(d){
//     var color;
//     if (topSongs.slice(0,colorSliceAmount).indexOf(d.value[0]) > -1){
//       color = colorsManual[topSongs.slice(0,colorSliceAmount).indexOf(d.value[0])]["fill"];
//     }
//     else{
//       color = otherScale(topSongs.indexOf(d.value[0]));
//     }
//     return [d.key,color]
//   });

  return {colorPallete:colorPallete,filters:filters};

}

export default { init };
