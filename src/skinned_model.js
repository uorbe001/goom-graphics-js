var Model = require("./model");

var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
	for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
	function ctor() { this.constructor = child; }
	ctor.prototype = parent.prototype;
	child.prototype = new ctor();
	child.__super__ = parent.prototype;
	return child;
};


__extends(SkinnedModel, Model);

function SkinnedModel() {
	SkinnedModel.__super__.constructor.call(this);
	this.bones = null;
	this.boneMatrices = null;
	this.__dirtyBones = true;
	this.DEFAULT_SHADER = '/assets/default_skinned_model.wglprog';
}

SkinnedModel.load = function(gl, url, callback) {
	var asset_manager = new AssetManager();
	try {
		return asset_manager.get(gl, url, callback);
	} catch (e) {
		return console.log(e);
	}
};

SkinnedModel.prototype.__parseBinary = function (buffer) {
	var arrays = SkinnedModel.__super__.__parseBinary.call(this, buffer);

	if(this.vertexFormat & Model.VertexFormat.BoneWeights) {
		this.boneMatrices = new Float32Array(16 * Model.MAX_BONES_PER_MESH);
	}

	return arrays;
};

SkinnedModel.prototype.__parseModel = function(data) {
	SkinnedModel.__super__.__parseModel.call(this, data);

	this.bones = data.bones ? data.bones : [];

	var temp_mat = new Mathematics.Matrix4D(), i, bone;
	for (i in this.bones) {
		bone = this.bones[i];

		bone.pos = new Mathematics.Vector3D(bone.pos[0], bone.pos[1], bone.pos[2]);
		bone.rot = new Mathematics.Quaterion(bone.rot[0], bone.rot[1], bone.rot[2], bone.rot[3]);
		bone.bindPoseMat = new Mathematics.Matrix4D();
		bone.bindPoseMat.set(bone.bindPoseMat);

		bone.boneMat = new Mathematics.Matrix4D();
		if (bone.parent == -1) {
			bone.worldPos = bone.pos;
			bone.worldRot = bone.rot;
		} else {
			bone.worldPos = new Mathematics.Vector3D();
			bone.worldRot = new Mathematics.Quaterion();
		}
	}
};

SkinnedModel.prototype.draw = function (gl, projection_matrix, view_matrix, instance) {
	if (!this.ready) { return; }

	//Bind buffers and used program
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	gl.useProgram(this.program);

	gl.enableVertexAttribArray(this.program.attributes.aPosition);
	gl.enableVertexAttribArray(this.program.attributes.aTextureCoordinate);
	gl.enableVertexAttribArray(this.program.attributes.aNormal);
	gl.enableVertexAttribArray(this.program.attributes.aWeights);
	gl.enableVertexAttribArray(this.program.attributes.aBones);

	gl.uniformMatrix4fv(this.program.uniforms.uProjectionMatrix, false, projection_matrix.data);
	gl.uniformMatrix4fv(this.program.uniforms.uViewMatrix, false, view_matrix.data);
	//Push model matrix to the program
	gl.uniformMatrix4fv(this.program.uniforms.uModelMatrix, false, instance.transformationMatrix.data);

	gl.vertexAttribPointer(this.program.attributes.aPosition, 3, gl.FLOAT, false, this.vertexStride, 0);
	gl.vertexAttribPointer(this.program.attributes.aTextureCoordinate, 2, gl.FLOAT, false, this.vertexStride, 12);
	gl.vertexAttribPointer(this.program.attributes.aNormal, 3, gl.FLOAT, false, this.vertexStride, 20);
	gl.vertexAttribPointer(this.program.attributes.aWeights, 3, gl.FLOAT, false, this.vertexStride, 48);
	gl.vertexAttribPointer(this.program.attributes.aBones, 3, gl.FLOAT, false, this.vertexStride, 60);

	var i, j, mesh, submesh, boneSet, indexOffset, indexCount;

	if (this.__dirtyBones) {
		for(i = 0; i < this.bones.length; ++i) {
			var bone = this.bones[i];
			this.boneMatrices.set(bone.boneMat.data);
		}
	}

	for (i in this.meshes) {
		mesh = this.meshes[i];

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, mesh.diffuse);
		gl.uniform1i(this.program.uniforms.uTexture0, 0);

		for (j in mesh.submeshes) {
			submesh = mesh.submeshes[j];

			boneSet = this.boneMatrices.subarray(submesh.boneOffset * 16, (submesh.boneOffset + submesh.boneCount) * 16);
			gl.uniformMatrix4fv(shader.uniform.boneMat, false, boneSet);
			gl.drawElements(gl.TRIANGLES, submesh.indexCount, gl.UNSIGNED_SHORT, submesh.indexOffset * 2);
		}
	}
};