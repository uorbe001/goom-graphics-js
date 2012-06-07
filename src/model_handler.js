var BaseAssetHandler = require("./base_asset_handler"), Model = require("./model");

var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
	for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
	function ctor() { this.constructor = child; }
	ctor.prototype = parent.prototype;
	child.prototype = new ctor;
	child.__super__ = parent.prototype;
	return child;
};

/**
	Creates a ModelHandler.
	@class This class is used to fetch models used for rendering and load all the required resources for them to be usable.
	@exports ModelHandler as AssetHandlers.ModelHandler.
	@augments BaseAssetHandler
*/
__extends(ModelHandler, BaseAssetHandler);
function ModelHandler() {
	ModelHandler.__super__.constructor.apply(this, arguments);
}

/**
	This method is called when the remote request is completed and is expected to treat the response data. The returned data will be
	stored in the cache and used to call the callback given to AssetHandlers.ModelHandler#get.
	This method is expected to be overriden to create new asset handlers.
	@param {WebGLContext} gl The webgl context used to handle most resources.
	@param {String} url The url used to request the asset to the server.
	@param model_data The response text in the request to the remote server.
	@param buffer The response in the request to the remote server asking for the vertex buffer.
	@see AssetHandlers.ModelHandler#get
	@returns {Model} The loaded model to be returned.
*/
ModelHandler.prototype.parseResponse = function(gl, url, model_data, buffer) {
	if (url.match(/[^\.]*.wglmodel$/)) {
		var model = new Model();
		model.load(gl, JSON.parse(model_data), buffer);
		return model;
	}

	return null;
};

/**
	Gets a resource from the server or local cache.
	@param {WebGLContext} gl The webgl context used to handle most resources.
	@param {String} url The name of the resource in the server.
	@param {Function} onSuccess This callback will be called with the loaded  asset when the resource is ready.
	@param {Function} [onError] This callback will be called if an error occurrs loading the resource, with the error code and asser url.
	@throws {MissingParameterException} If one of the required parameters is missing.
	@throws {ResourceNotFoundException} If the requested asset could not be fetched.
*/
ModelHandler.prototype.get = function(gl, url, onSuccess, onError) {
	var model_complete, model_response, request, that, url_vert, vert_complete, vert_request, vert_response;
	if (!((gl != null) && (url != null) && (onSuccess != null))) throw "ModelHandler#get expects a gl context, resource url, and onSuccess callback";

	that = this;
	model_complete = vert_complete = false;
	vert_response = model_response = null;
	
	//Return cached model.
	if (this.cache[url] != null) {
		onSuccess(this.cache[url]);
		return;
	}

	vert_request = new XMLHttpRequest();
	url_vert = url.match(/([^\.]*)\.wglmodel/)[1];
	url_vert += '.wglvert';
	vert_request.open('GET', url_vert, true);
	vert_request.responseType = "arraybuffer";

	vert_request.onreadystatechange = function() {
		if (vert_request.status >= 400 && (onError != null)) {
			onError(vert_request.status, url);
			return;
		}

		if (vert_request.readyState === this.DONE && vert_request.status < 400) {
			vert_complete = true;
			vert_response = vert_request.response;
			
			if (!model_complete) return;
			
			that.cache[url] = that.parseResponse(gl, url, model_response, vert_response);
			onSuccess(that.cache[url]);
			return;
		}
	};

	vert_request.send(null);
	request = new XMLHttpRequest();
	request.open('GET', url, true);

	request.onreadystatechange = function() {
		if (request.status >= 400 && (onError != null)) {
			onError(request.status, url);
			return;
		}
		if (request.readyState === this.DONE && request.status < 400) {
			model_complete = true;
			model_response = request.responseText;

			if (!vert_complete) return;
		
			that.cache[url] = that.parseResponse(gl, url, model_response, vert_response);
			onSuccess(that.cache[url]);
			return;
		}
	};

	request.send(null);
};

/**
	This will be called when the loaded resource is freed, and is expected to 
	do whatever steps are necessary to free it properly.
	@param {WebGLContext} gl The webgl context used to handle most resources.
	@param asset The asset to be freed.
*/
ModelHandler.prototype.freeAsset = function(gl, asset) {
	asset.free(gl);
};


module.exports = ModelHandler;