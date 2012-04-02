if (typeof define !== 'function') {
	var define = require('amdefine')(module);
}

define(function() {
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

	return Utils;
});