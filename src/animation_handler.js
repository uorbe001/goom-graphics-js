var BaseAssetHandler = require("./base_asset_handler"), Animation = require("./animation");

var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
	for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
	function ctor() { this.constructor = child; }
	ctor.prototype = parent.prototype;
	child.prototype = new ctor();
	child.__super__ = parent.prototype;
	return child;
};

__extends(AnimationHandler, BaseAssetHandler);
/**
	Creates a AnimationHandler.
	@class This class is used to fetch model animations.
	@exports AnimationHandler as Graphics.AnimationHandler.
	@augments BaseAssetHandler
*/
function AnimationHandler() {
	AnimationHandler.__super__.constructor.apply(this, arguments);
}

/**
	This method is called when the remote request is completed and is expected to treat the response data. The returned data will be stored in
	the cache and used to call the callback given to AssetHandlers.AnimationHandler#get.
	This method is expected to be overriden to create new asset handlers.
	@param {WebGLContext} gl The webgl context used to handle most resources.
	@param {String} url The url used to request the asset to the server.
	@param response The response text in the request to the remote server.
	@see AssetHandlers.AnimationHandler#get
	@returns {WebGLTexture} The loaded texture to be returned.
*/
AnimationHandler.prototype.parseResponse = function(gl, url, response) {
	if (url.match(/[^\.]*.wglanim$/)) {
		var animation = new Animation();
		animation.load(JSON.parse(response));
		return animation;
	}
};

/**
	This will be called when the loaded resource is freed, and is expected to 
	do whatever steps are necessary to free it properly.
	@param {WebGLContext} gl The webgl context used to handle most resources.
	@param asset The asset to be freed.
*/
AnimationHandler.prototype.freeAsset = function(gl, asset) {
	return; //Garbage collector will take care of it.
};

module.exports = AnimationHandler;