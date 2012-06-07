var TextureHandler = require("../../src/texture_handler");

describe('TextureHandler', function() {
	beforeEach(function() {
		ch = document.createElement('div');
		ch.style = 'display:none';
		document.getElementsByTagName('div')[0].appendChild(ch); 
		c = document.createElement('canvas');
		ch.appendChild(c);
		this.gl = c.getContext('experimental-webgl');
	});

	it('should get and create a texture', function(){
		var ah = new TextureHandler();
		var texture = null;

		this.onSuccess = function(tex) {
			texture = tex;
		};

		spyOn(this, 'onSuccess').andCallThrough();
		ah.get(this.gl, 'assets/robot-arm.png', this.onSuccess);
		expect(this.onSuccess).not.toHaveBeenCalled();

		waitsFor(function() {
			return (typeof ah.cache['assets/robot-arm.png'] !== "undefined"); 
		});

		runs(function() {
			expect(this.onSuccess).toHaveBeenCalledWith(texture);
			expect(texture instanceof WebGLTexture).toBeTruthy();
		});
	});

	it('should free texture', function(){
		var ah = new TextureHandler();
		var texture = null;

		spyOn(Utils, 'deleteTexture').andCallThrough()

		this.onSuccess = function(tex) {
			texture = tex;
		};

		ah.get(this.gl, 'assets/robot-arm.png', this.onSuccess);

		waitsFor(function() {
			return (typeof ah.cache['assets/robot-arm.png'] !== "undefined"); 
		});

		runs(function() {
			expect(texture instanceof WebGLTexture).toBeTruthy();
			expect(ah.cache['assets/robot-arm.png']).toBeDefined();
			ah.free(this.gl, 'assets/robot-arm.png')
			expect(Utils.deleteTexture).toHaveBeenCalledWith(this.gl, texture)
			expect(ah.cache['assets/robot-arm.png']).not.toBeDefined();
		});
	});
});
