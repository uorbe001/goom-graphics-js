var sys = require('util');
var fs = require('fs');
var exec = require('child_process').exec;

desc("This is the default task.");
task("default", function(params) {
	//Do something.
});

desc("Runs all the tests.");
task("test", function(params){
	exec("jasmine-node spec/unit", function (error, stdout, stderr) {
		sys.print(stdout);
	});
});

desc("Builds the project into a minified file.");
task("build", function(params){
	console.log("Building the project into a minified file...")
	exec("browserify src/goom-graphics.js  -o dist/goom-graphics.js", function (error, stdout, stderr) {
		sys.print(stdout);
		if (error)
			sys.print(stderr);
		else
			console.log("The file is ready at dist/goom-graphics.js");
	});
});
