var BaseAssetHandler = require("./base_asset_handler");

/**
	Creates an AssetManager.
	@class Asset manager is used to handle the different assets in the game. It is implemented following the Monostate pattern, and will act
	similarly to factory pattern implementations.
	@exports AssetManager as Graphics.AssetManager
*/
function AssetManager() {

}

//Handlers will be stored here.
AssetManager.handlers = {};
//The default handler is the base asset handler
AssetManager.defaultHandler = new BaseAssetHandler();

/**
	Registers a new handler for resources matching the given regex. The handler
	will be a new instance of the class named in the second parameter, and
	must extend AssetHandlers.BaseAssetHandler.
	@param {String} extension A string containing the extension to be matched  agains the url names when loading a resource. This shouldn't be
	an actual RegEx, it has to go without the start and end slashes.
	@param	handler A handler for the regex, it must extend AssetHandlers.BaseAssetHandler.
	@throws {MissingParameterException} If one of the required parameters ismissing.
*/
AssetManager.prototype.registerHandler = function(extension, handler) {
	if (!((extension !== null) && (handler !== null))) throw "AssetManager#registerHandler expects an extension and a handler";
	AssetManager.handlers[extension] = handler;
};

/**
	Gets a resource from the server or local cache. If a handler for this asset  type has been registered, the returned object is treated
	by this handler, otherwise the asset will be treated by the default handler.
	@param {WebGLContext} gl The webgl context used to handle most resources.
	@param {String} url The name of the resource in the server.
	@param {Function} onSuccess This callback will be called with the loaded  asset when the resource is ready.
	@param {Function} [onError] This callback will be called if an error occurrs loading the resource, with the error code and asser url.
	@throws {MissingParameterException} If one of the required parameters is missing.
*/
AssetManager.prototype.get = function(gl, url, onSuccess, onError) {
	var extension, handler;
	if (!((gl != null) && (url != null) && (onSuccess != null))) throw "AssetManager#get expects a gl context, resource url and onSuccess callback";

	var handlers = AssetManager.handlers;
	for (extension in handlers) {
		handler = handlers[extension];
		//If this url is not matched by this handler, keep looking.
		if (!url.match(new RegExp("[^\.]*." + extension + "$"))) continue;

		handler.get(gl, url, onSuccess, onError);
		return;
	}

	AssetManager.defaultHandler.get(gl, url, onSuccess, onError);
};

/**
	The given object will be freed by the same handler used to load it.
	@param {WebGLContext} gl The webgl context used to handle most resources.
	@param {String} url The name of the resource in the server.
	@param {Function} [callback] This callback will be called when the resource is freed.
	@throws {MissingParameterException} If one of the required parameters is missing.
*/
AssetManager.prototype.free = function(gl, url, callback) {
	var extension, handler;
	if (!((gl != null) && (url != null))) throw "AssetManager#free expects a gl context and resource url";
	
	var handlers = AssetManager.handlers;
	for (extension in handlers) {
		handler = handlers[extension];
		//If this url is not matched by this handler, keep looking.
		if (!url.match(new RegExp("[^\.]*\." + extension + "$"))) continue;

		handler.free(gl, url, callback);
		return;
	}

	AssetManager.defaultHandler.free(gl, url, callback);
	return;
};

module.exports = AssetManager;