
//var DATA_URL = 'http://localhost:9000/collections/nyc.streets/items.json?limit=100';


map = new PGMap('map');
//map.addLayer(DATA_URL);
map.installMousePos('ol-mousepos')
map.onFeatureClick(  uiIdentifyFeature );

function addLayer(name, url) {
    let lyr = map.addLayer(name, url);
    return lyr;
}

function urlOafItems(host, name, limit, trans)
{
    var url = host + "/collections/" + name + "/items";
    url = addQueryParam(url, "limit", limit);
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
