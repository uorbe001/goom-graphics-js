var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var res = mod._cached ? mod._cached : mod();
    return res;
}

require.paths = [];
require.modules = {};
require.extensions = [".js",".coffee"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = x + '/package.json';
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key)
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

require.define = function (filename, fn) {
    var dirname = require._core[filename]
        ? ''
        : require.modules.path().dirname(filename)
    ;
    
    var require_ = function (file) {
        return require(file, dirname)
    };
    require_.resolve = function (name) {
        return require.resolve(name, dirname);
    };
    require_.modules = require.modules;
    require_.define = require.define;
    var module_ = { exports : {} };
    
    require.modules[filename] = function () {
        require.modules[filename]._cached = module_.exports;
        fn.call(
            module_.exports,
            require_,
            module_,
            module_.exports,
            dirname,
            filename
        );
        require.modules[filename]._cached = module_.exports;
        return module_.exports;
    };
};

if (typeof process === 'undefined') process = {};

if (!process.nextTick) process.nextTick = (function () {
    var queue = [];
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;
    
    if (canPost) {
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);
    }
    
    return function (fn) {
        if (canPost) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        }
        else setTimeout(fn, 0);
    };
})();

if (!process.title) process.title = 'browser';

if (!process.binding) process.binding = function (name) {
    if (name === 'evals') return require('vm')
    else throw new Error('No such module')
};

if (!process.cwd) process.cwd = function () { return '.' };

if (!process.env) process.env = {};
if (!process.argv) process.argv = [];

require.define("path", function (require, module, exports, __dirname, __filename) {
function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("/geometry.js", function (require, module, exports, __dirname, __filename) {
/**
	Creates a geometry, used for rendering basic geometry.
	@property vertexBuffer Buffer holding all of the vertex data used for this geometry.
	@property indexBuffer Buffer holding the index data used for drawing this geometry.
	@param {WebGLContext} gl The webgl context.
	@param {WebGLProgram} program
	@param data An object holding the geometry data.
**/
function Geometry(gl, program, data) {
	var vertex_data = [], index_data, x, y, z, i;
	this.program = program;
	//Prepare the necessary data depending on the given shape data.
	switch (data.type.toLowerCase()) {
		case 'sphere':
			break;
		case 'box':
			for (i = 0; i <= 7; i++) {
				x = Geometry.multipliers[i][0] * data.halfSize.x;
				y = Geometry.multipliers[i][1] * data.halfSize.y;
				z = Geometry.multipliers[i][2] * data.halfSize.z;
				vertex_data.push(x, y, z);
			}
			
			index_data = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 0, 4, 7, 0, 7, 1, 1, 7, 6, 1, 6, 2, 2, 6, 5, 2, 5, 3, 4, 0, 3, 4, 3, 5];
			break;
		case 'plane':
			break;
		default:
			throw "Unkwnown geometry type";
	}

	//Create the vertex buffer and store the vertex data in it.
	this.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex_data), gl.STATIC_DRAW);
	//Create the index data and store index data in it.
	this.indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(index_data), gl.STATIC_DRAW);
}

//These are used to create the cube vertices in the correct order.
Geometry.multipliers = [[1, 1, -1], [1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, 1], [-1, 1, 1], [-1, -1, 1], [1, -1, 1]];

/**
	Draws a single instance of this geometry.
	@param {WebGLContext} gl The webgl context.
	@param {Mathematics.Matrix4D} projection_matrix The projection matrix.
	@param {Mathematics.Matrix4D} view_matrix The view matrix.
	@param {Mathematics.Matrix4D} model_matrix The model matrix.
*/
Geometry.prototype.draw = function(gl, projection_matrix, view_matrix, model_matrix) {
	//Bind buffers
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	//Use this geometry's program.
	gl.useProgram(this.program);
	gl.enableVertexAttribArray(this.program.attributes.aPosition);
	gl.vertexAttribPointer(this.program.attributes.aPosition, 3, gl.FLOAT, false, 0, 0);
	gl.uniformMatrix4fv(this.program.uniforms.uProjectionMatrix, false, projection_matrix.data);
	gl.uniformMatrix4fv(this.program.uniforms.uViewMatrix, false, view_matrix.data);
	gl.uniformMatrix4fv(this.program.uniforms.uModelMatrix, false, model_matrix.data);
	//Draw
	gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
};

