describe('Graphics.AssetManager', function() {
	beforeEach(function() {
		this.am = new Graphics.AssetManager();
		this.ah = {};
		this.ah.free = jasmine.createSpy();
		this.ah.get = jasmine.createSpy();
	});

	it('registers a new asset handler', function() {
		this.am.registerHandler("test", this.ah);
		expect(Graphics.AssetManager.handlers["test"]).toBe(this.ah);
	});

	it('raises an required MissingParameterException when a parameter is missing when registering a handler', function() {
		var that = this;

		expect(function() {
			that.am.registerHandler({});
		}).toThrow("AssetManager#registerHandler expects an extension and a handler");
		
		expect(function() {
			that.am.registerHandler("test");
		}).toThrow("AssetManager#registerHandler expects an extension and a handler");
	});

	it('raises an required MissingParameterException when a parameter is missing', function() {
		var that = this;
		this.am.registerHandler("test", this.ah);

		expect(function() {
			that.am.get({});
		}).toThrow("AssetManager#get expects a gl context, resource url and onSuccess callback");

		expect(function() {
			that.am.get("blah.test");
		}).toThrow("AssetManager#get expects a gl context, resource url and onSuccess callback");

		expect(function() {
			that.am.get({}, "blah.test");
		}).toThrow("AssetManager#get expects a gl context, resource url and onSuccess callback");

		expect(function() {
			that.am.get({}, "blah.test", function() {});
		}).not.toThrow();

		expect(function() {
			that.am.free({});
		}).toThrow("AssetManager#free expects a gl context and resource url");

		expect(function() {
			that.am.free("blah.test");
		}).toThrow("AssetManager#free expects a gl context and resource url");

		expect(function() {
			that.am.free({}, "blah.test");
		}).not.toThrow();
		
		expect(function() {
			that.am.free({}, "blah.test", function() {});
		}).not.toThrow();
	});

	it('gets a resource from the asset manager', function() {
		var callback = jasmine.createSpy();
		this.am.registerHandler("test", this.ah);
		this.am.get({}, 'prueba.test', callback);
		expect(this.ah.get).toHaveBeenCalledWith({}, 'prueba.test', callback, undefined);
	});

	it('gets assets with the correct handler', function() {
		var bh = {};
		bh.free = jasmine.createSpy();
		bh.get = jasmine.createSpy();
		this.am.registerHandler("test", this.ah);
		this.am.registerHandler("test2", bh);
		var callback = jasmine.createSpy();
		this.am.get({}, 'prueba.test', callback);
		expect(this.ah.get).toHaveBeenCalledWith({}, 'prueba.test', callback, undefined);
		expect(bh.get).not.toHaveBeenCalled();
	});

	it('frees a resource from the asset manager', function() {
		this.am.registerHandler("test", this.ah);
		var callback = jasmine.createSpy();
		this.am.free({}, 'prueba.test', callback);
		expect(this.ah.free).toHaveBeenCalledWith({}, 'prueba.test', callback);
	});

	it('gets assets with the correct handler', function() {
		var bh = {};
		bh.free = jasmine.createSpy();
		bh.get = jasmine.createSpy();
		this.am.registerHandler("test", this.ah);
		this.am.registerHandler("test2", bh);
		var callback = jasmine.createSpy();
		this.am.free({}, 'prueba.test', callback);
		expect(this.ah.free).toHaveBeenCalledWith({}, 'prueba.test', callback);
		expect(bh.free).not.toHaveBeenCalled();
	});
});