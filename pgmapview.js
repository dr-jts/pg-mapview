
map = new PGMap('map');

map.installMousePos('ol-mousepos')
map.onFeatureClick(  uiIdentifyFeature );

function addLayer(name, url) {
    let lyr = map.layerAdd(name, url);
    return lyr;
}

function urlOafItems(host, name, limit, bbox, trans)
{
    var url = host + "/collections/" + name + "/items";
    url = addQueryParam(url, "limit", limit);
    url = addQueryParam(url, "bbox", bbox);
    url = addQueryParam(url, "transform", trans);
    return url;
}
function addQueryParam(url, name, value) {
    if (value.length <= 0) return url;
    hasQuery = url.indexOf('?') >= 0;
    var newUrl = url + (hasQuery ? '&' : '?')
            + name + '=' + value;
    return newUrl;
}
