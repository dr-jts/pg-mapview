
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
mapExtentGeo() {
	var extent = this.map.getView().calculateExtent(this.map.getSize());
	return ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
}
mapExtentStr(numDecimals) {
	var fix = 4
	if (numDecimals) fix = numDecimals;
    var bbox = this.mapExtentGeo()
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
layerAdd (title, url, params, genURLFn) {
	var clrDefault = chooseColor(this.layerCounter);
	let src = new ol.source.Vector();
    var olLayer = new ol.layer.Vector({
        source: src,
        style: createStyleFunction(clrDefault)
    });
	this.map.addLayer(olLayer);
	this.layerCounter++;
	let lyr = {
		id: this.layerCounter,
		title: title,
		url: url,
		parameters: params,
		genURLFn: genURLFn,
		color: clrDefault,
		olLayer: olLayer,
		numFeatures: 0,
		loadTime: 0,
		textStatus: ''
	}
	return lyr;
}
layerVTAdd(title, urlLayer) {
	var clrDefault = chooseColor(this.layerCounter);
	var url = urlLayer + '/{z}/{x}/{y}.pbf';
	const olLayer= new ol.layer.VectorTile({
		className: "dataLayer", // needed to avoid base labels disappearing?
		style: createStyleFunction(clrDefault),
		//declutter: true,
		minZoom: 5,
		source: new ol.source.VectorTile({
			format: new ol.format.MVT(),
			url: url,
			minZoom: 5,
			maxZoom: 16
		})
	});
	this.map.addLayer(olLayer);
	this.layerCounter++;
	let lyr = {
		id: this.layerCounter,
		title: title,
		url: url,
		color: clrDefault,
		olLayer: olLayer,
		loadTime: 0,
		textStatus: ''
	}
	return lyr;
}
layerLoad(lyr, doZoom) {
	let self = this;

	let src = lyr.olLayer.getSource();
	src.clear();

	var urlReq = lyr.genURLFn(lyr.url, lyr.parameters);
	/* ---------  // DEVELOPMENT ONLY
	layerSetFeaturesMock(lyr);
	this.layerZoom(lyr);
	return;
*/
	var timeStart = Date.now();
	var prom = $.when(
		$.getJSON( urlReq, {})
		.done (function(data, textStatus, jqXHR) {
			lyr.statusMsg = textStatus;
			lyr.statusCode = jqXHR.status;
			var timeEnd = Date.now();
			lyr.loadTime = timeEnd - timeStart;
			var features = (new ol.format.GeoJSON()).readFeatures(data, {
				featureProjection: 'EPSG:3857'
			} );
			lyr.numFeatures = features.length;
			src.addFeatures(features);
			if (doZoom) {
				self.layerZoom(lyr);
			}
		})
		.fail(function(jqXHR, textStatus) {
			lyr.statusMsg = textStatus;
			lyr.statusCode = jqXHR.status;
		  	console.log("geojson error in "+ lyr.url);
		})
	  );
	  return prom;
}
layerZoom(lyr) {
	let olmap = this.map;
	let lyrext = lyr.olLayer.getSource().getExtent();
	let sz = Math.max( ol.extent.getWidth(lyrext), ol.extent.getHeight(lyrext) );
	let ext = ol.extent.buffer( lyrext,  0.2 * sz);
    olmap.getView().fit( ext, olmap.getSize());
}
removeLayer(lyr) {
	this.map.removeLayer(lyr.olLayer);
}
layerSetVisible(lyr, isVis) {
	lyr.olLayer.setVisible(isVis);
}
layerColor(lyr, clr) {
	//console.log(clr);
	lyr.olLayer.setStyle( createStyleFunction( clr ));
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
}
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
function createStyleFunction(clr) {
	var styles = createStyles(clr);
	return function(feature) {
		return styles[feature.getGeometry().getType()];
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
