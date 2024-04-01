// function for swapping layers
function swapLayer() {
    map.removeLayer(rightLayer);

    var newLayer = L.esri.tiledMapLayer({
        url: document.getElementById("image-year").value,
        attribution: 'Tiles: <a href="https://www.rigis.org/">RIGIS</a>'
    })

    rightLayer = newLayer
    map.addLayer(rightLayer);
    sideBySide.setRightLayers(rightLayer);
}

// function to add dropdown selectors
function addDropdown(dropDownElement, valuesList, key, value, defaultValue) {
    for (i = 0; i < valuesList.length; i++) {
        var element = valuesList[i];
        var appendOption = document.createElement('option');

        if (i === defaultValue) {
            appendOption.selected = "selected";
        }

        appendOption.innerHTML = element[key];
        appendOption.value = element[value];
        dropDownElement.appendChild(appendOption);
    }
}

// function for moving map to suggested locations
function quickLocation() {
    var loc = document.getElementById('quick-location').value.split(',');
    map.setView([loc[0], loc[1]], loc[2]);
}

// function to get user location
function userLocation() {
    map.locate({ setView: true, maxZoom: 16 });
}

// setup map bounds, options and base
var southWest = L.latLng(41.099222, -72.001916),
    northEast = L.latLng(42.093533, -70.973496),
    bounds = L.latLngBounds(southWest, northEast);

var mapOptions = {
    zoomControl: false,
    attributionControl: false
}

var map = L.map('map', mapOptions)
    .setView([41.725024, -71.429290], 15)
    .setMaxBounds(bounds);

L.control.attribution({ position: 'bottomleft' }).addTo(map);

// default layers and set up side by side map
var rightLayer = L.esri.tiledMapLayer({
    url: 'https://tiles.arcgis.com/tiles/S8zZg9pg23JUEexQ/arcgis/rest/services/atlas_img_1962/MapServer',
    attribution: 'Tiles provided by: <a href="https://www.rigis.org/">RIGIS</a>'
}).addTo(map);

var leftLayer = L.tileLayer.wms('https://maps.edc.uri.edu/rigis/services/IMG/RI_202211_RGB_3in_web/ImageServer/WMSServer', {
    layers: 'RI_202211_RGB_3in_web'
}).addTo(map);

sideBySide = L.control.sideBySide(leftLayer, rightLayer).addTo(map);

// add top right controls
var select = L.control({ position: "topright" });
select.onAdd = function (map) {
    var div = L.DomUtil.create("div", "legend");
    div.setAttribute("id", "filterSelection");
    div.innerHTML += "<h4>Select Year</h4>";
    div.innerHTML += '<select id="image-year" class="select-box" name="image-year" onchange="swapLayer()"></select>';
    div.innerHTML += "<h4 style='padding-top: 0.5rem;'>Quick Location</h4>";
    div.innerHTML += '<select id="quick-location" class="select-box" name="quick-location" onchange="quickLocation()"></select>';
    div.innerHTML += "<hr></hr>";
    div.innerHTML += '<button type="button" onclick="userLocation()">Your Location</button>';
    div.innerHTML += '<button id="shareBtn" type="button" onclick="shareMap()">Share Location</button>';
    div.innerHTML += '<button id="exit" type="button" onclick="exitMenu()" style="display: none">Close Menu</button>';
    return div;
};
select.addTo(map);

var locationDropdown = document.getElementById('quick-location');
addDropdown(locationDropdown, locationList, 'name', 'location', 0);

var layerDropdown = document.getElementById('image-year');
addDropdown(layerDropdown, layerList, 'year', 'url', 1);

// function for toggle button
function toggleSelection() {
    var selection = document.getElementById("filterSelection");
    var button = document.getElementById("filtersMobile");
    var exit = document.getElementById("exit");
    selection.style.display = 'block';
    exit.style.display = 'block';
    button.style.display = 'none';
}

// function for exiting menu
function exitMenu() {
    var selection = document.getElementById("filterSelection");
    var button = document.getElementById("filtersMobile");
    var exit = document.getElementById("exit");
    selection.style.display = 'none';
    exit.style.display = 'none';
    button.style.display = 'block';
}

// javascript to share locations
function getLocation() {
    const base_url = window.location.href.split('?')[0]
    var layer = document.getElementById("image-year").selectedIndex

    var zoom = map.getZoom()
    var center = map.getCenter()
    var lat = center.lat
    var lng = center.lng

    return base_url + "?share=" + lat + "," + lng + "," + zoom + "&layer=" + layer
}

function shareMap() {
    // modal javascript
    var modal = document.getElementById("shareModal");
    var span = document.getElementsByClassName("close")[0];
    var share = document.getElementById("shareMap");
    var location = getLocation();

    share.value = location; 
    modal.style.display = "block";
    
    span.onclick = function () {
        modal.style.display = "none";
    }
    
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}

// change map to share location if found
const urlParams = new URLSearchParams(window.location.search);

if (urlParams.has('share')) {
    var shareLink = urlParams.get('share').split(',').map(Number);
        console.log(shareLink)
        map.setView([shareLink[0], shareLink[1]], shareLink[2]);

    var layerLink = urlParams.get('layer');
    document.getElementById("image-year").selectedIndex = layerLink;
    swapLayer();
}

// copy input to clipboard
function copyLink() {
    /* Get the text field */
    var input = document.getElementById("shareMap");

    input.select();
    input.setSelectionRange(0, 99999); 
    document.execCommand("copy");
  
    alert("Copied the text: " + copyText.value);
  }