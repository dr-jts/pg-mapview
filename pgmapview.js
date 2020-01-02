
map = new PGMap('map');

map.installMousePos('ol-mousepos')
map.onFeatureClick(  uiIdentifyFeature );

function addLayer(name, url, options) {
    let lyr = map.layerAdd(name, url, options,makeOafUrl );
    return lyr;
}
function makeOafUrl(urlBase, opt) {
    url = urlOafAddParams(urlBase, opt.limit, opt.bbox, opt.transform);
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
function urlOafAddParams(url, limit, bbox, trans)
{
    url = addQueryParam(url, "limit", limit);
    url = addQueryParam(url, "bbox", bbox);
    url = addQueryParam(url, "transform", trans);
    return url;
}
function addQueryParam(url, name, value) {
    if (! value || value.length <= 0) return url;
    hasQuery = url.indexOf('?') >= 0;
    var newUrl = url + (hasQuery ? '&' : '?')
            + name + '=' + value;
    return newUrl;
}
