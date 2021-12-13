var chamber = 'house'
var dist = '01'

var selectedLeftLayer = 0
var selectedRightLayer = 1

var alreadyExists = false;
var currentLayer = false
var chamberSelect = houseLayers


// setup map bounds, options and base
var southWest = L.latLng(40.718709, -72.887665),
    northEast = L.latLng(42.703937, -69.601336),
    bounds    = L.latLngBounds(southWest, northEast);

var mapOptions = {
    zoomControl: false,
    attributionControl: false
}

var map = L.map('map', mapOptions)
    .setView([41.725024, -71.429290], 15)
    .setMaxBounds(bounds)

map.createPane('left')
map.createPane('right');

map.createPane('top');
map.getPane('top').style.zIndex = 1000;

L.control.attribution({ position: 'bottomleft' }).addTo(map);

// basemap layer
L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    maxZoom: 18,
    minZoom: 10,
    attribution: `Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, 
                  <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>`
}).addTo(map);

updateMap(chamber, dist)

// plan styling
// add a function to have seperate color based on plan

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

// current styling
function currentStyle(feature) {
    return {
        fillColor: '#ffffff',
        weight: 3,
        opacity: 1,
        pane: 'top',
        color: '#DC3220',
        dashArray: '5',
        fillOpacity: 0
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

async function fetchGeoJSON(chamber, dist, leftIdx, rightIdx) {
    const [waitA, waitB, waitC] = await Promise.all([
      fetch('http://127.0.0.1:8000/data/' + chamber + '/' + chamberSelect[leftIdx] + '/' + dist + '.geojson'),
      fetch('http://127.0.0.1:8000/data/' + chamber + '/' + chamberSelect[rightIdx] + '/' + dist + '.geojson'),
      fetch('http://127.0.0.1:8000/data/' + chamber + '/current/' + dist + '.geojson'),
    ]);
    const planA = await waitA.json();
    const planB = await waitB.json();
    const current = await waitC.json();
    return [planA, planB, current];
}

function updateMap(chamber, dist) {
    fetchGeoJSON(chamber, dist, selectedLeftLayer, selectedRightLayer).then((data) => {
        if (alreadyExists === false) {     
            leftLayer = L.geoJSON(data[0], {id: 'left', pane: 'left', style: planAStyle}).addTo(map);
            rightLayer = L.geoJSON(data[1], {id: 'right', pane: 'right', style: planBStyle}).addTo(map);
            currentLayer = L.geoJSON(data[2], {style: currentStyle, pane: 'top'})

            sideBySide = L.control.sideBySide(leftLayer, rightLayer).addTo(map);
            map.fitBounds(leftLayer.getBounds().extend(rightLayer.getBounds()))

            alreadyExists = true
        } else {
            newLeft = L.geoJSON(data[0], {id: 'left', pane: 'left', style: planAStyle})
            newRight = L.geoJSON(data[1], {id: 'right', pane: 'right', style: planBStyle})
            currentLayer = L.geoJSON(data[2], {style: currentStyle})

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
    if (map.hasLayer(currentLayer)) {
        map.removeLayer(currentLayer)
    }

    chamber = document.getElementById('chamber-select').value
    dist = document.getElementById('dist-select').value

    updateMap(chamber, dist)
}

function showCurrent() {
    if (map.hasLayer(currentLayer)) {
        map.removeLayer(currentLayer)
    } else {
        map.addLayer(currentLayer, true)
    }
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
    div.innerHTML += "<h4 id='left-legend' style='color: #FFC20A'>L: Plan A</h4>";
    div.innerHTML += "<h4 id='right-legend' style='color: #0C7BDC'>R: Plan B</h4>";
    div.innerHTML += "<hr></hr>";
    div.innerHTML += '<button id="currentBtn" type="button" onclick="showCurrent()">Show Current</button>';
    div.innerHTML += '<button id="selectPlansBtn" type="button" onclick="toggleOptions()">Select Plans</button>';
    div.innerHTML += '<button id="exit" type="button" onclick="exitMenu()" style="display: none">Close Menu</button>';
    return div;
};
select.addTo(map);

// add layer dropdowns
var leftDropdown = document.getElementById('left-select');
addDropdown(leftDropdown, houseLayers, selectedLeftLayer);

var rightDropdown = document.getElementById('right-select');
addDropdown(rightDropdown, houseLayers, selectedRightLayer);

// declare legend variables
var leftLegend = document.getElementById('left-legend')
var rightLegend = document.getElementById('right-legend')

// add the default chamber selection options
var chambers = ['house', 'senate']
var chamberDropdown = document.getElementById('chamber-select');
addDropdown(chamberDropdown, chambers, 0);

// add the default districts selection options
var districts = Array.from({length: 75}, (x, i) => String(i + 1).padStart(2, '0'));
var distDropdown = document.getElementById('dist-select');
addDropdown(distDropdown, districts, 0);

function numOfDist() {
    if (map.hasLayer(currentLayer)) {
        map.removeLayer(currentLayer)
    }

    document.querySelectorAll('#dist-select option').forEach(option => option.remove())
    document.querySelectorAll('#left-select option').forEach(option => option.remove())
    document.querySelectorAll('#right-select option').forEach(option => option.remove())

    if (chamberDropdown.value === 'house') {
        selectedLeftLayer = 0
        selectedRightLayer = 1

        districts = Array.from({length: 75}, (x, i) => String(i + 1).padStart(2, '0'));
        addDropdown(distDropdown, districts, 'district', 'url', 1);
        updateMap('house', '01')

        addDropdown(leftDropdown, houseLayers, selectedLeftLayer);
        addDropdown(rightDropdown, houseLayers, selectedRightLayer);

        chamber = 'house'
        dist = '01'
        chamberSelect = houseLayers
    } else {
        districts = Array.from({length: 38}, (x, i) => String(i + 1).padStart(2, '0'));
        addDropdown(distDropdown, districts, 'district', 'url', 1);
        updateMap('senate', '01')

        addDropdown(leftDropdown, senateLayers, selectedLeftLayer);
        addDropdown(rightDropdown, senateLayers, selectedRightLayer);

        chamber = 'senate'
        dist = '01'
        chamberSelect = senateLayers
    }

    const optionDropdowns = document.querySelectorAll('option')   
    optionDropdowns.forEach(e => e.innerText = e.innerText.replaceAll('_', ' '))
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

function toggleOptions() {
    // modal javascript
    var modal = document.getElementById("optionModal");
    var span = document.getElementsByClassName("close")[0];

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

function swapLayer() {
    if (map.hasLayer(currentLayer)) {
        map.removeLayer(currentLayer)
    }

    selectedLeftLayer = leftDropdown.selectedIndex
    selectedRightLayer = rightDropdown.selectedIndex

    leftLegend.textContent = 'L: ' + leftDropdown[selectedLeftLayer].text
    rightLegend.textContent = 'R: ' + rightDropdown[selectedRightLayer].text
    
    updateMap(chamber, dist)
}

// remove _ from dropdown select
const optionDropdowns = document.querySelectorAll('option')   
optionDropdowns.forEach(e => e.innerText = e.innerText.replaceAll('_', ' '))