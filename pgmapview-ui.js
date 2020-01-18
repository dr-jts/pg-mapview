document.getElementById('btn-layer-add-show').onclick = function() {
    uiShowLayerAdd();
}
document.getElementById('btn-layer-add-cancel').onclick = function() {
    panelsHide();
}

$('.panel-closer').click(function() {  panelsHide(); });
$('.btn-panel-cancel').click(function() {  panelsHide(); });

document.getElementById('btn-layer-bbox-use-map').onclick = function() {
    var bboxStr = MAP.extentStr(4);
    document.getElementById('layer-bbox').value = bboxStr;
}


document.getElementById('radio-layer-tab-ds').onclick = function() {
    layerTabShow('layer-tab-ds');
}
document.getElementById('radio-layer-tab-fc').onclick = function() {
    layerTabShow('layer-tab-fc');
}
document.getElementById('radio-layer-tab-vt').onclick = function() {
    layerTabShow('layer-tab-vt');
}
function layerTabShow(id) {
    $('.layer-tab-panel').hide();
    if (! id) return;
    $('#'+id).show();

    $('.radio-layer-tab').prop('checked', false);
    $('#radio-' + id).prop('checked', true );
}
const LAYER_TYPE = {
    FC: 'fc',
    DS: 'ds',
    VT: 'vt'
}

function layerTabType() {
    if (document.getElementById('radio-layer-tab-fc').checked) { return LAYER_TYPE.FC; }
    if (document.getElementById('radio-layer-tab-ds').checked) { return LAYER_TYPE.DS; }
    if (document.getElementById('radio-layer-tab-vt').checked) { return LAYER_TYPE.VT; }
}
document.getElementById('btn-transform-clear').onclick = function() {
    document.getElementById('layer-transform').value = '';
}
document.getElementById('btn-fc-read').onclick = function() {
    var url = document.getElementById('layer-host').value;
    // display temporary loading msg
    addOptions('#fc-names', [{ text: 'Loading...', value: '' }], true)
    var colls = MAP.readCollections(url, loadSelectCollections);
}

function uiShowLayerAdd() {
    document.getElementById('layer-panel-title').innerText = 'Add Layer';
    $('#btn-layer-add').show();
    $('#btn-layer-update').hide();

    //--- show no tab selected on Add...
    $('.layer-panel-tabs').show();
    $('.radio-layer-tab').prop('checked', false);
    layerTabShow();

    //----- reset Layer panel
    $('#tbl-fc-url').show();
    document.getElementById('layer-url').value = '';
    document.getElementById('layer-title').value = '';
    document.getElementById('layer-limit').value = '';
    document.getElementById('layer-bbox').value = '';
    document.getElementById('layer-precision').value = '';
    document.getElementById('layer-transform').value = '';
    document.getElementById('sel-transform-function').selectedIndex = 0;

    $('#layer-options').show();
    document.getElementById('chk-heatmap').checked = true;
    document.getElementById('chk-heatmap').checked = false;
    document.getElementById('chk-cluster').checked = false;
    document.getElementById('chk-declutter').checked = false;

    panelShow('panel-layer-add', true);
}

var layerToUpdate = null;

function uiShowLayerUpdate(layer) {
    layerToUpdate = layer;
    var isCollection = layer.parameters != undefined;

    document.getElementById('layer-panel-title').innerText = 'Layer Settings';
    $('#btn-layer-add').hide();
    $('#btn-layer-update').show();

    $('.layer-panel-tabs').hide();
    layerTabShow( isCollection ? 'layer-tab-fc': 'layer-tab-ds' );
    //$('#layer-tab-collection').toggle(isCollection);
    //$('#layer-url-panel').toggle(! isCollection);

    $('#tbl-fc-url').hide();
    $('#layer-options').hide();

    //--- populate panel from layer
    document.getElementById('layer-title').value = layer.title;
    //document.getElementById('layer-url').value = '';
    //document.getElementById('layer-name').value = 'XXXX';
    document.getElementById('layer-limit').value = layer.parameters.limit;
    document.getElementById('layer-bbox').value = layer.parameters.bbox;
    document.getElementById('layer-precision').value = layer.parameters.precision;
    document.getElementById('layer-transform').value = layer.parameters.transform;

    panelShow('panel-layer-add', true);
}

function loadSelectCollections(collections) {
    //console.log(collections);
    var options = [];
    for (var i = 0; i < collections.length; i++) {
        var id = collections[i].id;
        options.push({
            text: collections[i].id,
            value: collections[i].id
        });
    }
    addOptions('#fc-names', [{text: 'Set collection...', value: ''}], true)
    addOptions('#fc-names', options, false)
}

function addOptions(selectId, options, clear) {
    var $sel = $(selectId);
    if (clear) $sel.empty();
    for (var i = 0; i < options.length; i++) {
        $sel.append( $('<option>', options[i]));
    }
}

