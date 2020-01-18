class Layer {  // abstract
    constructor(map, title, url, params = null, options = {}) {
        let id = Layer.idCounter++;

        if (! title) title = "Layer " + id;
        this.pgmap = map;
        this.idCounter++;
        this.title = title;
        this.url = url
        this.parameters = params
        this.style = {
            color: chooseColor(id),
            isLabelled: false,
            labelProp: ''
        };
        this.options = options;

        // init by subclasses
        this.olLayer = null;

        // dynamico properties
        this.info = {
            numFeatures: 0,
            loadTime: 0,
            textStatus: ''
        };
    }
    olmap() {
        return this.pgmap.map;
    }
    zoom() {
        let lyrext = this.olLayer.getSource().getExtent();
        let sz = Math.max( ol.extent.getWidth(lyrext), ol.extent.getHeight(lyrext) );
        let ext = ol.extent.buffer( lyrext,  0.2 * sz);
        this.olmap().getView().fit( ext, this.olmap().getSize());
    }
    remove() {
        this.olmap().removeLayer(this.olLayer);
    }
    setVisible(isVis) {
        this.olLayer.setVisible(isVis);
    }
    setColor(clr) {
        //console.log(clr);
        this.style.color = clr;
        this._initStyle();
    }
    setLabel(labelProp, isLabelled) {
        //console.log(clr);
        this.style.labelProp = labelProp;
        this.style.isLabelled = isLabelled;
        this._initStyle();
    }
    _initStyle() {
        let style = createStyleFunction( this.style.color,
            this.style.isLabelled ? this.style.labelProp : null)
        this.olLayer.setStyle( style );
    }
}
Layer.idCounter = 0;
// A layer for a GeoJSON dataset
class LayerDS extends Layer {
    constructor(map, title, url, params = null, options = {}) {
        super(map, title, url, params, options);
    }
    createOLLayer() {
        let src = new ol.source.Vector();
        let isHM = this.options && this.options.isHeatmap;
        let ollyr = null;
        if (isHM) {
            ollyr = new ol.layer.Heatmap({
                    source: src,
                radius: 10,
                weight: function(feature) { return 1; },
                //style: createStyleFunction(this.style.color)
            });
        }
        else {
            ollyr = new ol.layer.Vector({
                source: src,
                declutter: this.options.isDeclutter,
                style: createStyleFunction(this.style.color)
            });
        }
        this.olLayer = ollyr;
        return ollyr;
    }
    getURL() {
        return OAF.urlWithParams(this.url, this.parameters);
    }
    load(doZoom) {
        let src = this.olLayer.getSource();
        src.clear();

        let urlReq = this.getURL();

        /* ---------  // DEVELOPMENT ONLY
        layerSetFeaturesMock(lyr);
        this.layerZoom(lyr);
        return;
    */
        var timeStart = Date.now();
        var prom = $.when(
            $.getJSON( urlReq, {})
            .done ((data, textStatus, jqXHR) => {
                this.statusMsg = textStatus;
                this.statusCode = jqXHR.status;
                var timeEnd = Date.now();
                this.loadTime = timeEnd - timeStart;
                var features = (new ol.format.GeoJSON()).readFeatures(data, {
                    featureProjection: 'EPSG:3857'
                } );
                this.numFeatures = features.length;
                src.addFeatures(features);
                if (doZoom) {
                    this.zoom();
                }
            })
            .fail( (jqXHR, textStatus) => {
                this.statusMsg = textStatus;
                this.statusCode = jqXHR.status;
                  console.log("geojson error in " + urlReq);
            })
          );
          return prom;
    }
}
class LayerFC extends LayerDS {
    constructor(map, title, service, name, params, options = {}) {
        super(map, title, OAF.urlItems(service, name), params, options);
        this.service = service;
        this.name = name;
    }
}
class LayerVT extends Layer {
    constructor(map, title, url, options = null) {
        super(map, title, url, null, options);
    }
    createOLLayer() {
        let urlTile = this.url + '/{z}/{x}/{y}.pbf';
        let olLayer= new ol.layer.VectorTile({
            className: "dataLayer", // needed to avoid base labels disappearing?
            style: createStyleFunction( this.style.color ),
            declutter: this.options.isDeclutter,
            minZoom: 5,
            source: new ol.source.VectorTile({
                format: new ol.format.MVT(),
                url: urlTile,
                minZoom: 5,
                maxZoom: 16
            })
        });
        this.olLayer = olLayer;
        return olLayer;
    }
    getURL() {
        return OAF.urlWithParams(this.url, this.parameters);
    }
}
OAF = {
    urlItems(host, name) {
        var url = `${host}/collections/${name}/items`;
        return url;
    },
    urlWithParams(url, param) {
        if (! param) return url;
        url = OAF.addQueryParam(url, "limit", param.limit);
        url = OAF.addQueryParam(url, "bbox", param.bbox);
        url = OAF.addQueryParam(url, "precision", param.precision);
        url = OAF.addQueryParam(url, "transform", param.transform);
        return url;
    },
    addQueryParam(url, name, value) {
        if (! value || value.length <= 0) return url;
        let hasQuery = url.indexOf('?') >= 0;
        let  delim = hasQuery ? '&' : '?';
        let  newUrl = `${url}${delim}${name}=${value}`;
        return newUrl;
    },
    // extract layer name from an OAF collection url, or null
    collectionName(url) {
        var rx = /collections\/(.*)\/items/g;
        var matches = rx.exec(url);
        if (! matches || matches.length <= 0) return null;
        var title = matches[1];
        return title;
    }
}
