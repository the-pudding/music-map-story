import * as topojson from "topojson";

function init(data){

    const width = 500;
    const height = 400;
  
    var countriesData = topojson.feature(data, data.objects.countries).features;


    let countryData = topojson.feature(data, data.objects.countries).features.filter((d) => +d.id === 840);
    
    console.log(countryData);
    
    let projection = d3.geoMercator().fitExtent([[10, 10], [width, height]], countryData[0]);
    let path = d3.geoPath().projection(projection);


    let g = d3.select(".mini-multiple")
    .append("svg")
        .style("width",width+"px")
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('max-width', '100%')
        .style('height', 'auto')
        .attr("viewBox", [0, 0, width, height])
        .append("g")
//         // .attr("transform","translate("+((-(x0 + x1)) / 2)+","+ (-(y0 + y1) / 2)+") scale("+Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height))+")")

    g
        .selectAll("path")
        .data(countryData)
        .enter()
        .append("path")
        .attr("d", path);

}

export default { init };
