/**
	Creates a BaseAssetHandler.
	@class This class is used as the base for all asset handlers in the engine. 
	  It is implemented as an object pool, fetching data from the server when it isn't in the local cache and loading the resource appropiately.
	@property cache A map of the fetched resources.
	@exports BaseAssetHandler as Graphics.BaseAssetHandler.
*/
function BaseAssetHandler() {
	this.cache = {};
}

/**
	This method is called when the remote request is completed and is expected to treat the response data. The returned data will be stored in 
	the cache and used to call the callback given to AssetHandlers.BaseAssetHandler#get.
	This method is expected to be overriden to create new asset handlers.
	@param {WebGLContext} gl The webgl context used to handle most resources.
	@param {String} url The url used to request the asset to the server.
	@param response The response text in the request to the remote server.
	@see AssetHandlers.BaseAssetHandler#get
	@returns The loaded asset to be returned.
*/
BaseAssetHandler.prototype.parseResponse = function(gl, url, response) {
	if (url.match(/[^.]*.json$/)) {
		return JSON.parse(response);
	}
	return response;
};

/**
	Gets a resource from the server or local cache.
	@param {WebGLContext} gl The webgl context used to handle most resources.
	@param {String} url The name of the resource in the server.
	@param {Function} onSuccess This callback will be called with the loaded 
	asset when the resource is ready.
	@param {Function} [onError] This callback will be called if an error occurrs
	loading the resource, with the error code and asser url.
	@throws {MissingParameterException} If one of the required parameters is missing.
	@throws {ResourceNotFoundException} If the requested asset could not be fetched.
*/
BaseAssetHandler.prototype.get = function(gl, url, onSuccess, onError) {
	var request, that;
	if (!((gl != null) && (url != null) && (onSuccess != null))) throw "BaseAssetHandler#get expects gl context, resource url, and onSuccess callback";
	
	that = this;
	if (this.cache[url] != null) {
		onSuccess(this.cache[url]);
		return;
	}

	request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.onreadystatechange = function() {
		if (request.status >= 400 && onError) {
			onError(request.status, url);
			return;
		}

		if (request.readyState === 4 && request.status < 400) {
			that.cache[url] = that.parseResponse(gl, url, request.responseText);
			return onSuccess(that.cache[url]);
		}
	};
	request.send(null);
	return this;
};

/**
	This will be called when the loaded resource is freed, and is expected to do whatever steps are necessary to free it properly.
	@param {WebGLContext} gl The webgl context used to handle most resources.
	@param asset The asset to be freed.
*/
BaseAssetHandler.prototype.freeAsset = function(gl, asset) {};

/**
	The given object will be freed.
	@param {WebGLContext} gl The webgl context used to handle most resources.
	@param {String} url The name of the resource in the server.
	@param {Function} [callback] This callback will be called when the resource is freed.
	@throws {MissingParameterException} If one of the required parameters is missing.
*/
BaseAssetHandler.prototype.free = function(gl, url, callback) {
	if (!((gl != null) && (url != null))) throw "BaseAssetHandler#free expects gl context, resource url and callback.";
	if (this.cache[url] != null) {
		this.freeAsset(gl, this.cache[url]);
		delete this.cache[url];
		if (callback != null) callback();
	}
	return;
};

module.exports = BaseAssetHandler;