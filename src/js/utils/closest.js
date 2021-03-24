function Deg2Rad( deg ) {
  return deg * Math.PI / 180;
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = Deg2Rad(lat2-lat1);  // deg2rad below
  var dLon = Deg2Rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(Deg2Rad(lat1)) * Math.cos(Deg2Rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function PythagorasEquirectangular( lat1, lon1, lat2, lon2 ) {
  lat1 = Deg2Rad(lat1);
  lat2 = Deg2Rad(lat2);
  lon1 = Deg2Rad(lon1);
  lon2 = Deg2Rad(lon2);
  var R = 6371; // km
  var x = (lon2-lon1) * Math.cos((lat1+lat2)/2);
  var y = (lat2-lat1);
  var d = Math.sqrt(x*x + y*y) * R;
  return d;
}

function NearestCity(latitude, longitude, locations) {
  var mindif=99999;
  var closest;

  for (let index = 0; index < locations.length; ++index) {
    var dif =  PythagorasEquirectangular(latitude, longitude, locations[ index ][ 1 ], locations[ index ][ 2 ]);
    if ( dif < mindif ) {
      closest=index;
      mindif = dif;
    }
  }
  // return the nearest location
  var closestLocation = (locations[ closest ]);
  return closestLocation[0];
}

function withinDistance(latitude, longitude, locations) {
  var mindif=99999;


  let matches = [];

  for (let index = 0; index < locations.length; ++index) {
    var dif =  PythagorasEquirectangular(latitude, longitude, locations[ index ][ 1 ], locations[ index ][ 2 ]);

    if(dif < 60){
      matches.push([locations[index][0],dif]);
    }
  }
  return matches;
}




export default { NearestCity, withinDistance, PythagorasEquirectangular, getDistanceFromLatLonInKm };
