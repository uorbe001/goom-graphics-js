var BaseAssetHandler = require("./base_asset_handler"), Utils = require("./utils");

var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
	for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
	function ctor() { this.constructor = child; }
	ctor.prototype = parent.prototype;
	child.prototype = new ctor;
	child.__super__ = parent.prototype;
	return child;
};

__extends(ProgramHandler, BaseAssetHandler);
/**
	Creates a ProgramHandler.
	@class This class is used to fetch webgl programs, it will fetch the program declaration, used shaders, build and link the program.
	@exports ProgramHandler as Graphics.ProgramHandler.
	@augments BaseAssetHandler
*/
function ProgramHandler() {
	ProgramHandler.__super__.constructor.apply(this, arguments);
}

/**
	This method is called when the remote request is completed and is expected to treat the response data. The returned data will be stored in
	the cache and used to call the callback given to AssetHandlers.ProgramHandler#get.
	This method is expected to be overriden to create new asset handlers.
	@param {WebGLContext} gl The webgl context used to handle most resources.
	@param {String} url The url used to request the asset to the server.
	@param response The response text in the request to the remote server.
	@see AssetHandlers.ProgramHandler#get
	@returns {WebGLTexture} The loaded texture to be returned.
*/
ProgramHandler.prototype.parseResponse = function(gl, url, response) {
	var fShader, vShader;
	if (url.match(/[^\.]*.wglprog$/)) {
		vShader = response.match(/<vertex>((.|\n)*)<\/vertex>/)[1];
		fShader = response.match(/<fragment>((.|\n)*)<\/fragment>/)[1];
		return Utils.createProgram(gl, vShader, fShader);
	}
};

/**
	This will be called when the loaded resource is freed, and is expected to 
	do whatever steps are necessary to free it properly.
	@param {WebGLContext} gl The webgl context used to handle most resources.
	@param asset The asset to be freed.
*/
ProgramHandler.prototype.freeAsset = function(gl, asset) {
	return Utils.deleteProgram(gl, asset);
};

module.exports = ProgramHandler;