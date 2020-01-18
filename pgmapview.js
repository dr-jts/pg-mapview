
MAP = new PGMap('map');

MAP.installMousePos('ol-mousepos')
MAP.onFeatureClick(  uiIdentifyFeature );

function addLayerFC(title, service, name, params, options) {
    return MAP.addLayerFC(title, service, name, params, options );
}
function addLayerVT(name, url, options) {
    return MAP.addLayerVT(name, url, options);
}
function addLayerDS(name, url, options) {
    return MAP.addLayerDS(name, url, options);
}
