function startGeolocation() {
  var options;

  navigator.geolocation.getCurrentPosition(geoSuccess, geoFail, options);
}

// geolocation success callback
function geoSuccess(position) {
  var gpsPosition = position;
  var coordinates = gpsPosition.coords;
  myLat = coordinates.latitude;
  myLong = coordinates.longitude;
    
  bb.pushScreen('google.html', 'google');
}

// geolocation failure callback
function geoFail() {
  alert('Error getting your position. Using defaults instead');

  // set default position upon failure
  myLat = 45.348477;
  myLong = -75.754874;
  bb.pushScreen('google.html', 'google');
}

function initGoogleMaps() {


  myLocation = new google.maps.LatLng(myLat, myLong);

  

  var mapOptions = {
    zoom: 14,
    center: myLocation,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    zoomControl: false,
    mapTypeControl: false,
    streetViewControl: false

  };

  
  googleMap = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

  var home = new google.maps.Marker({
    map: googleMap,
    position: myLocation
  });

}

// search for nearby places
function initGooglePlaces( value ) {

  var request = {
    location: myLocation,
    radius: 2000,
    types: [value]
  };

  var service = new google.maps.places.PlacesService(googleMap);
  service.search(request, function(results) {
    
    for(var i = 0; i < results.length; i++) {
      var marker = new google.maps.Marker({
        map: googleMap,
        position: results[i].geometry.location
        
      });
    }  
  });
  return;
}
