
map = new PGMap('map');

map.installMousePos('ol-mousepos')
map.onFeatureClick(  uiIdentifyFeature );

function addLayer(name, url, options) {
    let lyr = map.layerAdd(name, url, options,makeOafUrl );
    return lyr;
}
function makeOafUrl(urlBase, opt) {
    url = urlOafAddParams(urlBase, opt);
    return url;
}

function addLayerDataset(name, url) {
    let lyr = map.layerAdd(name, url, {}, function(url) {
        return url
    });
    return lyr;
}

function urlOafItems(host, name, limit, bbox, trans)
{
    var url = host + "/collections/" + name + "/items";
    return url;
}
function urlOafAddParams(url, param)
{
    url = addQueryParam(url, "limit", param.limit);
    url = addQueryParam(url, "bbox", param.bbox);
    url = addQueryParam(url, "precision", param.precision);
    url = addQueryParam(url, "transform", param.transform);
    return url;
}
function addQueryParam(url, name, value) {
    if (! value || value.length <= 0) return url;
    hasQuery = url.indexOf('?') >= 0;
    var newUrl = url + (hasQuery ? '&' : '?')
            + name + '=' + value;
    return newUrl;
}
