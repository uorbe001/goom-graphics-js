describe('Graphics.BaseAssetHandler', function() {
	beforeEach(function() {
		this.server = sinon.fakeServer.create();
	});

	afterEach(function() {
		this.server.restore();
	});

	it('gets a resource from the server and calls the given callback with the response', function() {
		var ah = new Graphics.BaseAssetHandler();
		this.server.respondWith('GET', 'test.txt', [200, {
			"Content-Type": "text/plain"
			}, 'Hello world!'
		]);

		var callback = jasmine.createSpy();
		var onError = jasmine.createSpy();
		ah.get({}, 'test.txt', callback, onError);
		expect(this.server.requests.length).toBe(1);
		expect(onError).not.toHaveBeenCalled();
		expect(callback).not.toHaveBeenCalled();
		this.server.respond();
		expect(onError).not.toHaveBeenCalled();
		expect(callback).toHaveBeenCalledWith('Hello world!');
	});

	it('doesnt call the callback on failed resource', function() {
		var ah = new Graphics.BaseAssetHandler();
		var callback = jasmine.createSpy();
		var onError = jasmine.createSpy();
		ah.get({}, 'test.txt', callback, onError);
		expect(this.server.requests.length).toBe(1);
		expect(onError).not.toHaveBeenCalled();
		expect(callback).not.toHaveBeenCalled();
		this.server.respond();
		expect(callback).not.toHaveBeenCalled();
		expect(onError).toHaveBeenCalledWith(404, 'test.txt');
	});

	it('get throws an exception when one of the required parameters is missing', function() {
		var ah = new Graphics.BaseAssetHandler();
		
		expect(function() {
			ah.get({});
		}).toThrow("BaseAssetHandler#get expects gl context, resource url, and onSuccess callback");
		
		expect(function() {
			ah.get('prueba.txt');
		}).toThrow("BaseAssetHandler#get expects gl context, resource url, and onSuccess callback");
		
		expect(function() {
			ah.get({}, 'prueba.txt');
		}).toThrow("BaseAssetHandler#get expects gl context, resource url, and onSuccess callback");
		
		expect(function() {
			ah.get({}, 'prueba.txt', function() {});
		}).not.toThrow();
		
		expect(function() {
			ah.get({}, 'prueba.txt', function() {}, function() {});
		}).not.toThrow();
	});

	it('frees a resouce from the cache', function() {
		var ah = new Graphics.BaseAssetHandler();
		this.server.respondWith('GET', 'test.txt', [200, {
			"Content-Type": "text/plain"
			}, 'Hello world!'
		]);

		var callback = jasmine.createSpy();
		ah.get({}, 'test.txt', callback);
		this.server.respond();
		expect(ah.cache['test.txt']).toBeDefined();
		ah.free({}, 'test.txt');
		expect(ah.cache['test.txt']).not.toBeDefined();
	});

	it('free throws an exception when one of the required parameters is missing', function() {
		var ah = new Graphics.BaseAssetHandler();
		
		expect(function() {
			ah.free({});
		}).toThrow("BaseAssetHandler#free expects gl context, resource url and callback.");
		
		expect(function() {
			ah.free('prueba.txt');
		}).toThrow("BaseAssetHandler#free expects gl context, resource url and callback.");
		
		expect(function() {
			ah.free({}, 'prueba.txt');
		}).not.toThrow("BaseAssetHandler#free expects gl context, resource url and callback.");
		
		expect(function() {
			ah.free({}, 'prueba.txt', function() {});
		}).not.toThrow("BaseAssetHandler#free expects gl context, resource url and callback.");
	});
});