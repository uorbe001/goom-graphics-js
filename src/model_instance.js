var Mathematics = require("goom-math-js");

/**
	Creates a ModelInstance.
	@class This class is an instance of a specific model, holding its data and transformationMatrix.
	@exports ModelInstance as Graphics.ModelInstance.
	@property {Mathematics.Vector3D} position The position of this instance in world space.
	@property {Mathematics.Quaternion} orientation The orientation of the object.
	@property {Mathematics.Matrix4D} transformationMatrix The transformation matrix of the instance.
	@property {String} id The id of this instance
	@property {String} model the model name this is an instance of.
*/
function ModelInstance(config) {
	this.position = new Mathematics.Vector3D();
	this.orientation = new Mathematics.Quaternion();
	this.transformationMatrix = new Mathematics.Matrix4D();
	this.id = config.id;
	this.model = config.model;
	this.update(config);
}

/**
	Updates the instance with the given data.
	@param {json} data the data to update this instance with.
*/
ModelInstance.prototype.update = function(data) {
	if (data.position) this.position.set(data.position.x, data.position.y, data.position.z);
	if (data.orientation) this.orientation.set(data.orientation.r, data.orientation.i, data.orientation.j, data.orientation.k);
	this.transformationMatrix.makeFromPositionAndOrientation(this.position, this.orientation);
};

module.exports = ModelInstance;