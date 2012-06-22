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
			//TODO
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
			//TODO
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