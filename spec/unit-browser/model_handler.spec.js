var ModelHandler = require("./model_handler"), Model = require("./model");

describe('ModelHandler', function() {
	beforeEach(function() {
		ch = document.createElement('div');
		ch.style = 'display:none';
		document.getElementsByTagName('div')[0].appendChild(ch); 
		c = document.createElement('canvas');
		ch.appendChild(c);
		this.gl = c.getContext('experimental-webgl');
	});

	it('should get and create a model', function(){
		var ah = new ModelHandler();
		var model = null;

		this.onSuccess = function(mdl) {
			model = mdl;
		};

		spyOn(this, 'onSuccess').andCallThrough();
		ah.get(this.gl, 'assets/vat.wglmodel', this.onSuccess);
		expect(this.onSuccess).not.toHaveBeenCalled();

		waitsFor(function() {
			return (typeof ah.cache['assets/vat.wglmodel'] !== "undefined"); 
		});

		runs(function() {
			expect(this.onSuccess).toHaveBeenCalledWith(model);
			expect(model instanceof Model).toBeTruthy();
		});
	});

	it('should free model', function(){
		var ah = new ModelHandler();
		var model = null;

		this.onSuccess = function(mdl) {
			model = mdl;
		};

		ah.get(this.gl, 'assets/vat.wglmodel', this.onSuccess);

		waitsFor(function() {
			return (typeof ah.cache['assets/vat.wglmodel'] !== "undefined"); 
		});

		runs(function() {
			spyOn(model, 'free').andCallThrough();
			expect(model instanceof Model).toBeTruthy();
			expect(ah.cache['assets/vat.wglmodel']).toBeDefined();
			ah.free(this.gl, 'assets/vat.wglmodel');
			expect(model.free).toHaveBeenCalledWith(this.gl);
			expect(ah.cache['assets/vat.wglmodel']).not.toBeDefined();
		});
	});
});
