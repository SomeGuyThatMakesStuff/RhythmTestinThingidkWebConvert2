var parser = module.require("osuparser");
var format = module.require('format');

module.export("osu_to_lua", function(osu_file_contents) {
	var rtv_lua = "";
	var append_to_output = function(str, newline) {
		if (newline === undefined || newline === true) {
			rtv_lua += (str + "\n");
		} else {
			rtv_lua += (str);
		}
	};

	var beatmap = parser.parseContent(osu_file_contents);

	function hitobj_x_to_track_number(hitobj_x) {
		if (hitobj_x < 100) return 1;
		if (hitobj_x < 200) return 2;
		if (hitobj_x < 360) return 3;
		return 4;
	}

	var _tracks_next_open = { 1: -1, 2: -1, 3: -1, 4: -1 };
	var _i_to_removes = {};

	for (var i = 0; i < beatmap.hitObjects.length; i++) {
		var obj = beatmap.hitObjects[i];
		var track = hitobj_x_to_track_number(obj.position[0]);
		var start_time = obj.startTime;

		if (_tracks_next_open[track] >= start_time) {
			_i_to_removes[i] = true;
			continue;
		} else {
			_tracks_next_open[track] = start_time;
		}

		if (obj.objectName == "slider") {
			var end_time = start_time + obj.duration;
			if (_tracks_next_open[track] >= end_time) {
				_i_to_removes[i] = true;
				continue;
			} else {
				_tracks_next_open[track] = end_time;
			}
		}
	}

	beatmap.hitObjects = beatmap.hitObjects.filter((_, i) => !_i_to_removes[i]);

	append_to_output("local rtv = {}");
	append_to_output("rtv.HitObjects = {}");
	append_to_output("local function note(time,track) rtv.HitObjects[#rtv.HitObjects+1]={Time=time;Type=1;Track=track;} end");
	append_to_output("local function hold(time,track,duration) rtv.HitObjects[#rtv.HitObjects+1]={Time=time;Type=2;Track=track;Duration=duration;} end");
	append_to_output("--");

	for (var i = 0; i < beatmap.hitObjects.length; i++) {
		var obj = beatmap.hitObjects[i];
		var track = hitobj_x_to_track_number(obj.position[0]);

		if (obj.objectName == "slider") {
			append_to_output(format("hold(%d,%d,%d)", obj.startTime, track, obj.duration));
		} else {
			append_to_output(format("note(%d,%d)", obj.startTime, track));
		}
	}

	append_to_output("--");
	append_to_output("return rtv");

	return rtv_lua;
});
