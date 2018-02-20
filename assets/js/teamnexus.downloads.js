/*
 * TeamNexus Download Browser Frontend JavaScript
 */
$(function() {

	$.ajax({
		url: "https://stor.lukasberger.at/TeamNexus/index.json",
		datsType: "json",
	})
	.done(function(otadata) {
		jQuery.each(otadata, function(key) {
			var data = otadata[key];
			var skel = $('<tr />');

			var deviceName = data["device"]["name"];
			var deviceModel = data["device"]["model"];
			var deviceDisplayName = ANDROID_DEVICE_NAMES_REGISTRY[deviceModel];
			var buildType = "Unknown";

			if (data["type"] == "BUILD") {
				buildType = "Build";
			} else if (data["type"] == "KERNEL") {
				buildType = "Kernel";
			}

			skel.attr('data-meta', deviceName + ' ' + deviceModel + ' ' + deviceDisplayName + ' ' + buildType + ' ' + data["rom"]["version"] + ' ' + data["rom"]["name"]);

			skel.append('<td scope="row">' + deviceDisplayName + '</td>');
			skel.append('<td><a href="javascript:void()" alt="More informations about the build for ' + deviceModel + '">' + deviceModel + '</a></td>');
			skel.append('<td>' + data["rom"]["name"] + ' ' + data["rom"]["version"] + '</td>');
			skel.append('<td>' + dateFormat(data["rom"]["date"] * 1000, "dd.mm.yyyy HH:MM:ss") + '</td>');
			skel.append('<td>' + buildType + '</td>');
			
			var downloadTD = $('<td />');
			var downloadLink = $('<a />');

			// fallback
			downloadLink.html(deviceModel);
			downloadLink.attr("href", data["download"]);

			// download-dialog

			downloadTD.append(downloadLink);
			skel.append(downloadTD);

			$('#downloads').append(skel);
		});
	});

});;