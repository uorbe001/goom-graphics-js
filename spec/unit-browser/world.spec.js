describe("Graphics.World", function(){
	beforeEach(function() {
		var config = {
			"render_models": {
				"box": "assets/box.wglmodel",
				"robot_arm": "assets/robot_arm.wglmodel"
			},

			"level": {
				//TODO lights, etc.
				"cameras": [
					{
						"id": "camera0",
						"position": {"x": 0, "y": 0, "z": -75},
						"target": {"x": 0, "y": 0, "z": 0},
						"active": true
					}
				],

				"model_instances": [{
					"id": "0",
					"model": "box",
					"position": {"x": 0, "y": 0, "z": 0},
					"orientation": {"r": 1, "i": 0, "j": 0, "k": 0}

					/*"stats": {
						"health": 100,
						"energy": 80,
						"max_health": 100,
						"max_energy": 100,
					}*/
				},{
					"id": "1",
					"model": "robot_arm",
					"position": {"x": 10, "y": 50, "z": 0},
					"orientation": {"r": 1, "i": 0, "j": 0, "k": 0}
				}
				]
			}
		};

		this.world = new Graphics.World(config, {}, 100, 100); //Second parameter is the webgl context.
	});

	it("should load the world correctly", function() {
		expect(this.world.models["box"]).toBeDefined();
		expect(this.world.models["robot_arm"]).toBeDefined();
		expect(this.world.instances["box"].length).toBe(1);
		expect(this.world.instances["robot-arm"].length).toBe(1);
		expect(this.world.cameras["camera0"]).toBeDefined();
		expect(this.world.cameras["camera0"].position.x).toBe(0);
		expect(this.world.cameras["camera0"].position.y).toBe(0);
		expect(this.world.cameras["camera0"].position.z).toBe(-75);
		expect(this.world.cameras["camera0"].target.x).toBe(0);
		expect(this.world.cameras["camera0"].target.y).toBe(0);
		expect(this.world.cameras["camera0"].target.z).toBe(0);
		expect(this.world.cameras["camera0"]).toBe(this.world.activeCamera);
	});

	it("should render the world calling drawInstances for all the models", function() {
		spyOn(this.world.models["box"], "drawInstances");
		spyOn(this.world.models["robot_arm"], "drawInstances");
		this.world.draw();
		expect(this.world.models["box"].drawInstances).toHaveBeenCalled();
		expect(this.world.models["robot_arm"].drawInstances).toHaveBeenCalled();
	});

	it("should update the instances with the given data", function() {
		var data = [
			{ "id": "0", "position": {"x": 1, "y": 1, "z": 1}}
		];

		this.world.updateInstances(data);
		expect(this.world.instances["box"][0].position.x).toBe(1);
		expect(this.world.instances["box"][0].position.y).toBe(1);
		expect(this.world.instances["box"][0].position.z).toBe(1);
	});
});