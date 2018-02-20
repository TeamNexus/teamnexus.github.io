/*
 * TeamNexus Download Browser Frontend JavaScript
 */
$(function() {

	$.ajax({
		url: "https://stor.lukasberger.at/TeamNexus/index.json",
		datsType: "json",
	})
	.done(function(otadata) {
		$('#downloads-loading').remove();

		jQuery.each(otadata, function(key) {
			var data = otadata[key];
			var skel = $('<tr />');

			var deviceName = data["device"]["name"];
			var deviceModel = data["device"]["model"];
			var deviceDisplayName = ANDROID_DEVICE_NAMES_REGISTRY[deviceModel];
			var buildType = "Unknown";
			var downloadURL = data["download"]/*["url"]*/;

			if (data["type"] == "BUILD") {
				buildType = "Build";
			} else if (data["type"] == "KERNEL") {
				buildType = "Kernel";
			}

			skel.attr('data-meta', deviceName + ' ' + deviceModel + ' ' + deviceDisplayName + ' ' + buildType + ' ' + data["rom"]["version"] + ' ' + data["rom"]["name"]);

			skel.append('<td scope="row">' + deviceDisplayName + '</td>');
			skel.append('<td>' + deviceModel + '</td>');
			skel.append('<td>' + data["rom"]["name"] + ' ' + data["rom"]["version"] + '</td>');
			skel.append('<td>' + dateFormat(data["rom"]["date"] * 1000, "dd.mm.yyyy HH:MM:ss") + '</td>');
			skel.append('<td>' + buildType + '</td>');
			
			var downloadTD = $('<td />');
			var downloadLink = $('<a />');

			downloadLink.html(deviceModel);

			// fallback
			downloadLink.attr("href", downloadURL);

			// download-dialog
			downloadLink.click(function(e) {
				// check if XMLHttpRequest is supported
				if (typeof XMLHttpRequest === "undefined") {
					return; // unsupported
				}

				// check if Blob is supported
				if (typeof Blob === "undefined") {
					return; // unsupported
				}

				e.preventDefault();

				$('.dlmodal-build-type').text(buildType);
				$('.dlmodal-device-display-name').text(deviceDisplayName);
				$('.dlmodal-device-model').text(deviceModel);

				$('.dlmodal-rom-name').text(data["rom"]["name"]);
				$('.dlmodal-rom-version').text(data["rom"]["version"]);
				$('.dlmodal-rom-date').text(dateFormat(data["rom"]["date"] * 1000, "dd.mm.yyyy HH:MM:ss"));

				$('#dlmodal').modal({
					backdrop: 'static',
					keyboard: false
				});
				
				console.log(downloadURL);

				$.ajax({
					xhr: function()
					{
						var xhr = new window.XMLHttpRequest();

						// Download progress
						xhr.addEventListener("progress", function(evt){
							if (evt.lengthComputable) {
								var percentComplete = (evt.loaded / evt.total) * 100;

								$('#dlmodal-progress').css('width', percentComplete + '%');
								$('#dlmodal-progress-text').text(format_bytes(evt.loaded) + ' / ' + format_bytes(evt.total));
							}
						}, false);

						$('#dlmodal-abort').click(function() {
							xhr.abort();
							$('#dlmodal').modal("hide");
						});

						xhr.responseType = 'blob';
						return xhr;
					},
					type: 'GET',
					url: downloadURL,
					data: { },
					success: function(data){
						var blob = new Blob([data], { type: "octet/stream" });
						var downloadUrl = URL.createObjectURL(blob);
						var a = document.createElement("a");
						var filename = downloadURL.substring(downloadURL.lastIndexOf('/')+1);

						a.href = downloadUrl;
						a.download = filename;
						document.body.appendChild(a);
						a.click();
					}
				});

			});

			downloadTD.append(downloadLink);
			skel.append(downloadTD);

			$('#downloads').append(skel);
		});
	});

});

function format_bytes(bytes, precision) {
	var suffixes = [ "Bytes", "KB", "MB", "GB", "TB" ];
	var suffix_index = 0;

	while (bytes / 1024.0 > 0.9 && suffix_index < suffixes.length) {
		bytes /= 1024.0;
		suffix_index++;
	}

	return (Math.round(bytes * 100.0) / 100.0) + " " + suffixes[suffix_index];
}
