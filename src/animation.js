var Mathematics = require("goom-math-js");

var Animation = function() {
	this.name = null;
	this.frameRate = 0;
	this.duration = 0;
	this.frameCount = 0;
	this.bonesIds = {};
	this.keyframes = [];
	this.complete = false;
};

Animation.prototype.load = function (data) {
	this.__parseAnim(data);
};

Animation.prototype.__parseAnim = function (data) {
	this.name = data.name;
	this.frameRate = data.frameRate;
	this.duration = data.duration;
	this.frameCount = data.frameCount;

	for(var i = 0; i < data.bones.length; ++i) {
		this.bonesIds[data.bones[i]] = i;
	}

	this.keyframes = data.keyframes;

	var j, keyframe, bone;
	for (i in this.keyframes) {
	keyframe = this.keyframes[i];

		for(j in keyframe) {
			bone = keyframe[j];
			bone.pos = new Mathematics.Vector3D(bone.pos[0], bone.pos[1], bone.pos[2]);
			bone.rot = new Mathematics.Quaternion(bone.rot[3], bone.rot[0], bone.rot[1], bone.rot[2]);
		}
	}
};

/**
	Updates the pose in the given model.
*/
Animation.prototype.updatePose = function (frame_id, model) {
	var bones = model.bones;
	if(!bones) { return; }
	
	var frame = this.keyframes[frame_id], bone_id, bone, frame_bone, parent;

	for(var i = 0; i < bones.length; ++i) {
		bone = bones[i];
		bone_id = this.bonesIds[bone.name];

		if(bone_id !== undefined) {
			frame_bone = frame[bone_id];
			bone.pos = frame_bone.pos;
			bone.rot = frame_bone.rot;
		}

		if(bone.parent !== -1) {
			parent = bones[bone.parent];

			// Apply the parent transform to this bone
			parent.worldRot.multiplyVector(bone.pos, bone.worldPos);
			bone.worldPos.add(parent.worldPos);
			parent.worldRot.multiply(bone.rot, bone.worldRot);
		}

		// We only need to compute the matrices for bones that actually have vertices assigned to them
		if(bone.skinned) {
			bone.boneMat.makeFromPositionAndOrientation(bone.worldPos, bone.worldRot);
			bone.boneMat.multiply(bone.bindPoseMat);
		}
	}

	model._dirtyBones = true; // Notify the model that it needs to update it's bone matrices
};

module.exports = Animation;