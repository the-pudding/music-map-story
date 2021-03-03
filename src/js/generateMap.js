



function init(el,center,color,filteredTrack){


  let map = new mapboxgl.Map({
      container: el,
      center:center,
      zoom: 5,
      style: 'mapbox://styles/dock4242/cklmjep7w2iiq17pc523q7h8j',
      // pitch:50,
      hash: false,
      attributionControl:false
  });

  map.on('load', function () {
    map.scrollZoom.disable();

    map.setFilter('dots', [ "all", [ "match", ["get", "track_name"], [filteredTrack], true, false ] ]);
    map.setFilter('dot-labels', [ "all", [ "match", ["get", "track_name"], [filteredTrack], true, false ] ]);
    //

    map.setPaintProperty('dots', 'circle-stroke-color',color);
    map.setPaintProperty('dots', 'circle-color',color);
    map.setPaintProperty('dot-labels', 'text-color',color);

    map.setLayoutProperty('dots', 'visibility', 'visible');
    map.setLayoutProperty('dot-labels', 'visibility', 'visible');
  })
}

function fullMap(el,center,data){
  let map = new mapboxgl.Map({
      container: el,
      center:center,
      zoom: 3,
      style: 'mapbox://styles/dock4242/cklmjep7w2iiq17pc523q7h8j',
      // pitch:50,
      hash: false,
      attributionControl:false
  });

  var colorsManual = [{
    line:"red",
    fill:"rgb(20,255,56)",
    label:"rgb(45,98,53)" //green gucci
    },
    {
      line:"red",
      fill:"rgb(130,20,255)",
      label:"rgb(88,29,154)" //purple criminal
    },
    {
      line:"red",
      fill:"rgb(0,34,255)",
      label:"rgb(57,113,154)" //blue perfect
    },
    {
      line:"red",
      fill:"rgb(255,0,0)",
      label:"rgb(143,10,10)" //red havavna
    },
    {
      line:"red",
      fill:"rgb(255,153,20)",
      label:"rgb(236,135,4)" //orange gummo
    },
    {
      line:"red",
      fill:"rgb(255,20,196)",
      label:"rgb(193,31,153)" //pink panama
    },
    {
      line:"red",
      fill:"rgb(255,192,20)",
      label:"rgb(170,131,24)" //brown (peeka boo)
    },
    {
      line:"red",
      fill:"rgb(179,19,190)",
      label:"rgb(171,17,182)" //fushia (mwaka)
    },
    {
      line:"red",
      fill:"rgb(255,235,20)",
      label:"rgb(171,17,182)" //yellow //muchas
    }
  ];
  var colorsNew = [
    "#ff7f0e",
    "#9467bd",
    "#98df8a",
    "#1f77b4",
    "#9edae5",
    "#f7b6d2",
    "#c5b0d5",
    "#d62728",
    "#bcbd22",
    "#ff9896",
    "#dbdb8d",
    "#ffbb78",
    "#2ca02c",
    "#e377c2",
    "#c49c94",
    "#17becf",
    "#8c564b",
    "#aec7e8"
  ];

  colorsManual = colorsNew.map(function(d){
    return {label:d,fill:d};
  });

  // var topSongs = d3.nest().key(function(d){
  //     return d.track_name;
  //   })
  //   .rollup(function(leaves){
  //     return leaves.length;
  //   })
  //   .entries(data)
  //   .sort(function(a,b){
  //     return b.value - a.value;
  //   })
  //   ;

  let topSongs = d3.rollups(data, v => v.length, d => d.track_name)
    .sort(([, a], [, b]) => d3.descending(a, b))
    .map(([key]) => key)

  var circleColors = colorsManual.map(function(d,i){
    return [topSongs[i],d3.color(d.fill).darker().toString()]
  })

  var labelColors = colorsManual.map(function(d,i){
    return [topSongs[i],d3.color(d.fill).darker(2).toString()]
  })

  map.on('load', function () {
    map.scrollZoom.disable();

    map.setPaintProperty('dots', 'circle-color', {"base":"rgb(29,27,27)","stops":circleColors,"type":"categorical","property":"track_name","base":1,"default":"rgb(29,27,27)"});
    map.setPaintProperty('dots', 'circle-stroke-color', {"base":"rgb(29,27,27)","stops":circleColors,"type":"categorical","property":"track_name","base":1,"default":"rgb(29,27,27)"});
    map.setLayoutProperty('dot-labels', 'text-field', [ "to-string", ["get", "track_name"] ]);
    map.setPaintProperty('dot-labels', 'text-color', {"base":"rgb(29,27,27)","stops":labelColors,"type":"categorical","property":"track_name","base":1,"default":"rgb(29,27,27)"});



    map.setLayoutProperty('dots', 'visibility', 'visible');
    map.setLayoutProperty('dot-labels', 'visibility', 'visible');
  })


  //

}

export default { init, fullMap };
