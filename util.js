// extract layer name from an OAF collection url
function collectionName(url) {
    var rx = /collections\/(.*)\/items/g;
    var arr = rx.exec(url);
    var title = arr[1];
    return title;
}
