var Mathematics = require("goom-math-js");

/**
	Creates a new Camera
	@class Cameras hold projection and view matrices.
	@property {Mathematics.Matrix4D} projection The projection matrix for this camera.
	@property {Mathematics.Matrix4D} view The view matrix for this camera.
	@property {Number} [viewAngle=60] the view angle for this camera.
	@property {Number} [farPlane=4096.0] The view far plane.
	@property {Number} [nearPlane=1.0] The view near plane.
	@property {Number} viewportWidth The viewport width.
	@property {Number} viewportHeight The viewport height.
	@property {Number} [isOrthographic=false] this flag indicates wether the camera uses orthographic projection or perspective projection.
	@property {Mathematics.Vector3D} position The position of the camera.
	@property {Mathematics.Vector3D} target The target the camera is looking at.
	@property {Mathematics.Vector3D} upVector The up vector.
	@param {Number} viewportWidth The viewport width.
	@param {Number} viewportHeight The viewport height.
	@exports Camera as Graphics.Camera.
*/
function Camera(viewport_width, viewport_height) {
	this.viewAngle = 60.0;
	this.farPlane = 4096.0;
	this.nearPlane = 1.0;
	this.viewportWidth = viewport_width;
	this.viewportHeight = viewport_height;
	this.isOrthographic = false;
	this.position = new Mathematics.Vector3D(0,0,-75);
	this.target = new Mathematics.Vector3D(0,0,0);
	this.upVector = Mathematics.Vector3D.UP.clone();
	this.view = new Mathematics.Matrix4D();
	this.projection = new Mathematics.Matrix4D();
	this.__calculateProjection();
	this.__calculateView();
}

/**
	@inner recalculates the projection matrix.
*/
Camera.prototype.__calculateProjection = function() {
	if (this.isOrthographic)
		this.projection.makeOrthographic(0, this.viewportWidth, 0, this.viewportHeight, this.nearPlane, this.farPlane);
	else
		this.projection.makePerspective(this.viewAngle, this.nearPlane, this.farPlane, this.viewportWidth/this.viewportHeight);
};

/**
	@inner recalculates the view matrix.
*/
Camera.prototype.__calculateView = function() {
	//this.view.makeLookAt(this.position, this.target, this.upVector);
	this.view.makeIdentity();
	this.view.translate(this.position.x, this.position.y, this.position.z);
};

/**
	Sets wether the projection in this camera is orthographic or not.
	@param {boolean} bool true if the camera does orthographic projection and false for perspective projection.
*/
Camera.prototype.setOrthographicProjection = function(bool) {
	this.isOrthographic = bool;
	this.__calculateProjection();
};

/**
	Sets the view angle for perspective projection.
	@param {Number} angle the view angle for perspective projection.
*/
Camera.prototype.setViewAngle = function(angle) {
	this.viewAngle = angle;
	this.__calculateProjection();
};

/**
	Sets the far limit of the projection
	@param {Number} limit the far limit of the projection.
*/
Camera.prototype.setFarLimit = function(limit) {
	this.farPlane = limit;
	this.__calculateProjection();
};

/**
	Sets the near limit of the projection
	@param {Number} limit the near limit of the projection.
*/
Camera.prototype.setNearLimit = function(limit) {
	this.nearPlane = limit;
	this.__calculateProjection();
};

/**
	Sets the target to look at from this camera.
	@param {Vector3D} target the target to look at.
*/
Camera.prototype.setTarget = function(target) {
	this.target.set(target.x, target.y, target.z);
	this.__calculateView();
};

/**
	Sets the position of this camera.
	@param {Vector3D} position the position of the camera.
*/
Camera.prototype.setPosition = function(position) {
	this.position.set(position.x, position.y, position.z);
	this.__calculateView();
};

/**
	Sets the up vector of this camera.
	@param {Vector3D} up the up vector of the camera.
*/
Camera.prototype.setUpVector = function(up) {
	this.upVector.set(up.x, up.y, up.z);
	this.__calculateView();
};

module.exports = Camera;