var btnLayerAdd = document.getElementById('btn-layer-add');
btnLayerAdd.onclick = function() {
    panelShow('panel-layer-add', false);

    var layerType = layerTabType();
    if (layerType == LAYER_TYPE.VT) {
        layerAddVT();
    }
    else if (layerType == LAYER_TYPE.DS) {
        layerAddDS();
    }
    else {
        layerAddFC();
    }
}
function layerAddVT() {

    var title = document.getElementById('layer-title').value;
    var host = document.getElementById('layervt-host').value;
    var name = document.getElementById('layervt-name').value;
    if (title.length == 0) title = name;

    url = host + "/" + name;

    let options = layerOptionsRead()

    var lyr = addLayerVT(title, url, options);

    uiLayerCreate(lyr, true);
}
function layerAddFC() {
    let title = document.getElementById('layer-title').value;
    let name = document.getElementById('layer-name').value;
    if (title.length == 0) title = name;

    let service = document.getElementById('layer-host').value;
    let params = layerParamsRead();

    let options = layerOptionsRead()

    let lyr = addLayerFC(title, service, name, params, options);
    uiLayerCreate(lyr);
    layerLoad(lyr, true);
}
function layerAddDS() {
    let url = document.getElementById('layer-url').value;
    let title = document.getElementById('layer-title').value;
    if (title.length == 0) title = OAF.collectionName(url);

    let options = layerOptionsRead()

    let lyr = addLayerDS(title, url, options);
    uiLayerCreate(lyr);
    layerLoad(lyr, true);
}
function layerParamsRead() {
    var limit = document.getElementById('layer-limit').value;
    var bbox = document.getElementById('layer-bbox').value;
    var precision = document.getElementById('layer-precision').value;
    var transform = document.getElementById('layer-transform').value;
    var params = {
        limit: limit,
        bbox: bbox,
        precision: precision,
        transform: transform
    };
    return params;
}
function layerOptionsRead() {
    let options = {
        isHeatmap: document.getElementById('chk-heatmap').checked,
        isCluster: document.getElementById('chk-cluster').checked,
        isDeclutter: document.getElementById('chk-declutter').checked,
    }
    return options;
}
var btnLayerUpdate = document.getElementById('btn-layer-update');
btnLayerUpdate.onclick = function() {
    panelShow('panel-layer-add', false);

    var lyr = layerToUpdate
    var title = document.getElementById('layer-title').value;
    lyr.title = title;
    uiLayerTitleUpdate( lyr, title );

    var params = layerParamsRead();
    lyr.parameters = params;
    layerLoad(lyr, true);
}

function layerLoad(lyr, doZoom) {
    var prom = lyr.load(doZoom);
    prom.done(function() {
        uiLayerError(lyr, false);
    });
    prom.fail(function() {
        uiLayerError(lyr, true);
    });
    prom.always(function() {
        uiUpdateInfo(lyr);
    })
    return prom;
}
function onChangeCollection(select, layerid) {
    var lyrid = select.options[select.selectedIndex].value;
    document.getElementById(layerid).value = lyrid;
}
function onChangeTransform(select, targetID) {
   var fun = select.options[select.selectedIndex].value;
    // skip blank option
    if (fun.length <= 0) return;
    var trans = document.getElementById(targetID).value
    var sep = '';
    if (trans.length > 0) sep = '|';
    document.getElementById(targetID).value = trans + sep + fun;

    // set select back to prompt
    select.selectedIndex = 0;
}
//===============================
var CURR_LYR;
var $CURR_LYR_CTL;

$('.layer-color').click(function() {  panelShow('style-panel', true); });
document.getElementById('btn-style-update').onclick = function() {
    uiStyleUpdate();
}

function uiStyleShow(lyr, $lyrCtl) {
    CURR_LYR = lyr;
    $CURR_LYR_CTL = $lyrCtl;
    panelShow('style-panel', true);
    document.getElementById('style-color').value = lyr.style.color;
    document.getElementById('style-color').checked = lyr.style.isLabelled;
    document.getElementById('style-label').value = lyr.style.labelProp;
}
function uiStyleUpdate() {
    panelsHide();
    var clr = document.getElementById('style-color').value;
    CURR_LYR.setColor(clr);
    $CURR_LYR_CTL.css('background-color', clr);
    var isLabel = document.getElementById('chk-style-label').checked;
    var labelProp = document.getElementById('style-label').value;
    CURR_LYR.setLabel(labelProp, isLabel);
    /*
    var declutter = document.getElementById('style-declutter').checked;
    CURR_LYR.setDeclutter(declutter);
    */
}
//================================
var LAYER_NAME_PREF = 'lyr-name-' ;

