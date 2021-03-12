
function init(cities){
    let mono = false;

    console.log(cities);

    let songGroup = d3.groups(cities, d => d[0].track_name);
    return songGroup;
}

function diverseCity(cities){

}

export default { init, diverseCity };