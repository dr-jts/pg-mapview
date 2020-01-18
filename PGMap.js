
class PGMap {
constructor(divid, options) {
	this.map = new ol.Map({
		layers: [
			new ol.layer.Tile({
				source: new ol.source.OSM({
					"url" : "https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png"
				})
			}),
		],
		target: divid,
		controls: ol.control.defaults({
			attributionOptions: {
				collapsible: false
			}
		}),
		view: new ol.View({
			center: ol.proj.fromLonLat([0,0]),
			zoom: 1
		})
	});
	//this._installOverlay();
	this.layerCounter = 0;
}
extentGeo() {
	var extent = this.map.getView().calculateExtent(this.map.getSize());
	return ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
}
extentStr(numDecimals) {
	var fix = 4
	if (numDecimals) fix = numDecimals;
    var bbox = this.extentGeo()
    var minx = bbox[0].toFixed(4)
    var miny = bbox[1].toFixed(4)
    var maxx = bbox[2].toFixed(4)
    var maxy = bbox[3].toFixed(4)
	var bboxStr = minx + "," + miny + "," + maxx + "," + maxy;
	return bboxStr;
}
readCollections(urlService, fnDone, fnFail) {
	var url = urlService + "/collections";
	$.getJSON( url, {})
	.done (function(data) {
		fnDone( data.collections );
	})
	.fail(fnFail);
	return [];
}
addLayerFC(title, host, name, params, options) {
	return this._addLayer( new LayerFC(this, title, host, name, params, options) );
}
addLayerDS(title, url, options) {
	return this._addLayer( new LayerDS(this, title, url, options) );
}
addLayerVT(title, url, options) {
	return this._addLayer( new LayerVT(this, title, url, options));
}
_addLayer(lyr) {
	let ollyr = lyr.createOLLayer();
	this.map.addLayer( ollyr );
	return lyr;
}
installMousePos (id) {
    var map = this.map;
    map.on('pointermove', (evt) => {
        let ptGeo = ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
        let pFormat = ol.coordinate.toStringXY(ptGeo, 4);
        let divPos = document.getElementById(id);
        divPos.innerHTML = pFormat + ' / ' + map.getView().getZoom().toFixed(1);
    });
}
_installOverlay() {
	let map = this.map;
	let overlay = new ol.Overlay({
		element: document.getElementById('popup-container'),
		positioning: 'bottom-center',
		offset: [0, -10]
	});
	map.addOverlay(overlay);

	map.on('click', function(evt) {
		overlay.setPosition();
		var features = map.getFeaturesAtPixel(evt.pixel);
		var loc = evt.coordinate
		if (features && features.length > 0) {
			var identifier = features[0].getId();
			var popup = 'Id: ' + identifier
			overlay.getElement().innerHTML = popup;
			overlay.setPosition(loc);
		}
	});
}
onFeatureClick(fn) {
	let map = this.map;
	this.map.on('click', function(evt) {
		var features = map.getFeaturesAtPixel(evt.pixel);
		var loc = evt.coordinate
		var feature = null;
		if (features && features.length > 0) {
			feature = features[0];
		}
		// call even if feature not found, to allow updating UI
		fn( feature );
	});
}
} // PGMap

function chooseColor(num) {
	var COLORS = [
		"#0000FF",
		"#880000",
		"#00a000",
		"#0000c0",
		"#00FFFF",
		"#6b5b95",
		"#ff7b25",
		"#896d51",
		"#405d27",
		"#50394c",
		"#4e7d84",
		"#618685",
		"#bc5a45",
		"#36486b",
		'#ff0000'
	];
	return COLORS[ num % COLORS.length ];
}
function createStyleFunction(clr, lblName) {
	var styles = createStyles(clr);
	return function(feature) {
		let ftype = feature.getGeometry().getType();
		let sty = styles[ftype];
		if (lblName) {
			let val = feature.get(lblName);
			let txt = "" + val;
			let textSpec = {
				text: txt,
				font: '14px sans-serif',
				fill: new ol.style.Fill({ color: clr }),
			};
			// offset for points and lines
			if (ftype == 'Point') {
				textSpec.offsetY = -14;	}
			sty.setText( new ol.style.Text(textSpec) );
		}
		return sty;
	}
}
function createStyles(clr) {
	var clrFill = clr + '20';
	var imageCircle = new ol.style.Circle({
		radius: 5,
		fill: new ol.style.Fill({ color: clr }),
		stroke: new ol.style.Stroke({color: clr, width: 1})
	});

	var styles = {
		'Point': new ol.style.Style({
			image: imageCircle
		}),
		'LineString': new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: clr,
				width: 2
			})
		}),
		'MultiLineString': new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: clr,
				width: 2
			})
		}),
		'MultiPoint': new ol.style.Style({
			image: imageCircle
		}),
		'MultiPolygon': new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: clr,
				width: 2
			}),
			fill: new ol.style.Fill({
				color: clrFill
			})
		}),
		'Polygon': new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: clr,
				width: 2
			}),
			fill: new ol.style.Fill({
				color: clrFill
			})
		}),
		'GeometryCollection': new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: clr,
				width: 2
			}),
			fill: new ol.style.Fill({
				color: clrFill
			}),
			image: imageCircle
		}),
		'Circle': new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: clr,
				width: 2
			}),
			fill: new ol.style.Fill({
				color: clrFill
			})
		})
	}
	return styles;
}
STYLE_CACHE = {};
STYLE_SINGLE = new ol.style.Style({
	image: new ol.style.Circle({
		radius: 5,
		fill: new ol.style.Fill({ color: '#0000ff' })
	})
});
function styleCluster(feature) {
	var size = feature.get('features').length;
	if (size == 1) return STYLE_SINGLE;
	var style = STYLE_CACHE[size];
	if (!style) {
		style = new ol.style.Style({
			image: new ol.style.Circle({
				radius: 10,
				stroke: new ol.style.Stroke({ color: '#fff'	}),
				fill: new ol.style.Fill({ color: '#3399CC' })
			}),
			text: new ol.style.Text({
				text: size.toString(),
				fill: new ol.style.Fill({ color: '#fff'	})
			})
		});
		STYLE_CACHE[size] = style;
	}
	return style;
}
