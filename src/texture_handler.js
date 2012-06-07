var BaseAssetHandler = require("./base_asset_handler");

var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
	for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
	function ctor() { this.constructor = child; }
	ctor.prototype = parent.prototype;
	child.prototype = new ctor;
	child.__super__ = parent.prototype;
	return child;
};

__extends(TextureHandler, BaseAssetHandler);
/**
	Creates a TextureHandler.
	@class This class is used to fetch images from the server and create a texture from them, will act as a ObjectPool.
	@exports TextureHandler as AssetHandlers.TextureHandler.
	@augments BaseAssetHandler
*/
function TextureHandler() {
	TextureHandler.__super__.constructor.apply(this, arguments);
}

/**
	This method is called when the remote request is completed and is expected to treat the response data. The returned data will be stored
	in the cache and used to call the callback given to AssetHandlers.TextureHandler#get.
	This method is expected to be overriden to create new asset handlers.
	@param {WebGLContext} gl The webgl context used to handle most resources.
	@param {String} url The url used to request the asset to the server.
	@param response The response text in the request to the remote server.
	@see AssetHandlers.TextureHandler#get
	@returns {WebGLTexture} The loaded texture to be returned.
*/
TextureHandler.prototype.parseResponse = function(gl, url, response) {
	if (url.match(/[^\.]*.(jpg|jpeg|bmp|gif|png)$/)) {
		return Utils.createTexture(gl, response);
	}
};

/**
	Gets a resource from the server or local cache.
	@param {WebGLContext} gl The webgl context used to handle most resources.
	@param {String} url The name of the resource in the server.
	@param {Function} onSuccess This callback will be called with the loaded asset when the resource is ready.
	@param {Function} [onError] This callback will be called if an error occurrs loading the resource, with the error code and asser url.
	@throws {MissingParameterException} If one of the required parameters is missing.
	@throws {ResourceNotFoundException} If the requested asset could not be fetched.
*/
TextureHandler.prototype.get = function(gl, url, onSuccess, onError) {
	var that = this;
	if (!((gl != null) && (url != null) && (onSuccess != null))) throw "TextureHandler#get expects gl context, resource url, and onSuccess callback.";

	if (this.cache[url] != null) {
		onSuccess(this.cache[url]);
		return;
	}

	var image = new Image();
	image.addEventListener('load', function() {
		that.cache[url] = that.parseResponse(gl, url, image);
		onSuccess(that.cache[url]);
	});

	image.addEventListener('error', function() {
		if (onError != null) {
			onError('Unknown', url);
			return;
		}
	});

	image.src = url;
};

/**
	This will be called when the loaded resource is freed, and is expected to 
	do whatever steps are necessary to free it properly.
	@param {WebGLContext} gl The webgl context used to handle most resources.
	@param asset The asset to be freed.
*/
TextureHandler.prototype.freeAsset = function(gl, asset) {
	Utils.deleteTexture(gl, asset);
};

module.exports = TextureHandler;