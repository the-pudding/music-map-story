const fs = require("fs")
const turf = require("turf")
const turfMeta = require("@turf/meta")
const simpleStats = require("simple-statistics")
const fetch = require('node-fetch');
const d3 = require("d3")





async function init(){
// load our data


  fs.readFile("city_data.csv", "utf8", function(error, output) {
    let data = d3.csvParse(output);

    const bbox = [ -171.791110603, 18.91619, -66.96466, 71.3577635769 ]
    // // size in kilometers we want each side of our hex grids
    const cellSize = 100
    //
    // // create the hexbin geometry for the given bbox and cell resolution
    const hexGrid = turf.hexGrid(bbox, cellSize)

    let points = [];

    for (let row in data){
      let point = turf.point([data[row].longitude,data[row].latitude], {data:data[row]})
      points.push(point);
    }

    var pointFC = turf.featureCollection(points);

    // // perform a "spatial join" on our hexGrid geometry and our crashes point data
    const collected = turf.collect(hexGrid, pointFC, "data", "values")


    // get rid of polygons with no joined data, to reduce our final output file size
    collected.features = collected.features.filter(d => d.properties.values.length)

    // console.log(collected.features[1].properties.values);

    // console.log(collected.features[1]);

    turfMeta.propEach(collected, props => {

      let topSong = d3.rollups(props.values, v => d3.sum(v, d => +d.views), d => d.track_name)

      props.song = d3.greatest(topSong, d => d[1])[0];
    })

    const reduced = turfMeta.featureReduce(collected, (acc, cur) => {
      acc.push(cur.properties.song)
      return acc
    }, [])

    turfMeta.propEach(collected, props => {
      delete props.values
    })

    fs.writeFileSync("./processed.json", JSON.stringify(collected))


  });






  //


  // // count the number of crashes per hexbin
  // turfMeta.propEach(collected, props => {
  //   props.count = props.values.reduce((acc, cur) => acc += 1, 0)
  // })
  //
  // // reduce our count values to a new array of numbers
  // const reduced = turfMeta.featureReduce(collected, (acc, cur) => {
  //   acc.push(cur.properties.count)
  //   return acc
  // }, [])
  //
  // // compute the ckMeans binning for data into 7 classes from reduced values
  // const ck = simpleStats.ckmeans(reduced, 7)
  //
  // // tack on the bin number to our data, as well as its min and max values
  // turfMeta.propEach(collected, props => {
  //   ck.forEach((bin, index) => {
  //     if (bin.indexOf(props.count) > -1) {
  //       props.bin = index
  //       props.binVal = d3.extent(bin)
  //     }
  //   })
  // })
  //
  // // remove the "values" property from our hexBins as it's no longer needed
  // turfMeta.propEach(collected, props => {
  //   delete props.values
  // })
  //
  // // write output data
  // fs.writeFileSync("./processed.json", JSON.stringify(collected))
}

init();


function loadFile(file) {

  console.log(file);

  // return new Promise((resolve, reject) => {
  //   const ext = file.split('.').pop();
  //   if (ext === 'csv')
  //     d3.csv(`assets/data/${file}`)
  //       .then(resolve)
  //       .catch(reject);
  //   else if (ext === 'json')
  //     d3.json(`assets/data/${file}`)
  //       .then(resolve)
  //       .catch(reject);
  //   else reject(new Error(`unsupported file type for: ${file}`));
  // });
}
