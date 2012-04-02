if (typeof define !== 'function') {
	var define = require('amdefine')(module);
}

define(["./geometry", "./utils"], function(Geometry, Utils) {
	var Graphics = {};
	Graphics.Geometry = Geometry;
	Graphics.Utils = Utils;
	return Graphics;
});