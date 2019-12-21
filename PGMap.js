function PGMap(divid, options) {
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
}

PGMap.prototype.addLayer = function(title, url) {
	var clrDefault = '#0000ff';
	let src = new ol.source.Vector();
    var olLayer = new ol.layer.Vector({
        source: src,
        style: createStyleFunction(clrDefault)
    });
	this.map.addLayer(olLayer);

	let lyr = {
		title: title,
		url: url,
		color: clrDefault,
		olLayer: olLayer
	}
	this._loadLayer(lyr, true);
	return lyr;
}

PGMap.prototype._loadLayer = function(lyr, doZoom) {
	let self = this;

	let src = lyr.olLayer.getSource();
	src.clear();

	// DEVELOPMENT ONLY
	/*
	layerSetFeaturesMock(lyr);
	this.layerZoom(lyr);
	return;
*/

	$.when(
		$.getJSON( lyr.url, {})
		.done (function(data) {
		  var features = (new ol.format.GeoJSON()).readFeatures(data, {
			featureProjection: 'EPSG:3857'
		  } );
		  src.addFeatures(features);
		  if (doZoom) {
			  self.layerZoom(lyr);
		  }
		})
		.fail(function(data) {
		  console.log("geojson error in "+ lyr.url);
		})
	  ).then(function() {
		  //console.log("geojson file loaded: "+ lyr.url);
	  });
}

PGMap.prototype.layerZoom = function(lyr) {
	let olmap = this.map;
	let lyrext = lyr.olLayer.getSource().getExtent();
	let sz = Math.max( ol.extent.getWidth(lyrext), ol.extent.getHeight(lyrext) );
	let ext = ol.extent.buffer( lyrext,  0.2 * sz);
    olmap.getView().fit( ext, olmap.getSize());
}
PGMap.prototype.removeLayer = function(lyr) {
	this.map.removeLayer(lyr.olLayer);
}
PGMap.prototype.layerSetVisible = function(lyr, isVis) {
	lyr.olLayer.setVisible(isVis);
}
PGMap.prototype.layerReload = function(lyr) {
	this._loadLayer(lyr);
}
PGMap.prototype.layerColor = function(lyr, clr) {
	lyr.olLayer.setStyle( createStyleFunction( clr ));
}
PGMap.prototype.installMousePos = function(id) {
    var map = this.map;
    map.on('pointermove', (evt) => {
        let ptGeo = ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
        let pFormat = ol.coordinate.toStringXY(ptGeo, 4);
        let divPos = document.getElementById(id);
        divPos.innerHTML = pFormat + ' / ' + map.getView().getZoom().toFixed(1);
    });
}

PGMap.prototype._installOverlay = function() {
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
PGMap.prototype.onFeatureClick = function(fn) {
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
