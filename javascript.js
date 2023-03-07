var map = L.map('map').setView([47.258728, -122.465973], 12);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1Ijoiam9obmthbWF1IiwiYSI6ImNsY2xmNjk4cTYzaTgzcWxrdzBtNWs2cWMifQ.FkeyGo6hi5tW9dx-GmAhHA'
}).addTo(map);

var drawnItems = L.featureGroup().addTo(map);

var tableData = L.layerGroup().addTo(map);
var url = "https://gisdb.xyz/sql?q=";
// change the Query below by replacing lab_7_name with your table name
var sqlQuery = "SELECT geom, description, name, views, accessibility, parking, Distance_Mainroad FROM scenery_table";
function addPopup(feature, layer) {
    layer.bindPopup(
        "<b>" + "Username: " + feature.properties.name + "</b><br>" +
        "Description: " + feature.properties.description + "</b><br>" +
        "Views: " + feature.properties.views + "</b><br>" +
        "ADA accessibility: " + feature.properties.accessibility + "</b><br>" +
        "Parking Spots Available: " + feature.properties.parking + "</b><br>" +
        "Distance from main roads: " + feature.properties.Distance_Mainroad + " miles" + "</b>"
    );
}


fetch(url + sqlQuery)
    .then(function(response) {
    return response.json();
    })
    .then(function(data) {
        L.geoJSON(data, {onEachFeature: addPopup}).addTo(tableData);
    });

new L.Control.Draw({
    draw : {
        polygon : true,
        polyline : true,
        rectangle : false,     // Rectangles disabled
        circle : false,        // Circles disabled
        circlemarker : false,  // Circle markers disabled
        marker: true
    },
    edit : {
        featureGroup: drawnItems
    }
}).addTo(map);

function createFormPopup() {
    var popupContent =
    '<form>' +
    'Description:<br><input type="text" id="input_desc"><br>' +
    'User\'s Name:<br><input type="text" id="input_name"><br>' +
    'Views:<br>' +
    '<select id="input_views">' +
    '<option value="City lights">City lights</option>' +
    '<option value="Water Bodies">Water Bodies</option>' +
    '<option value="Nature">Nature</option>' +
    '<option value="Hikes">Hikes</option>' +
    '<option value="Other">Other</option>' +
    '</select><br>' +
    'ADA accessibility:<br>' +
    '<input type="radio" id="input_ada_accessibility_yes" name="ada_accessibility" value="Accessible">' +
    '<label for="input_ada_accessibility_yes">Accessible</label><br>' +
    '<input type="radio" id="input_ada_accessibility_no" name="ada_accessibility" value="Not Accessible">' +
    '<label for="input_ada_accessibility_no">Not Accessible</label><br>' +
    'Parking Availability:<br>' +
    '<input type="text" id="input_parking" placeholder="Enter number of available parking spots"><br>' +
    '<small>Please enter the number of available parking spots. If there is no parking available, please enter 0.</small><br>' +
    'Distance from main roads:<br>' +
    '<input type="text" id="input_distance" placeholder="Enter distance in miles"><br>' +
    '<small>Please enter the distance in miles from the nearest main road to the location.</small><br>' +
    '<input type="button" value="Submit" id="submit">' +
    '</form>'
    drawnItems.bindPopup(popupContent).openPopup();
}

map.addEventListener("draw:created", function(e) {
    e.layer.addTo(drawnItems);
    createFormPopup();
});

function setData(e) {

    if(e.target && e.target.id == "submit") {

        // Get user name and description
        var enteredUsername = document.getElementById("input_name").value;
        var enteredDescription = document.getElementById("input_desc").value;
        var selectedViews = document.getElementById('input_views').value;
        var adaAccessibility = document.querySelector('input[name="ada_accessibility"]:checked').value;
        var parking = document.getElementById('input_parking').value;
        var Distance_Mainroad = document.getElementById('input_distance').value;

           	// For each drawn layer
        drawnItems.eachLayer(function(layer) {
           
        // Create SQL expression to insert layer
        var drawing = JSON.stringify(layer.toGeoJSON().geometry);
        var sql =
        "INSERT INTO scenery_table (geom, name, description, views, accessibility, parking, Distance_Mainroad) " +
        "VALUES (ST_SetSRID(ST_GeomFromGeoJSON('" + drawing + "'), 4326), " +
        "'" + enteredUsername + "', '" + enteredDescription + "', '" + selectedViews + "', '" + adaAccessibility + "', '" + parking + "', '" + Distance_Mainroad + "')";
        console.log(sql);

        // Send the data
        fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "q=" + encodeURI(sql)
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            console.log("Data saved:", data);
        })
        .catch(function(error) {
            console.log("Problem saving the data:", error);
        });

    // Transfer submitted drawing to the tableData layer 
    //so it persists on the map without you having to refresh the page
    var newData = layer.toGeoJSON();
    newData.properties.description = enteredDescription;
    newData.properties.name = enteredUsername;
    newData.properties.views = selectedViews;
    newData.properties.accessibility = adaAccessibility;
    newData.properties.parking = parking;
    newData.properties.Distance_Mainroad = Distance_Mainroad;
    L.geoJSON(newData, {onEachFeature: addPopup}).addTo(tableData);

});

        // Clear drawn items layer
        drawnItems.closePopup();
        drawnItems.clearLayers();

    }
}

document.addEventListener("click", setData);

map.addEventListener("draw:editstart", function(e) {
    drawnItems.closePopup();
});
map.addEventListener("draw:deletestart", function(e) {
    drawnItems.closePopup();
});
map.addEventListener("draw:editstop", function(e) {
    drawnItems.openPopup();
});
map.addEventListener("draw:deletestop", function(e) {
    if(drawnItems.getLayers().length > 0) {
        drawnItems.openPopup();
    }
});