function uiLayerCreate(lyr, isVT) {

    var listID = '#layer-list';
    var $div = $('<div class="layer-list-item">');
    $div.prependTo( $(listID) );

    var $chkVis = $('<input type="checkbox" class="checkbox-single"/>')
                .prop('checked', true)
                .appendTo( $div );
    /*  -- hide until Identify Target is implemented
    var $radioIdent = $('<input type="radio" name="identify-radio" class="checkbox-single"/>')
        .prop('checked', true)
        .appendTo( $div );
        */
    var $toolColor = $('<button>').addClass('btn-layer-color')
        .appendTo($div)
        .attr('title', 'Set layer style')
        .css('background-color', lyr.style.color)
    $toolColor.click( function() { uiStyleShow(lyr, $toolColor); } );
    $('<label class="layer-name">').text(lyr.title)
        .attr('id', LAYER_NAME_PREF + lyr.id)
        .attr('title', lyr.url)
        .appendTo($div)
        .click( function() {
            var show = ! $tools.is(':visible');
            $('.layer-tools').hide();
            if (show) $tools.toggle();
        });

    var $tools = $('<div class="layer-tools">').appendTo($div);
	var $toolRemove = $('<span>').addClass('layer-remove layer-tool').appendTo($tools)
		.text('x')
        .attr('title', 'Remove Layer');
        /*
    var $toolUp = $('<span>').addClass('layer-up layer-tool').appendTo( $tools )
		.text('^')
		.attr('title', 'Move Layer up');
    var $toolDown = $('<span>').addClass('layer-down layer-tool').appendTo( $tools )
		.text('v')
		.attr('title', 'Move Layer down')
		.click(function() {
			//self.moveLayer(lyr, 1);
			var $nxt = $div.next();
			if (! $nxt.length) return;
			$div.detach();
			$nxt.after($div);
			//$tools.hide();
        });
        */
    if (! isVT) {
        var $toolInfo = $('<span>').addClass('layer-tool').appendTo($tools)
            .text('i')
            .attr('title', 'Layer info')
            .click( doInfo );
        var $toolZoom = $('<span>').addClass('layer-tool').appendTo($tools)
            .text('Z')
            .attr('title', 'Zoom to Layer')
            .click( () => lyr.zoom() );
        var $toolReload = $('<span>').addClass('layer-tool').appendTo( $tools )
            .text('R')
            .attr('title', 'Reload Layer (Shift to use bbox)')
            .click( doReload );
    }
    //--- Add Settings button for collections only
    if (! isVT && lyr.parameters) {
        var $toolSettings = $('<span>').addClass('layer-tool').appendTo($tools)
            .text('S')
            .attr('title', 'Layer settings');
        $toolSettings.click(function() {
            uiShowLayerUpdate(lyr);
        });
    }

    $chkVis.click(function () {
        var isVisible = $(this).is(':checked');
        lyr.setVisible(isVisible);
    } )
    /*
    $toolUp.click(function() {
        self.removeLayer(lyr, -1);
        var $prev = $div.prev();
        if (! $prev.length) return;
        $div.detach();
        $prev.before($div);
        //$tools.hide();
    });
    */
    $toolRemove.click(function() {
        lyr.remove();
        $div.remove();
    })
    function doReload(evt) {
        var updateBbox = evt.shiftKey;
        if (updateBbox && lyr.parameters) {
            lyr.parameters.bbox = MAP.extentStr();
        }
        layerLoad(lyr, false);
    }
    function doInfo() {
        uiLayerInfo(lyr);
    }
    /*
    $toolColor.change(function() {
        lyr.setColor( $toolColor.val() );
    });
    */
}

function uiLayerError(layer, isError) {
    $lyrName = $('#'+LAYER_NAME_PREF+layer.id)
    if (isError) {
        $lyrName.addClass('layer-name-error');
    }
    else {
        $lyrName.removeClass('layer-name-error');
    }
}
function uiLayerTitleUpdate(layer) {
    $lyrName = $('#'+LAYER_NAME_PREF+layer.id)
    $lyrName.text(  layer.title );
}

function uiLayerInfo(layer) {
    panelShow('info-panel', true);
    uiUpdateInfo(layer);
}
function uiUpdateInfo(layer) {
    $('#info-name').text( layer.title )
    $('#info-status').text( layer.statusCode + " - " + layer.statusMsg);
    $('#info-count-features').text( layer.numFeatures );
    $('#info-loadtime').text( layer.loadTime/ 1000 );
    $('#info-url').text( layer.url );
}
function uiIdentifyFeature( feature ) {
    if (! feature ) {
        panelsHide();
        return;
    }
    panelShow('identify-panel', true);
    let prop = feature.getProperties();

    let $content = $('#identify-content');
    $content.empty();
    for(var key in prop) {
        if (key == 'geometry') continue;
        addIdentifyRow($content, key, prop[key]);
    }
}
function addIdentifyRow(div, name, value) {
    let $tr = $('<tr>').appendTo(div);
    $('<td class="identify-name">').text( name ).appendTo($tr);
    $('<td class="identify-value">').text( value ).appendTo($tr);
}
//----------------------------------
var currentPanel = null;
function panelShow(id, isVisible) {
    panelsHide();
    var panel = document.getElementById(id);
    if( currentPanel != null) {
        currentPanel.style.display = 'none';
        currentPanel = null;
    }
    if (isVisible) {
        panel.style.display = 'block';
        currentPanel = panel;
    }
    else {
        panel.style.display = 'none';
    }
}
function panelsHide() {
    $('.identify-panel').hide();
    $('.info-panel').hide();
    $('.layer-panel').hide();
    $('.style-panel').hide();
}
