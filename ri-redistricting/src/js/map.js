var alreadyExists = false;
var chamber = 'house'
var dist = '01'

// setup map bounds, options and base
var southWest = L.latLng(40.718709, -72.887665),
    northEast = L.latLng(42.703937, -69.601336),
    bounds = L.latLngBounds(southWest, northEast);

var mapOptions = {
    zoomControl: false,
    attributionControl: false
}

var map = L.map('map', mapOptions)
    .setView([41.725024, -71.429290], 15)
    .setMaxBounds(bounds)

map.createPane('left')
map.createPane('right');

L.control.attribution({ position: 'bottomleft' }).addTo(map);

// basemap layer
L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    maxZoom: 18,
    minZoom: 10,
    attribution: `Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, 
                  <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>`
}).addTo(map);

// plan A styling
function planAStyle(feature) {
    return {
        fillColor: '#FFC20A',
        weight: 2,
        opacity: 1,
        pane: 'left',
        color: '#666666',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

// plan B styling
function planBStyle(feature) {
    return {
        fillColor: '#0C7BDC',
        weight: 2,
        opacity: 1,
        pane: 'right',
        color: '#666666',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

// function to add dropdown selectors
function addDropdown(dropDownElement, valuesList, defaultValue) {
    for (i = 0; i < valuesList.length; i++) {
        var element = valuesList[i];
        var appendOption = document.createElement('option');

        if (i === defaultValue) {
            appendOption.selected = "selected";
        }

        appendOption.innerHTML = element;
        appendOption.value = element;
        dropDownElement.appendChild(appendOption);
    }
}

// function for swapping layers
function swapLayer(pos, layerName, geo) {
    map.removeLayer(layerName);
    if (pos === 'left') {
        var newLayer = L.geoJSON(geo, {id: 'left', pane: 'left', style: planAStyle})
        layerName = newLayer
        map.addLayer(layerName);
        sideBySide.setLeftLayers(layerName);
    } else {
        var newLayer = L.geoJSON(geo, {id: 'right', pane: 'right', style: planBStyle})
        layerName = newLayer
        map.addLayer(layerName);
        sideBySide.setRightLayers(layerName);
    }
}

async function fetchGeoJSON(chamber, dist) {
    const [waitA, waitB] = await Promise.all([
      fetch('http://127.0.0.1:8000/data/' + chamber + '/plan_a/' + dist + '.geojson'),
      fetch('http://127.0.0.1:8000/data/' + chamber + '/plan_b/' + dist + '.geojson'),
    ]);
    const planA = await waitA.json();
    const planB = await waitB.json();
    return [planA, planB];
}

function updateMap(chamber, dist) {
    fetchGeoJSON(chamber, dist).then((data) => {
        console.log(chamber, dist)
        if (alreadyExists === false) {     
            leftLayer = L.geoJSON(data[0], {id: 'left', pane: 'left', style: planAStyle}).addTo(map);
            rightLayer = L.geoJSON(data[1], {id: 'right', pane: 'right', style: planBStyle}).addTo(map);

            sideBySide = L.control.sideBySide(leftLayer, rightLayer).addTo(map);
            map.fitBounds(leftLayer.getBounds().extend(rightLayer.getBounds()))

            alreadyExists = true
        } else {
            newLeft = L.geoJSON(data[0], {id: 'left', pane: 'left', style: planAStyle})
            newRight = L.geoJSON(data[1], {id: 'right', pane: 'right', style: planBStyle})

            map.removeLayer(leftLayer);
            map.removeLayer(rightLayer);

            leftLayer = newLeft
            rightLayer = newRight

            map.addLayer(leftLayer);
            map.addLayer(rightLayer);

            sideBySide.setLeftLayers(leftLayer);
            sideBySide.setRightLayers(rightLayer);

            map.flyToBounds(leftLayer.getBounds().extend(rightLayer.getBounds()))
        }
    })
}

// function to swap in/out layers when new dist selected
function changeDist() {
    chamber = document.getElementById('chamber-select').value
    dist = document.getElementById('dist-select').value
    updateMap(chamber, dist)
}

// add top right controls
var select = L.control({ position: "topright" });
select.onAdd = function (map) {
    var div = L.DomUtil.create("div", "legend");
    div.setAttribute("id", "filterSelection");
    div.innerHTML += "<h4>Select a Chamber</h4>";
    div.innerHTML += '<select id="chamber-select" class="select-box" name="chamber-select" onchange="numOfDist()"></select>';
    div.innerHTML += "<h4 style='padding-top: 0.5rem;'>Select a District</h4>";
    div.innerHTML += '<select id="dist-select" class="select-box" name="dist-select" onchange="changeDist()"></select>';
    div.innerHTML += "<hr></hr>";
    div.innerHTML += "<h4 style='color: #FFC20A'>L: Plan A</h4>";
    div.innerHTML += "<h4 style='color: #0C7BDC'>R: Plan B</h4>";
    div.innerHTML += "<hr></hr>";
    div.innerHTML += '<button id="shareBtn" type="button" onclick="shareMap()">Share Location</button>';
    div.innerHTML += '<button id="exit" type="button" onclick="exitMenu()" style="display: none">Close Menu</button>';
    return div;
};
select.addTo(map);

// add the default chamber selection options
var chambers = ['house', 'senate']
var chamberDropdown = document.getElementById('chamber-select');
addDropdown(chamberDropdown, chambers, 'chamber', 'url', 1);

// add the default districts selection options
var districts = Array.from({length: 75}, (x, i) => String(i + 1).padStart(2, '0'));
var distDropdown = document.getElementById('dist-select');
addDropdown(distDropdown, districts, 'district', 'url', 1);

function numOfDist() {
    document.querySelectorAll('#dist-select option').forEach(option => option.remove())
    if (chamberDropdown.value === 'house') {
        districts = Array.from({length: 75}, (x, i) => String(i + 1).padStart(2, '0'));
        addDropdown(distDropdown, districts, 'district', 'url', 1);
        updateMap('house', '01')
    } else {
        districts = Array.from({length: 38}, (x, i) => String(i + 1).padStart(2, '0'));
        addDropdown(distDropdown, districts, 'district', 'url', 1);
        updateMap('senate', '01')
    }
}

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

    return base_url + "?share=" + chamber + "&dist=" + dist
}

function shareMap() {
    // modal javascript
    var modal = document.getElementById("shareModal");
    var span = document.getElementsByClassName("close")[0];
    var share = document.getElementById("shareMap");
    
    var base_url = window.location.href.split('?')[0]
    var chamberShare = chamberDropdown.value
    var distShare = distDropdown.value

    share.value = base_url + "?share=" + chamberShare + "&dist=" + distShare; 
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
    var chamberLink = urlParams.get('share');
    var distLink = urlParams.get('dist')

    chamberDropdown.value = chamberLink;
    distDropdown.value = distLink

    numOfDist()
    updateMap(chamberLink, distLink)
} else {
    // default base map (house dist 01)
    updateMap(chamber, dist)
}

// copy input to clipboard
function copyLink() {
    /* Get the text field */
    var input = document.getElementById("shareMap");

    input.select();
    input.setSelectionRange(0, 99999); 
    navigator.clipboard.writeText(input.value)
  
    alert("Copied the text: " + copyText.value);
  }