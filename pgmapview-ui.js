document.getElementById('btn-layer-add-show').onclick = function() {
    panelShow('panel-layer-add', true);
}

document.getElementById('btn-layer-add-cancel').onclick = function() {
    panelShow('panel-layer-add', false);
}

var btnLayerAdd = document.getElementById('btn-layer-add');
btnLayerAdd.onclick = function() {
    var url = document.getElementById('layer-url').value;
    var title = document.getElementById('layer-title').value;
    if (url.length > 0) {
       var name = collectionName(url);
    }
    else {
        var host = document.getElementById('layer-host').value;
        name = document.getElementById('layer-name').value;
        var limit = document.getElementById('layer-limit').value;
        var trans = document.getElementById('layer-transform').value;
        url = urlOafItems(host, name, limit, trans);
    }
    if (title.length == 0) title = name;
    let lyr = addLayer(title, url);
    uiAddLayer(lyr);

    //----- reset panel
    document.getElementById('layer-url').value = '';
    document.getElementById('layer-title').value = '';
    panelShow('panel-layer-add', false);
}

function onChangeTransform(id, targetID) {
    var select = document.getElementById(id);
    var fun = select.options[select.selectedIndex].value;
    // skip blank option
    if (fun.length <= 0) return;
    var trans = document.getElementById(targetID).value
    var sep = '';
    if (trans.length > 0) sep = '|';
    document.getElementById(targetID).value = trans + sep + fun;
}

function uiAddLayer(lyr) {
    var self = this;

    var $div = $('<div class="layer-list-item">');
    $div.appendTo( $('#layer-list') );
    var $chkVis = $('<input type="checkbox" class="checkbox-single"/>')
                .prop('checked', true)
                .appendTo( $div );
    var $radioIdent = $('<input type="radio" name="identify-radio" class="checkbox-single"/>')
        .prop('checked', true)
        .appendTo( $div );
    var $toolColor= $('<input type="color">').addClass('layer-color')
        .appendTo($div)
        .attr('title', 'Set layer style')
        .val(lyr.color);
    $('<label class="xx">').text(lyr.title)
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
    var $toolReload = $('<span>').addClass('layer-reload layer-tool').appendTo( $tools )
		.text('R')
		.attr('title', 'Reload Layer');
    var $toolZoom = $('<span>').addClass('layer-zoom layer-tool').appendTo($tools)
        .text('Z')
        .attr('title', 'Remove Layer');

    $chkVis.click(function () {
        var isVisible = $(this).is(':checked');
        //lyr.visibility = isVisible;
        map.layerSetVisible(lyr, isVisible);
        //self.clearTime();
    } )
    $toolUp.click(function() {
        self.removeLayer(lyr, -1);
        var $prev = $div.prev();
        if (! $prev.length) return;
        $div.detach();
        $prev.before($div);
        //$tools.hide();
    });
    $toolRemove.click(function() {
        map.removeLayer(lyr);
        $div.remove();
    })
    $toolReload.click(function() {
        map.layerReload(lyr);
    })
    $toolZoom.click(function() {
        map.layerZoom(lyr);
    })
    $toolColor.change(function() {
        map.layerColor( lyr, $toolColor.val() );
    });
}
$('.identify-closer').click(function() {
    $('.identify-panel').hide();
});
function uiIdentifyFeature( feature ) {
    if (! feature ) {
        $('.identify-panel').hide();
        return;
    }
    $('.identify-panel').show();
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
