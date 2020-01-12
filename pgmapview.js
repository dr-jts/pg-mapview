
MAP = new PGMap('map');

MAP.installMousePos('ol-mousepos')
MAP.onFeatureClick(  uiIdentifyFeature );

function addLayer(name, url, options) {
    let lyr = MAP.addLayer(name, url, options, OAF.urlWithParams );
    return lyr;
}
function addLayerVT(name, url, options) {
    let lyr = MAP.addLayerVT(name, url, options, OAF.urlWithParams );
    return lyr;
}
function addLayerDataset(name, url) {
    let lyr = MAP.layerAdd(name, url, null, function(url) {
        return url
    });
    return lyr;
}
OAF = {
    urlItems(host, name) {
        var url = `${host}/collections/${name}/items`;
        return url;
    },
    urlWithParams(url, param) {
        url = OAF.addQueryParam(url, "limit", param.limit);
        url = OAF.addQueryParam(url, "bbox", param.bbox);
        url = OAF.addQueryParam(url, "precision", param.precision);
        url = OAF.addQueryParam(url, "transform", param.transform);
        return url;
    },
    addQueryParam(url, name, value) {
        if (! value || value.length <= 0) return url;
        let hasQuery = url.indexOf('?') >= 0;
        let  delim = hasQuery ? '&' : '?';
        let  newUrl = `${url}${delim}${name}=${value}`;
        return newUrl;
    }
}
