import 'leaflet/dist/leaflet.css';
import { geoJSON } from "leaflet";

import './style.css'
import { RiStyle, FireStyle } from "./mapStyles"
import { myMap } from "./map"

// env variables
var APP_URL: string = import.meta.env.VITE_APP_URL;

// global variables from html
let fireName = (document.getElementById('fireName') as HTMLTitleElement);
let fireDates = (document.getElementById('fireDates') as HTMLParagraphElement);
let fireAcres = (document.getElementById('fireAcres') as HTMLParagraphElement);

let categorySelect = (document.getElementById('categorySelect') as HTMLInputElement);
let fireSelect = (document.getElementById('fireSelect') as HTMLInputElement);

async function fetchGeo(fileName: string) {
    const response = await fetch(fileName);
    const data = await response.json();
    return data
}

function updateSelection(event: any) {
    var selection = event.target.value
    var updated = false
    Array.from(document.getElementsByClassName('fire') as HTMLCollectionOf<HTMLInputElement>).forEach(
        function(element) {
            if (element.classList.contains(selection)) {
                element.hidden = false

                if (updated === false) {
                    fireSelect.value = element.value
                    updateMap(element.value, false)
                    updated = true
                }

            } else {
                element.hidden = true
            }
        }
    );
}

function addDropdown(arr: any, dropName: any, className: string, hide: boolean) {
    arr.forEach((el: any) => {
        var appendOption = document.createElement('option');
        appendOption.innerHTML = el[dropName];
        appendOption.value = el.FIRE_NAME.trim().replace(" ", "-");
        appendOption.setAttribute("class", className)
        appendOption.hidden = hide
        fireSelect.appendChild(appendOption)
    });
}

function addDetails(obj: any) {
    console.log(obj)
    fireName.innerHTML = obj.FIRE_NAME
    fireDates.innerHTML = obj.ALARM_DATE + " - " + obj.CONT_DATE
    fireAcres.innerHTML = obj.GIS_ACRES.toLocaleString("en-US") + " acres burned"
}

function updateMap(event: any, listen: boolean) {
    const layer = (listen === true) ? event.target.value : event;
    const fires = (categorySelect.value == 'california') ? calFires : caFires;
    
    addDetails(fires.find((fire: any) => fire.FIRE_NAME.replace(' ', '-') === layer))
    fetchGeo(APP_URL + '/data/shape/' + layer + '.geojson').then((data) => {
        var newFire = geoJSON(data, { style: FireStyle })
        myMap.removeLayer(fire);
        fire = newFire
        myMap.addLayer(fire);
    })
}

// get data of fires and default first fire
var caFires = await fetchGeo(APP_URL + '/data/canada.json')
var calFires = await fetchGeo(APP_URL + '/data/california.json')
var riGeo = await fetchGeo(APP_URL + '/data/state.json')
var fireGeo = await fetchGeo(APP_URL + '/data/shape/august-complex.geojson')

// add data to map and listerner for change
var outline = geoJSON(riGeo, { pane: 'top', style: RiStyle }).addTo(myMap);
var fire = geoJSON(fireGeo, { style: FireStyle }).addTo(myMap);
myMap.fitBounds(outline.getBounds().extend(fire.getBounds()))

categorySelect.addEventListener('change', (event) => {
    updateSelection(event)
});

addDropdown(calFires, 'FIRE_NAME', "fire california", false)
addDropdown(caFires, 'DROP_NAME', "fire canada", true)
addDetails(calFires.find((fire: any) => fire.FIRE_NAME === "august complex"))

fireSelect.addEventListener('change', (event) => {
    updateMap(event, true)
});

// show and hide controls container
let controls = (document.getElementById('controls') as HTMLElement);
let btn = (document.getElementById('btn') as HTMLButtonElement);
let exit = (document.getElementById('exit') as HTMLButtonElement);
let title = (document.getElementById('title') as HTMLElement);
let source = (document.getElementById('source') as HTMLElement);

controls.style.visibility = "visible";
btn.style.visibility = "hidden";
title.style.visibility = "visible";
source.style.visibility = "visible";

btn.addEventListener('click', () => {
    controls.style.visibility = 'visible'
    btn.style.visibility = 'hidden'
})

exit.addEventListener('click', () => {
    controls.style.visibility = 'hidden'
    btn.style.visibility = 'visible'
})