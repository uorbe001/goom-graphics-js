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
	this.velocity = new Mathematics.Vector3D();
	this.angular_velocity = new Mathematics.Vector3D();
	this.transformationMatrix = new Mathematics.Matrix4D();
	this.id = config.id;
	this.model = config.model;
	this.updateFromRemote(config);
}

var __helperVector = new Mathematics.Vector3D();

/**
	Updates the instance with the given data.
	@param {json} data the data to update this instance with.
*/
ModelInstance.prototype.updateFromRemote = function(data) {
	var distance = 0;

	if (data.position) {
		distance = this.position.substract(data.position, __helperVector).length();

		if (distance > 2)
			this.position.set(data.position.x, data.position.y, data.position.z);
		else if (distance > 0.1)
			this.position.add(__helperVector.scale(0.1));
	}

	if (data.orientation) {
		//TODO: Smooth this
		this.orientation.set(data.orientation.r, data.orientation.i, data.orientation.j, data.orientation.k);
	}

	if (data.velocity) {
		this.velocity.set(data.velocity.x, data.velocity.y, data.velocity.z);
	}

	if (data.angular_velocity) {
		this.angular_velocity.set(data.angular_velocity.x, data.angular_velocity.y, data.angular_velocity.z);
	}

	this.transformationMatrix.makeFromPositionAndOrientation(this.position, this.orientation);
};

/**
	Integrates this instance and updates its position.
*/
ModelInstance.prototype.integrate = function(duration) {
	this.position.add(this.velocity.scale(duration, __helperVector));
	this.orientation.addVector(this.angular_velocity.scale(duration, __helperVector));
	this.transformationMatrix.makeFromPositionAndOrientation(this.position, this.orientation);
};

module.exports = ModelInstance;