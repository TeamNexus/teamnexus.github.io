/*
 * JavaScript-Parser for NexusOS OTA-API
 *
 * @author		Lukas Berger <https://lukasberger.at>
 * @license		GPL3
 */
$(function() {

	$.ajax({
		url: "https://stor.lukasberger.at/teamnexus/ota.php"
	})
		.done(ota_ajax_done)
		.fail(ota_ajax_fail);

	$('#ota-search').keyup(function() {

		var text = $('#ota-search').val().toLowerCase().split(' ');

		$('.ota-search').each(function() {

			var otaItem = $(this);
			var otaSearchData = otaItem.attr('data-search');
			var hasMatched = false;

			for (var i = 0; i < text.length; i++) {
				var textElement = text[i];
				if (i == 0 || hasMatched)
					hasMatched = otaSearchData.toLowerCase().indexOf(textElement) > -1;
			}

			if (hasMatched)
				otaItem.css('display', 'inline-block');
			else
				otaItem.css('display', 'none');

		});

	});

});

function ota_ajax_fail(data) {
	$('#modal-message-title').text("Failed to get build-informations");
	$('#modal-message-content').html(
		"<p>I couldn't fetch the current build-informations from the server :(</p>" +
		"<p>Reload the page or wait some minutes</p>"
	);

	$('#modal-message').modal();
}

function ota_ajax_done(data) {
	// loop through device-categories
	for (var device in data) {
		// release
		if (data[device]['release'] !== undefined)
			ota_ajax_process_device_stage("release", data[device]['release']);

		// testing
		if (data[device]['testing'] !== undefined)
			ota_ajax_process_device_stage("testing", data[device]['testing']);
	}
}

function ota_ajax_process_device_stage(stage, data) {
	// loop through ROMs
	for (var rom in data) {
		var props     = data[rom]['props'];
		var url       = data[rom]['url'];

		var prop_board_platform               = props['ro.board.platform'];
		var prop_build_data_utc               = parseInt(props['ro.build.date.utc']);
		var prop_product_board                = props['ro.product.board'];
		var prop_product_brand                = props['ro.product.brand'];
		var prop_product_name                 = props['ro.product.name'];
		var prop_chipname                     = props['ro.chipname'];
		var prop_nexus_otarom                 = props['ro.nexus.otarom'];
		var prop_build_version_release        = props['ro.build.version.release'];
		var prop_build_version_security_patch = props['ro.build.version.security_patch'];

		var build_time_diff = (Math.round(new Date() / 1000) - prop_build_data_utc);
		var build_time_str  = "";
		if (build_time_diff >= 31536000) {
			build_time_str  = Math.floor(build_time_diff / 31536000);
			build_time_str += " year" + (build_time_str == 1 ? "" : "s") + " ago";
		} else if (build_time_diff >= 2073600) {
			build_time_str  = Math.floor(build_time_diff / 2073600);
			build_time_str += " month" + (build_time_str == 1 ? "" : "s") + " ago";
		} else if (build_time_diff >= 86400) {
			build_time_str  = Math.floor(build_time_diff / 86400);
			build_time_str += " day" + (build_time_str == 1 ? "" : "s") + " ago";
		} else if (build_time_diff >= 3600) {
			build_time_str  = Math.floor(build_time_diff / 3600);
			build_time_str += " hour" + (build_time_str == 1 ? "" : "s") + " ago";
		} else if (build_time_diff >= 60) {
			build_time_str  = Math.floor(build_time_diff / 60);
			build_time_str += " minute" + (build_time_str == 1 ? "" : "s") + " ago";
		} else {
			build_time_str  = Math.floor(build_time_diff);
			build_time_str += " second" + (build_time_str == 1 ? "" : "s") + " ago";
		}

		var searchData = prop_nexus_otarom + ' ' + prop_product_brand + ' ' + prop_product_name + ' ' +prop_board_platform + ' ' + prop_product_board + ' ' +  prop_chipname;
		var itemColor = (stage == "release" ? "success" : "warning");
		var html = "";

		html += '<a href="' + url + '" class="ota-search list-group-item list-group-item-action flex-column align-items-start list-group-item-' + itemColor + '" data-search="' + searchData + '">';
		html += '	<div class="d-flex w-100 justify-content-between">';
		html += '		<h5 class="mb-1">' + prop_nexus_otarom + ' for ' + prop_product_brand + ' ' + prop_product_name + '</h5>';
		html += '		<small>' + build_time_str + '</small>';
		html += '	</div>';
		html += '	<p>';
		html += '		<em class="fa fa-clock-o"></em> <strong>Build-Date:</strong> ' + dateFormat(prop_build_data_utc * 1000, "dd.mm.yyyy, HH:MM:ss") + '<br />';
		html += '		<em class="fa fa-android"></em> <strong>Release:</strong> ' + prop_build_version_release + '<br />';
		html += '		<em class="fa fa-shield"></em> <strong>Security-Patch:</strong> ' + prop_build_version_security_patch;
		html += '	</p>';
		html += '</a>';

		$('#downloads').append(html);
	}
}
