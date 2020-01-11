/*
document.getElementById('btn-layervt-add-show').onclick = function() {
    panelShow('panel-layervt-add', true);
}
document.getElementById('btn-layervt-add-cancel').onclick = function() {
    panelShow('panel-layervt-add', false);
}
*/
function layerAddVT() {

    var title = document.getElementById('layer-title').value;
    var host = document.getElementById('layervt-host').value;
    var name = document.getElementById('layervt-name').value;
    if (title.length == 0) title = name;

    url = host + "/" + name;
    var lyr = addLayerVT(title, url);

    uiLayerCreate(lyr, true);
}
