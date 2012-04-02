var sys = require('util');
var fs = require('fs');
var exec = require('child_process').exec;
var requirejs = require('requirejs');

var config = {
	baseUrl: ".",
	name: "src/goom-graphics",
	out: "dist/goom-graphics.min.js",
};

desc("This is the default task.");
task("default", function(params) {
	//Do something.
});

desc("Runs all the tests.");
task("test", function(params){
	exec("jasmine-node spec/", function (error, stdout, stderr) {
		sys.print(stdout);
	});
});

desc("Builds the project into a minified file.");
task("build", function(params){
	console.log("Building the project into a minified file...")
	requirejs.optimize(config, function (buildResponse) {
		fs.unlink('dist/build.txt');
		fs.rename('dist/goom-graphics.js', 'dist/goom-graphics.min.js');
		console.log("The file is ready at dist/goom-graphics.min.js");
	});
});