/**
	Draws multiple instances of this geometry.
	@param {WebGLContext} gl The webgl context.
	@param {Mathematics.Matrix4D} projection_matrix The projection matrix.
	@param {Mathematics.Matrix4D} view_matrix The view matrix.
	@param {Array} model_matrix_array Array holding the model matrix for each instance to be drawn.
*/
Geometry.prototype.drawInstances = function(gl, projection_matrix, view_matrix, model_matrix_array) {
	//Bind buffers
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	//Use this geometry's program.
	gl.useProgram(this.program);
	gl.enableVertexAttribArray(this.program.attributes.aPosition);
	gl.vertexAttribPointer(this.program.attributes.aPosition, 3, gl.FLOAT, false, 0, 0);
	gl.uniformMatrix4fv(this.program.uniforms.uProjectionMatrix, false, projection_matrix.data);
	gl.uniformMatrix4fv(this.program.uniforms.uViewMatrix, false, view_matrix.data);
	
	for(var i = 0, len = model_matrix_array.length; i < len; i++) {
		//Draw
		gl.uniformMatrix4fv(this.program.uniforms.uModelMatrix, false, model_matrix_array[i].data);
		gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
	}
};

module.exports = Geometry;
});

require.define("/utils.js", function (require, module, exports, __dirname, __filename) {
/**
	@namespace holds various utility functions.
*/
Utils = {};

/**
	Creates a gl shader from the source.
	@param {WebGLContext} gl The WebGL context.
	@param type Shader type, should equal the WebGL types.
	@param {String} source Source code of the shader.
	@throws If an error happens when building the shader.
	@returns The compiled shader.
*/
Utils.createShader = function(gl, type, source) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		var reason = gl.getShaderInfoLog(shader);
		throw "Could not compile shader.\n " + reason;
	}
	return shader;
};

/**
	Frees a shader from gpu.
	@param {WebGLContext} gl The WebGL context.
	@param {WebGLShader} shader The shader to free.
*/
Utils.deleteShader = function(gl, shader) {
	return gl.deleteShader(shader);
};

/**
	Creates a webgl shader program from the given source code.
	@param {WebGLContext} gl The WebGL context.
	@param {String} vertexShaderSource Source code of the vertex shader.
	@param {String} fragmentShaderSource Source code of the fragment shader.
	@throws If there's an error building the shasers or linking the program.
	@returns The linked shader program.
*/
Utils.createProgram = function(gl, vertexShaderSource, fragmentShaderSource) {
	var vShader, fShader;
	try {
		vShader = Utils.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
		fShader = Utils.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
	} catch (e) {
		throw e;
	}

	var shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vShader);
	gl.attachShader(shaderProgram, fShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		throw "Could not link shader program using the given vertex shader and fragment shader.";
	}

	var vMatches = vertexShaderSource.match(/uniform\s+[^\s]+\s+[^(\s|;)]+;/g);
	var fMatches = fragmentShaderSource.match(/uniform\s+[^\s]+\s+[^(\s|;)]+;/g);
	var i, len, uniform, uniformName, attribute, attributeName;

	if (fMatches !== null) {
		for (i = 0, len = fMatches.length; i < len; i++) {
			if (vMatches.indexOf(fMatches[i]) === -1) vMatches.push(fMatches[i]);
		}
	}

	shaderProgram.uniforms = {};
	for (i = 0, len = vMatches.length; i < len; i++) {
		uniform = vMatches[i];
		uniformName = uniform.match(/uniform\s+[^\s]+\s+([^(\s|;)]+);/)[1];
		shaderProgram.uniforms[uniformName] = gl.getUniformLocation(shaderProgram, uniformName);
	}

	vMatches = vertexShaderSource.match(/attribute\s+[^\s]+\s+[^(\s|;)]+;/g);
	shaderProgram.attributes = {};
	for (i = 0, len = vMatches.length; i < len; i++) {
		attribute = vMatches[i];
		attributeName = attribute.match(/attribute\s+[^\s]+\s+([^(\s|;)]+);/)[1];
		shaderProgram.attributes[attributeName] = gl.getAttribLocation(shaderProgram, attributeName);
	}

	return shaderProgram;
};

