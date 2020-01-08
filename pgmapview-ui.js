document.getElementById('btn-layer-add-show').onclick = function() {
    uiShowLayerAdd();
}
document.getElementById('btn-layer-add-cancel').onclick = function() {
    panelShow('panel-layer-add', false);
}

document.getElementById('btn-layer-bbox-use-map').onclick = function() {
    var bboxStr = map.mapExtentStr(4);
    document.getElementById('layer-bbox').value = bboxStr;
}

document.getElementById('radio-layer-type-resource').onclick = function() {
    $('#layer-url-panel').show();
    $('#layer-collection-panel').hide();
}

document.getElementById('radio-layer-type-collection').onclick = function() {
    $('#layer-url-panel').hide();
    $('#layer-collection-panel').show();
}
document.getElementById('btn-transform-clear').onclick = function() {
    document.getElementById('layer-transform').value = '';
}

document.getElementById('btn-collection-read').onclick = function() {
    var url = document.getElementById('layer-host').value;
    // display temporary loading msg
    addOptions('#collection-names',
        [{ text: 'Loading...', value: '' }], true)
    var colls = map.readCollections(url, loadSelectCollections);
}

function uiShowLayerAdd() {
    $('#btn-layer-add').show();
    $('#btn-layer-update').hide();

    $('.layer-panel-tabs').show();
    $('#layer-collection-panel').show();
    $('#layer-url-panel').hide();
    $('#radio-layer-type-collection').prop('checked', true);
    $('#radio-layer-type-resource').prop('checked', false);

    $('#tbl-collection-url').show();

    //----- reset Layer panel
    document.getElementById('layer-url').value = '';
    document.getElementById('layer-title').value = '';
    document.getElementById('layer-limit').value = '';
    document.getElementById('layer-bbox').value = '';
    document.getElementById('layer-precision').value = '';
    document.getElementById('layer-transform').value = '';

    document.getElementById('sel-transform-function').selectedIndex = 0;

    panelShow('panel-layer-add', true);
}
var layerToUpdate = null;
function uiShowLayerUpdate(layer) {
    layerToUpdate = layer;
    var isCollection = layer.parameters != undefined;

    $('#btn-layer-add').hide();
    $('#btn-layer-update').show();

    $('.layer-panel-tabs').hide();
    $('#layer-collection-panel').toggle(isCollection);
    $('#layer-url-panel').toggle(! isCollection);

    $('#tbl-collection-url').hide();

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
    addOptions('#collection-names', [{text: 'Set collection...', value: ''}], true)
    addOptions('#collection-names', options, false)
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

    var url = document.getElementById('layer-url').value;
    var title = document.getElementById('layer-title').value;
    var name = document.getElementById('layer-name').value;
    if (title.length == 0) title = name;

    var lyr;
    if (url.length > 0) {
       var title = collectionName(url);
       lyr = addLayerDataset(title, url);
    }
    else {
        var host = document.getElementById('layer-host').value;
        url = urlOafItems(host, name);
        var params = layerParamsRead();
        lyr = addLayer(title, url, params);
    }

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
    var prom = map.layerLoad(lyr, doZoom);
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
var LAYER_NAME_PREF = 'lyr-name-' ;

function uiLayerCreate(lyr) {
    var self = this;

    var $div = $('<div class="layer-list-item">');
    $div.prependTo( $('#layer-list') );
    var $chkVis = $('<input type="checkbox" class="checkbox-single"/>')
                .prop('checked', true)
                .appendTo( $div );
    /*  -- hide until Identify Target is implemented
    var $radioIdent = $('<input type="radio" name="identify-radio" class="checkbox-single"/>')
        .prop('checked', true)
        .appendTo( $div );
        */
    var $toolColor= $('<input type="color">').addClass('layer-color')
        .appendTo($div)
        .attr('title', 'Set layer style')
        .val(lyr.color);
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
    var $toolReload = $('<span>').addClass('layer-tool').appendTo( $tools )
		.text('R')
		.attr('title', 'Reload Layer (Shift to use bbox)');
    var $toolZoom = $('<span>').addClass('layer-tool').appendTo($tools)
        .text('Z')
        .attr('title', 'Zoom to Layer');
    var $toolInfo = $('<span>').addClass('layer-tool').appendTo($tools)
        .text('i')
        .attr('title', 'Layer info');

    //--- Add Settings button for collections only
    if (lyr.parameters) {
        var $toolSettings = $('<span>').addClass('layer-tool').appendTo($tools)
            .text('S')
            .attr('title', 'Layer settings');
        $toolSettings.click(function() {
            uiShowLayerUpdate(lyr);
        });
    }

    $chkVis.click(function () {
        var isVisible = $(this).is(':checked');
        //lyr.visibility = isVisible;
        map.layerSetVisible(lyr, isVisible);
        //self.clearTime();
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
        map.removeLayer(lyr);
        $div.remove();
    })
    $toolReload.click(function(evt) {
        var updateBbox = evt.shiftKey;
        if (updateBbox && lyr.parameters) {
            lyr.parameters.bbox = map.mapExtentStr();
        }
        layerLoad(lyr, false);
    })
    $toolZoom.click(function() {
        map.layerZoom(lyr);
    })
    $toolInfo.click(function() {
        uiLayerInfo(lyr);
    })
    $toolColor.change(function() {
        map.layerColor( lyr, $toolColor.val() );
    });
}
$('.panel-closer').click(function() {
    panelsHide();
});

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
}
