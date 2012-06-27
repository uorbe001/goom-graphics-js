var Model = require("./model"), ModelInstance = require("./model_instance"), Mathematics = require("goom-math-js"),
	AssetManager = require("./asset_manager"), TextureHandler = require("./texture_handler"), ModelHandler = require("./model_handler"),
	ProgramHandler = require("./program_handler"), Camera = require("./camera"), Geometry = require("./geometry");

/**
	Creates an World.
	@class The graphics world is used to update the rendered scene.
	@param {json} config the config to create the world from.
	@param {WebGLContext} gl the webgl context to render on.
	@param {Number} viewport_width the width of the viewport.
	@param {Number} viewport_height the height of the viewport.
	@param {function} callback Cllback to be called when the world is ready.
	@property {map} models Map holding the loaded models.
	@property {map} instances Map holding arrays of each model instances.
	@property {array} allInstances Array holding references to all the model instances.
	@property {Graphics.AssetManager} assetManager The asset manager used to fetch resources from the server.
	@property {map} cameras Map holding the cameras in the world.
	@property {Graphics.Camera} activeCamera The active camera in the scene.
	@exports World as Graphics.World
*/
function World(config, gl, viewport_width, viewport_height, callback) {
	var that = this, inst, model_instance;
	this.viewportWidth = viewport_width;
	this.viewportHeight = viewport_height;
	this.gl = gl;
	this.paused = true;
	this.models = {};
	this.instances = {};
	this.geometries = {};
	this.geometry_instances = {};
	this.map = {};
	this.cameras = {};
	this.activeCamera = null;
	this.allInstances = [];
	this.assetManager = new AssetManager();
	this.assetManager.registerHandler("(png|jpg|bmp|gif)", new TextureHandler());
	this.assetManager.registerHandler("wglprog", new ProgramHandler());
	this.assetManager.registerHandler("wglmodel", new ModelHandler());

	//Init webgl functions etc.
	gl.enable(gl.CULL_FACE);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

	var downloading_models = 0, done_loading_instances = false, cam, cam_data, plane_data;

	//Load models
	for (var key in config.render_models) {
		downloading_models += 1;
		//This isn't pretty, but we need to iterate with the correct key.
		!function (key) {
			Model.load(gl, config.render_models[key], function(model) {
				that.models[key] = model;
				downloading_models -= 1;
				if (downloading_models === 0 && done_loading_instances) callback();
			});
		} (key);
	}

	//load model instances
	for (var i = config.level.model_instances.length - 1; i >= 0; i--) {
		inst = config.level.model_instances[i];
		//Initialize the array if it doesn't exist.
		if (!this.instances[inst.model]) this.instances[inst.model] = [];
		//Push the new instance.
		model_instance = new ModelInstance(inst);
		this.instances[inst.model].push(model_instance);
		this.allInstances.push(model_instance);
	}

	//Load cameras
	for (i = config.level.cameras.length - 1; i >= 0; i--) {
		cam_data = config.level.cameras[i];

		cam = new Camera(viewport_width, viewport_height);
		if (cam_data.position) cam.setPosition(cam_data.position);
		if (cam_data.target) cam.setTarget(cam_data.target);
		if (cam_data.view_angle) cam.setViewAngle(cam_data.view_angle);
		if (cam_data.far_limit) cam.setFarLimit(cam_data.far_limit);
		if (cam_data.near_limit) cam.setNearLimit(cam_data.near_limit);
		if (cam_data.up_vector) cam.setUpVector(cam_data.up_vector);
		if (cam_data.orthographic) cam.setOrthographicProjection(cam_data.orthographic);

		this.cameras[cam_data.id] = cam;
		if (cam_data.active) this.activeCamera = cam;
	}


	var geom_program, mat;
	//Load shader for geometries
	this.assetManager.get(this.gl, '/assets/geometry.wglprog', function(prg) {
		geom_program = prg;
		for (i = config.level.planes.length - 1; i >= 0; i--) {
			plane_data = config.level.planes[i];
			//TODO: Don't ignore normals.
			that.geometries[plane_data.id] = new Geometry(that.gl, geom_program, {"type": "box", "halfSize": {"x": 100, "y": 0.01, "z": 1}});
			mat = new Mathematics.Matrix4D();
			mat.translate(0, plane_data.offset, 0);
			that.geometry_instances[plane_data.id] = [];
			that.geometry_instances[plane_data.id].push(mat);
		}
	});

	done_loading_instances = true;
	this.paused = false;
	//Call the callback when all the models are downloaded.
	if (downloading_models === 0) callback();
}

/**
	Renders the world.
*/
World.prototype.draw = function() {
	if (this.paused) return;

	var gl = this.gl;
	//Clean up canvas before rendering.
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.clearColor(0, 0, 0, 1);

	//Draw the model instances
	for (var key in this.instances) {
		this.models[key].drawInstances(gl, this.activeCamera.projection, this.activeCamera.view, this.instances[key]);
	}

	//Draw the geometry instances
	for (key in this.geometry_instances) {
		this.geometries[key].drawInstances(gl, this.activeCamera.projection, this.activeCamera.view, this.geometry_instances[key]);
	}
};

World.prototype.updateInstancesFromRemote = function(data) {
	var j, len, instance_data, instance;

	for (var i = data.length - 1; i >= 0; i--) {
		instance_data = data[i];
		
		for (j = 0, len = this.allInstances.length; j < len; j++) {
			instance = this.allInstances[j];

			if (instance.id == instance_data.id) {
				instance.updateFromRemote(instance_data);
				break;
			}
		}
	}
};

/**
	Approximate the instance positions from velocity.
	@param {Number} duration Time since last frame.
*/
World.prototype.integrateIntances = function(duration) {
	if (this.paused) return;
	for (var i = 0, len = this.allInstances.length; i < len; i++) {
		instance = this.allInstances[i];
		instance.integrate(duration);
	}
};

World.prototype.addInstance = function(data) {
	//Initialize the array if it doesn't exist.
	if (!this.instances[data.model]) this.instances[data.model] = [];
	//Push the new instance.
	var model_instance = new ModelInstance(data);
	this.instances[data.model].push(model_instance);
	this.allInstances.push(model_instance);
};

World.prototype.pause = function() {
	this.paused = true;
};

World.prototype.resume = function() {
	this.paused = false;
};

module.exports = World;