/**
	Frees a program from gpu.
	@param {WebGLContext} gl The WebGL context.
	@param {WebGLProgram} program The program to free.
*/
Utils.deleteProgram = function(gl, program) {
	return gl.deleteProgram(program);
};

/**
	Creates a webgl texture from the image. 
	@param {WebGLContext} gl The WebGL context.
	@param {Image} image The loaded image object. 
	@returns {WebGLTexture} The webgl texture reference.
*/
Utils.createTexture = function(gl, image) {
	var texture;
	texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.generateMipmap(gl.TEXTURE_2D);
	return texture;
};

/**
	Frees a loaded texture from gpu.
	@param {WebGLContext} gl The WebGL context.
	@param {WebGLTexture} texture The texture to free.
*/
Utils.deleteTexture = function(gl, texture) {
	return gl.deleteTexture(texture);
};

/**
	Add capitalize function to String.
*/
String.prototype.capitalize = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
};

module.exports = Utils;
});

require.define("/base_asset_handler.js", function (require, module, exports, __dirname, __filename) {
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
});

require.define("/asset_manager.js", function (require, module, exports, __dirname, __filename) {
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
	if (!((extension != null) && (handler != null))) throw "AssetManager#registerHandler expects an extension and a handler";
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

		if (onError) {
			handler.get(gl, url, onSuccess, onError);
			return;
		}

		handler.get(gl, url, onSuccess);
		return;
	}

	if (onError) {
		AssetManager.defaultHandler.get(gl, url, onSuccess, onError);
		return;
	}

	AssetManager.defaultHandler.get(gl, url, onSuccess);
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
	
		if (callback != null) {
			handler.free(gl, url, callback);
			return;
		}

		handler.free(gl, url);
		return;
	}
	if (callback != null) {
		AssetManager.defaultHandler.free(gl, url, callback);
		return;
	}

	AssetManager.defaultHandler.free(gl, url);
	return;
};

module.exports = AssetManager;
});

require.define("/model_handler.js", function (require, module, exports, __dirname, __filename) {
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
});

