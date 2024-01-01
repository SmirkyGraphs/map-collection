import { map, latLng, latLngBounds, tileLayer, MapOptions } from "leaflet";

export { myMap } 

// basemap layer
const baseMap = tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    maxZoom: 12,
    minZoom: 7,
    attribution: `Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, 
                  <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>`
})

// setup map bounds, options and base
var southWest = latLng(37.774206, -75.506068),
    northEast = latLng(43.740667, -67.974918),
    bounds = latLngBounds(southWest, northEast);

const options: MapOptions = {
    zoomControl: false,
    zoomSnap: 0.25,
    attributionControl: false,
    layers: [baseMap]
};

const myMap = map('map', options)
    .setView([41.6831, -71.5554], 10)
    .setMaxBounds(bounds)

myMap.createPane('top');
myMap.getPane('top')!.style.zIndex = "1000";
