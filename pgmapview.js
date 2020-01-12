
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
class OAF {
    static urlItems(host, name, limit, bbox, trans) {
        var url = host + "/collections/" + name + "/items";
        return url;
    }
    static urlWithParams(url, param) {
        url = OAF.addQueryParam(url, "limit", param.limit);
        url = OAF.addQueryParam(url, "bbox", param.bbox);
        url = OAF.addQueryParam(url, "precision", param.precision);
        url = OAF.addQueryParam(url, "transform", param.transform);
        return url;
    }
    static addQueryParam(url, name, value) {
        if (! value || value.length <= 0) return url;
        hasQuery = url.indexOf('?') >= 0;
        var newUrl = url + (hasQuery ? '&' : '?')
                + name + '=' + value;
        return newUrl;
    }
}