require.define("/model.js", function (require, module, exports, __dirname, __filename) {
var AssetManager = require("./asset_manager");

/**
	Creates a Model.
	@class This is the basic model class, used for static meshes and the like.
	@exports Model as Graphics.Model.
	@property {Number} vertexFormat The vertex format.
	@property {Number} vertexStride The stride of the vertex data.
	@property {Uint8Array} vertexBuffer The buffer with the vertex data.
	@property {Uint16Array} indexBuffer The buffer with the index data
	@property {bool} ready Holds whether the model is ready to be drawn or not.
	@property {WebGLProgram} program The webgl program used to render.
	@see <a href="http://blog.tojicode.com/2011/10/building-game-part-2-model-format.html">TojiCode</a>
*/
function Model() {
	this.vertexFormat = 0;
	this.vertexStride = 0;
	this.vertexBuffer = null;
	this.indexBuffer = null;
	this.meshes = null;
	this.ready = false;
	this.program = null;
}

/**
	Vertex format flags.
*/
Model.VertexFormat = {
	Position: 0x0001,
	UV: 0x0002,
	UV2: 0x0004,
	Normal: 0x0008,
	Tangent: 0x0010,
	Color: 0x0020,
	BoneWeights: 0x0040
};

/**
	The maximum number of bones per mesh.
*/
Model.MAX_BONES_PER_MESH = 50;

/**
	This function can be used to create and load a new Model from a given url, where a wglmodel and wlgvert files pair is expected to be. 
	Will use the propper asset handler in the background calling it through an asset manager.
	@param {WebGLContext} gl The webgl context used to handle most resources.
	@param {String} url The name of the resource in the server, this url should have the .wglmodel extension, and will fetch both the .wglmodel 
		and .wglvert files.
	@param {Function} callback This callback will be called with the loaded model.
	@returns {Model} the loaded model.
*/
Model.load = function(gl, url, callback) {
	var asset_manager = new AssetManager();
	try {
		return asset_manager.get(gl, url, callback);
	} catch (e) {
		return console.log(e);
	}
};

/**
	Returns the lump
	@param id lump id.
	@returns lumpID.
	@inner
*/
Model.prototype._lumpId = function(id) {
	var str;
	str = "";
	str += String.fromCharCode(id & 0xff);
	str += String.fromCharCode((id >> 8) & 0xff);
	str += String.fromCharCode((id >> 16) & 0xff);
	return str += String.fromCharCode((id >> 24) & 0xff);
};

/**
	Parses the vertex data.
	@param buffer The vertex buffer data.
	@param {Number} offset The offset to the data.
	@param {Number} length The data length.
	@returns the vertex buffer array.
	@inner
*/
Model.prototype._parseVertexData = function(buffer, offset, length) {
	var vertexHeader = new Uint32Array(buffer, offset, 2);
	this.vertexFormat = vertexHeader[0];
	this.vertexStride = vertexHeader[1];

	if ((this.vertexFormat & Model.VertexFormat.BoneWeights) === Model.VertexFormat.BoneWeights) {
		this.boneMatrices = new Float32Array(16 * Model.MAX_BONES_PER_MESH);
	}

	return new Uint8Array(buffer, offset + 8, length - 8);
};

/**
	Parses the index data.
	@param buffer The index buffer data.
	@param {Number} offset The offset to the data.
	@param {Number} length The data length.
	@returns the index buffer array.
	@inner
*/
Model.prototype._parseIndexData = function(buffer, offset, length) {
	return new Uint16Array(buffer, offset, length / 2);
};

/**
	Loads the mesh from the given model and vertex data.
	@param {WebGLContext} gl The webgl context used to handle most resources.
	@param model_data The wgl model data.
	@param buffer The buffer holding the index and vertex buffers.
	@throws {MissingParameterException} If one of the required parameters is missing.
	@throws {BadFormatException} If the format of the given buffer is incorrect.
	@returns {Model} this
*/
Model.prototype.load = function(gl, model_data, buffer) {
	var i, indexArray, length, lumpCount, lump_id, mesh, offset, that = this, vertexArray;
	if (!((model_data != null) && (buffer != null))) throw "Model#load expects gl context, model data and model buffer";

	var asset_manager = new AssetManager();
	var program_url = model_data.program_url != null ? model_data.program_url : 'assets/default.wglprog';
	//Set the program.
	asset_manager.get(gl, program_url, function(prg) {
		that.program = prg;
	});

	this.meshes = JSON.parse(JSON.stringify(model_data.meshes));
	
	for (var i = 0, len = this.meshes.length; i < len; i++) {
		mesh = this.meshes[_i];

		asset_manager.get(gl, mesh.defaultTexture, function(texture) {
			mesh.diffuse = texture;
		});
	}

	var header = new Uint32Array(buffer, 0, 3);

	if (this._lumpId(header[0]) !== 'wglv') throw "The model buffer format is incorrect.";
	if (header[1] !== 1) throw "The model buffer format is incorrect.";

	lumpCount = header[2];
	header = new Uint32Array(buffer, 12, lumpCount * 3);
	indexArray = vertexArray = null;

	for (i = 0; 0 <= lumpCount ? i <= lumpCount : i >= lumpCount; 0 <= lumpCount ? i++ : i--) {
		lump_id = this._lumpId(header[i * 3]);
		offset = header[(i * 3) + 1];
		length = header[(i * 3) + 2];
		
		switch (lump_id) {
			case "vert":
				vertexArray = this._parseVertexData(buffer, offset, length);
				break;
			case "indx":
				indexArray = this._parseIndexData(buffer, offset, length);
				break;
		}
	}

	//Create model buffers.
	this.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);

	this.indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW);
	this.ready = true;
	return this;
};

