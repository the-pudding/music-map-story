
let $player = null;
let $iframe = null;

function playVideo(id) {

    $player
        .classed('is-visible', true)
        .transition()
        .duration(300)
        .style('width', `300px`)
        .on('end', () => {
            $iframe.attr('src', `https://www.youtube.com/embed/${id}`);
        });
}

function init(){

    $player = d3.select(".player")

    $iframe = $player.append('iframe');
    
    $player
        .append('button')
        .attr('class', 'close')
        .html('&#10006;')
        .on('click', onClose);
}

function onClose() {
    $player.classed('is-visible', false);
    $player.select('iframe').attr('src', '');
}

export default { init, playVideo, onClose }