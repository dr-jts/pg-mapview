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
        this.renderType = Layer.RENDER.PLAIN;
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
    getURL() {
        return this.url;
    }
    move(delta) {
        let layerColl = this.olmap().getLayers();
        let layerArr = layerColl.getArray();
        let index = layerArr.indexOf(this.olLayer);

        if (delta == 0) return; // idiot-proofing
        if (delta > 0) { // move up
            var indexNew = index + 1;
        }
        else { // move down
            indexNew = index - 1;
        }
        if (indexNew == 0 || indexNew >= layerArr.length)
            return;
        layerColl.removeAt(index);
        layerColl.insertAt(indexNew, this.olLayer);
    }
    zoom() {
        let lyrext = this._baseSource().getExtent();
        let sz = Math.max( ol.extent.getWidth(lyrext), ol.extent.getHeight(lyrext) );
        let ext = ol.extent.buffer( lyrext,  0.2 * sz);
        this.olmap().getView().fit( ext, this.olmap().getSize());
    }
    remove() {
        this.olmap().removeLayer(this.olLayer);
    }

    setRender(renderType = Layer.RENDER.PLAIN) {
        // do not change if not needed
        if (this.renderType == renderType) return;
        let src = this._baseSource();
        let ollyrNew = null;
        switch (renderType) {
        case Layer.RENDER.PLAIN:
                ollyrNew = this._createBasicLayer(src, false);
                break;
        case Layer.RENDER.DECLUTTER:
                ollyrNew = this._createBasicLayer(src, true);
                break;
        case Layer.RENDER.CLUSTER:
            ollyrNew = this._createClusterLayer(src);
            break;
        case Layer.RENDER.HEATMAP:
            ollyrNew = this._createHeatmapLayer(src);
            break;
        }
        if (! ollyrNew) return;
        this._setOLLayer(ollyrNew);
        // must re-init style since
        //this._initStyle();
        this.renderType = renderType;
    }
    // subclasses override render types they support
    // _createBasicLayer must be provided
    _createBasicLayer(src, isDeclutter = false) {
        console.log('ERROR - Layer does not provide _createBasicLayer');
        return null;
    }
    _createHeatmapLayer(src) {  return null;  }
    _createClusterLayer(src) {  return null;  }

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
    setTitle(title) {
        this.title = title;
    }
    setVisible(isVis) {
        this.olLayer.setVisible(isVis);
    }
    _setOLLayer(ollyrNew) {
        // allows layer conversion methods to return null if not possible
        if (! ollyrNew) return;
        let layerColl = this.olmap().getLayers();
        let layerArr = layerColl.getArray();
        let index = layerArr.indexOf(this.olLayer);
        layerColl.setAt(index, ollyrNew);
        this.olLayer = ollyrNew;
    }
    _createStyleFunction() {
        return createStyleFunction(
            this.style.color,
            this.style.isLabelled ? this.style.labelProp : null
        );
    }
    _initStyle() {
        let style = this._createStyleFunction();
        this.olLayer.setStyle( style );
    }
    _baseSource() {
        // if source is clustered need to dig down to data source
        let src = this.olLayer.getSource();
        if (src instanceof ol.source.Cluster) {
            return src.getSource();
        }
        return src;
    }
}
// used for UI layer ID
Layer.idCounter = 0;
Layer.RENDER = {
    PLAIN: 1,
    DECLUTTER: 2,
    CLUSTER: 3,
    HEATMAP: 4
};

// A layer for a GeoJSON dataset
class LayerVector extends Layer {
    constructor(map, title, url, params = null, options = {}) {
        super(map, title, url, params, options);
    }
    createOLLayer() {
        let src = new ol.source.Vector();
        let ollyr = this._createBasicLayer(src);
        this.olLayer = ollyr;
        return ollyr;
    }
    _createBasicLayer(src, isDeclutter = false) {
        var lyr =new ol.layer.Vector({
            source: src,
            declutter: isDeclutter,
            style: this._createStyleFunction()
        });
        return lyr;
    }
    _createHeatmapLayer(src) {
        var lyr = new ol.layer.Heatmap({
            source: src,
            radius: 10,
            weight: function(feature) { return 1; },
        });
        return lyr;
    }
    _createClusterLayer(src) {
        var clusterSource = new ol.source.Cluster({
            distance: 40,
            source: src
        });
        var lyr = new ol.layer.Vector({
            source: clusterSource,
            style: styleCluster
        });
        return lyr;
    }
    getURL() {
        return OAF.urlWithParams(this.url, this.parameters);
    }

    load(doZoom) {
        let src = this._baseSource();
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
class LayerDS extends LayerVector {
    constructor(map, title, url, options = {}) {
        super(map, title, url, null, options);
    }
}
class LayerFC extends LayerVector {
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
        let src = new ol.source.VectorTile({
            format: new ol.format.MVT(),
            url: urlTile,
            minZoom: 5,
            maxZoom: 16
        })
        let ollyr = this._createBasicLayer(src);
        this.olLayer = ollyr;
        return ollyr;
    }
    _createBasicLayer(src, isDeclutter = false) {
        let olLayer = new ol.layer.VectorTile({
            className: "dataLayer", // needed to avoid base labels disappearing?
            style: this._createStyleFunction(),
            declutter: isDeclutter,
            minZoom: 5,
            source: src
        });
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
