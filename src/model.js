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
	this.DEFAULT_SHADER = '/assets/default_model.wglprog';
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
Model.prototype.__lumpId = function(id) {
	var str;
	str = "";
	str += String.fromCharCode(id & 0xff);
	str += String.fromCharCode((id >> 8) & 0xff);
	str += String.fromCharCode((id >> 16) & 0xff);
	str += String.fromCharCode((id >> 24) & 0xff);
	return str;
};

/**
	Parses the vertex data.
	@param buffer The vertex buffer data.
	@param {Number} offset The offset to the data.
	@param {Number} length The data length.
	@returns the vertex buffer array.
	@inner
*/
Model.prototype.__parseVertexData = function(buffer, offset, length) {
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
Model.prototype.__parseIndexData = function(buffer, offset, length) {
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
	var i, len, indexArray, length, lumpCount, lump_id, mesh, offset, that = this, vertexArray;
	if (!((model_data != null) && (buffer != null))) throw "Model#load expects gl context, model data and model buffer";

	var asset_manager = new AssetManager();
	var program_url = model_data.program_url != null ? model_data.program_url : this.DEFAULT_SHADER;
	//Set the program.
	asset_manager.get(gl, program_url, function(prg) {
		that.program = prg;
	});

	this.__parseModel(model_data);
	this.__compileMaterials(gl);
	var arrays = this.__parseBinary(buffer);

	//Create model buffers.
	this.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, arrays.vertexArray, gl.STATIC_DRAW);

	this.indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, arrays.indexArray, gl.STATIC_DRAW);

	this.ready = true;
	return this;
};

Model.prototype.__parseModel = function(model_data) {
	this.meshes = JSON.parse(JSON.stringify(model_data.meshes));
};

Model.prototype.__compileMaterials = function(gl) {
	var asset_manager = new AssetManager();
	for (i = 0, len = this.meshes.length; i < len; i++) {
		mesh = this.meshes[i];

		!function (mesh) {
			asset_manager.get(gl, mesh.defaultTexture, function(texture) {
				mesh.diffuse = texture;
			});
		} (mesh);
	}
};

Model.prototype.__parseBinary = function(buffer) {
	var header = new Uint32Array(buffer, 0, 3), length;

	if (this.__lumpId(header[0]) !== 'wglv') throw "The model buffer format is incorrect.";
	if (header[1] !== 1) throw "The model buffer format is incorrect.";

	lumpCount = header[2];
	header = new Uint32Array(buffer, 12, lumpCount * 3);
	var output = {  indexArray: null,
					vertexArray: null
	};

	for (i = 0; 0 <= lumpCount ? i <= lumpCount : i >= lumpCount; 0 <= lumpCount ? i++ : i--) {
		lump_id = this.__lumpId(header[i * 3]);
		offset = header[(i * 3) + 1];
		length = header[(i * 3) + 2];
		
		switch (lump_id) {
			case "vert":
				output.vertexArray = this.__parseVertexData(buffer, offset, length);
				break;
			case "indx":
				output.indexArray = this.__parseIndexData(buffer, offset, length);
				break;
		}
	}

	return output;
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
	gl.uniformMatrix4fv(this.program.uniforms.uProjectionMatrix, false, projection_matrix.data);
	gl.uniformMatrix4fv(this.program.uniforms.uViewMatrix, false, view_matrix.data);
};

/**
	Draws the model
	@param {WebGLContext} gl The webgl context used to handle most resources.
	@param {Matrix4D} projection_matrix The projection matrix used to render.
	@param {Matrix4D} view_mat The matrix with the camera's position.
	@param {ModelInstance} insctance of the model.
*/
Model.prototype.draw = function(gl, projection_matrix, view_matrix, instance) {
	var mesh, submesh, i, j, len, len2;
	//Bind buffers and used program
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	gl.useProgram(this.program);
	gl.enableVertexAttribArray(this.program.attributes.aPosition);
	gl.enableVertexAttribArray(this.program.attributes.aTextureCoordinate);
	gl.enableVertexAttribArray(this.program.attributes.aNormal);
	gl.vertexAttribPointer(this.program.attributes.aPosition, 3, gl.FLOAT, false, this.vertexStride, 0);
	gl.vertexAttribPointer(this.program.attributes.aTextureCoordinate, 2, gl.FLOAT, false, this.vertexStride, 12);
	gl.vertexAttribPointer(this.program.attributes.aNormal, 3, gl.FLOAT, false, this.vertexStride, 20);
	gl.uniformMatrix4fv(this.program.uniforms.uProjectionMatrix, false, projection_matrix.data);
	gl.uniformMatrix4fv(this.program.uniforms.uViewMatrix, false, view_matrix.data);

	//Push model matrix to the program
	gl.uniformMatrix4fv(this.program.uniforms.uModelMatrix, false, instance.transformationMatrix.data);

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
	Draws many instances of the model
	@param {WebGLContext} gl The webgl context used to handle most resources.
	@param {Matrix4D} projection_matrix The projection matrix used to render.
	@param {Matrix4D} view_mat The matrix with the camera's position.
	@param {Array} instances array holding the instances to be drawn.
*/
Model.prototype.drawInstances = function(gl, projection_matrix, view_matrix, instances) {
	var mesh, submesh, i, j, len, len2, instance;
	//Bind buffers and used program
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	gl.useProgram(this.program);
	gl.enableVertexAttribArray(this.program.attributes.aPosition);
	gl.enableVertexAttribArray(this.program.attributes.aTextureCoordinate);
	gl.enableVertexAttribArray(this.program.attributes.aNormal);
	gl.vertexAttribPointer(this.program.attributes.aPosition, 3, gl.FLOAT, false, this.vertexStride, 0);
	gl.vertexAttribPointer(this.program.attributes.aTextureCoordinate, 2, gl.FLOAT, false, this.vertexStride, 12);
	gl.vertexAttribPointer(this.program.attributes.aNormal, 3, gl.FLOAT, false, this.vertexStride, 20);
	gl.uniformMatrix4fv(this.program.uniforms.uProjectionMatrix, false, projection_matrix.data);
	gl.uniformMatrix4fv(this.program.uniforms.uViewMatrix, false, view_matrix.data);

	//Draw once per instance.
	for (var k = 0, len3 = instances.length; k < len3; k++) {
		instance = instances[k];

		//Push model matrix to the program
		gl.uniformMatrix4fv(this.program.uniforms.uModelMatrix, false, instance.transformationMatrix.data);

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