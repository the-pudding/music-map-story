
let $player = null;
let $iframe = null;

function playVideo(id) {

    $player
        .classed('is-visible', true)
        .transition()
        .duration(300)
        .style('width', function(){
            if(d3.select("body").classed("is-mobile")){
                return "100%";
            }
            return "300px"
        })
        .style('height', `200px`)
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
        .html("<svg viewBox='0 0 43.5 43.5' xmlns='http://www.w3.org/2000/svg'> <path fill='%23333333' d='M24.941,21.774l4.012-3.952c0.886-0.874,0.896-2.305,0.023-3.191c-0.423-0.429-0.988-0.668-1.592-0.673 c-0.005,0-0.011,0-0.017,0c-0.597,0-1.159,0.23-1.584,0.649l-4.01,3.952l-3.952-4.011c-0.423-0.429-0.988-0.668-1.592-0.673  c-0.005,0-0.011,0-0.017,0c-0.597,0-1.159,0.23-1.584,0.649c-0.886,0.874-0.896,2.305-0.022,3.191l3.951,4.011l-4.012,3.952  c-0.886,0.874-0.896,2.305-0.023,3.191c0.423,0.429,0.987,0.668,1.591,0.673c0.631,0.022,1.171-0.226,1.602-0.649l4.01-3.952  l3.952,4.011c0.423,0.429,0.988,0.668,1.591,0.673c0.006,0,0.012,0,0.018,0c0.598,0,1.159-0.23,1.582-0.648  c0.431-0.423,0.67-0.988,0.674-1.591c0.005-0.603-0.226-1.172-0.649-1.601L24.941,21.774z'/> </svg>")
        .on('click', onClose);
}

function onClose() {
    $player.classed('is-visible', false);
    $player.select('iframe').attr('src', '');
}

export default { init, playVideo, onClose }