describe('Graphics.ProgramHandler', function() {
	beforeEach(function() {
		ch = document.createElement('div');
		ch.style = 'display:none';
		document.getElementsByTagName('div')[0].appendChild(ch); 
		c = document.createElement('canvas');
		ch.appendChild(c);
		this.gl = c.getContext('experimental-webgl');
	});

	it('should get and create a program', function(){
		var ah = new Graphics.ProgramHandler();
		var program = null;

		this.onSuccess = function(prg) {
			program = prg;
		};

		spyOn(this, 'onSuccess').andCallThrough();
		ah.get(this.gl, 'assets/default.wglprog', this.onSuccess);
		expect(this.onSuccess).not.toHaveBeenCalled();

		waitsFor(function() {
			return (typeof ah.cache['assets/default.wglprog'] !== "undefined"); 
		});

		runs(function() {
			expect(this.onSuccess).toHaveBeenCalledWith(program);
			expect(program instanceof WebGLProgram).toBeTruthy();
		});
	});

	it('should free program', function(){
		var ah = new Graphics.ProgramHandler();
		var program = null;

		spyOn(Utils, 'deleteProgram').andCallThrough()

		this.onSuccess = function(prg) {
			program = prg;
		};

		ah.get(this.gl, 'assets/default.wglprog', this.onSuccess);

		waitsFor(function() {
			return (typeof ah.cache['assets/default.wglprog'] !== "undefined"); 
		});

		runs(function() {
			expect(program instanceof WebGLProgram).toBeTruthy();
			expect(ah.cache['assets/default.wglprog']).toBeDefined();
			ah.free(this.gl, 'assets/default.wglprog')
			expect(Utils.deleteProgram).toHaveBeenCalledWith(this.gl, program)
			expect(ah.cache['assets/default.wglprog']).not.toBeDefined();
		});
	});
});