/**
	Frees the used buffers, it won't free any texture data or programs since it has
	no way of knowing whether these textures are still used or not.
	@param {WebGLContext} gl The webgl context used to handle most resources.
*/
Model.prototype.free = function(gl) {
	gl.deleteBuffer(this.vertexBuffer);
	gl.deleteBuffer(this.indexBuffer);
};

/**
	Binds the used buffers for drawing.
	@param {WebGLContext} gl The webgl context used to handle most resources.
	@param {Matrix4D} projection_matrix The projection matrix used to render.
	@param {Matrix4D} view_mat The matrix with the camera's position.
*/
Model.prototype.bind = function(gl, projection_matrix, view_matrix) {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	gl.useProgram(this.program);
	gl.enableVertexAttribArray(this.program.attributes.aPosition);
	gl.enableVertexAttribArray(this.program.attributes.aTextureCoordinate);
	gl.enableVertexAttribArray(this.program.attributes.aNormal);
	gl.vertexAttribPointer(this.program.attributes.aPosition, 3, gl.FLOAT, false, this.vertexStride, 0);
	gl.vertexAttribPointer(this.program.attributes.aTextureCoordinate, 2, gl.FLOAT, false, this.vertexStride, 12);
	gl.vertexAttribPointer(this.program.attributes.aNormal, 3, gl.FLOAT, true, this.vertexStride, 20);
	gl.uniformMatrix4fv(this.program.uniforms.uProjectionMatrix, false, projection_matrix.elements);
	gl.uniformMatrix4fv(this.program.uniforms.uViewMatrix, false, view_matrix.elements);
};

/**
	Draws the model. Bind should be called before calling draw.
	@param {WebGLContext} gl The webgl context used to handle most resources.
	@param {Matrix4D or Array} model_matrix An array holding many or one model transform matrices.
*/
Model.prototype.draw = function(gl, model_matrix) {
	var mesh, submesh, i, j, len, len2;
	//Push model matrix to the program
	gl.uniformMatrix4fv(this.program.uniforms.uModelMatrix, false, model_matrix.elements);

	for (i = 0, len = this.meshes.length; i < len; i++) {
		mesh = this.meshes[i];
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, mesh.diffuse);
		gl.uniform1i(this.program.uniforms.uTexture0, 0);

		for (j = 0, len2 = mesh.submeshes.length; j < len2; j++) {
			submesh = mesh.submeshes[j];
			gl.drawElements(gl.TRIANGLES, submesh.indexCount, gl.UNSIGNED_SHORT, submesh.indexOffset * 2);
		}
	}
};

/**
	Returns true if the model is ready, false otherwise.
	@returns true if the model is ready, false otherwise.
*/
Model.prototype.isReady = function() {
	return this.ready;
};

module.exports = Model;
});

require.define("/program_handler.js", function (require, module, exports, __dirname, __filename) {
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
});

require.define("/goom-graphics.js", function (require, module, exports, __dirname, __filename) {
    var Geometry = require("./geometry"), Utils = require("./utils"), BaseAssetHandler = require("./base_asset_handler"), 
	AssetManager = require("./asset_manager"), ModelHandler = require("./model_handler"), ProgramHandler = require("./program_handler")
	Model = require("./model");

exports.Geometry = Geometry;
exports.Utils = Utils;
exports.BaseAssetHandler = BaseAssetHandler;
exports.AssetManager = AssetManager;
exports.ModelHandler = ModelHandler;
exports.ProgramHandler = ProgramHandler;
exports.Model = Model;

if (window) window.Graphics = exports;
});
require("/goom-graphics.js");
