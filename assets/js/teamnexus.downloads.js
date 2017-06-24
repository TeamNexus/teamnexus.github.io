/*
 * JavaScript-Parser for NexusOS OTA-API
 *
 * @author		Lukas Berger <https://lukasberger.at>
 * @license		GPL3
 */
var DOWNLOADS = new Array();

$(function() {

	$.ajax({
		url: "https://stor.lukasberger.at/teamnexus/ota.php"
	})
		.done(ota_ajax_done)
		.fail(ota_ajax_fail);

	$('#ota-search').keyup(function() {

		var text = $('#ota-search').val().toLowerCase().split(' ');

		$('tr[data-search]').each(function() {

			var otaItem = $(this);
			var otaSearchData = otaItem.attr('data-search');
			var hasMatched = false;

			for (var i = 0; i < text.length; i++) {
				var textElement = text[i];
				if (i == 0 || hasMatched)
					hasMatched = otaSearchData.toLowerCase().indexOf(textElement) > -1;
			}

			if (hasMatched)
				otaItem.css('display', 'table-row');
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

	ota_ajax_show_devices();
}

function ota_ajax_process_device_stage(stage, data) {
	// loop through ROMs
	for (var rom in data) {
		var props     = data[rom]['props'];
		var url       = data[rom]['url'];

		// they'll be process later, sort them by manufacturer and model first
		var prop_product_brand = props['ro.product.brand'];
		var prop_product_name  = props['ro.product.name'];

		// store it
		if (DOWNLOADS[prop_product_brand] === undefined)
			DOWNLOADS[prop_product_brand] = new Array();

		if (DOWNLOADS[prop_product_brand][prop_product_name] === undefined)
			DOWNLOADS[prop_product_brand][prop_product_name] = new Array();

		if (DOWNLOADS[prop_product_brand][prop_product_name][rom] === undefined)
			DOWNLOADS[prop_product_brand][prop_product_name][rom] = new Array();

		if (DOWNLOADS[prop_product_brand][prop_product_name][rom][stage] === undefined)
			DOWNLOADS[prop_product_brand][prop_product_name][rom][stage] = new Array();

		DOWNLOADS[prop_product_brand][prop_product_name][rom][stage]['url'] = url;
		DOWNLOADS[prop_product_brand][prop_product_name][rom][stage]['stage'] = stage;
		DOWNLOADS[prop_product_brand][prop_product_name][rom][stage]['props'] = props;
	}

	DOWNLOADS = sortObject(DOWNLOADS);
}

function ota_ajax_show_devices() {
	var html = "";
	var sidebar = "";
	var id = "";

	// first, go through manufacturer
	for (var manufacturer in DOWNLOADS) {
		var models = DOWNLOADS[manufacturer];
		var manufacturerSidebar = "";
		models = sortObject(models);

		// then through models
		for (var model in models) {
			var roms = models[model];
			var modelSearchData = "";
			var modelSidebar = "";
			var modelHtml = "";
			roms = sortObject(roms);

			for (var rom in roms) {
				var stages = roms[rom];

				// and then the ROMs
				for (var stage in stages) {
					var data  = stages[stage];
					var props = data['props'];
					var url   = data['url'];

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

					id = manufacturer.toLowerCase().replace(' ', '-') + '-' + 
						model.toLowerCase().replace(' ', '-') + '-' +
						rom.toLowerCase().replace(' ', '-') + '-' +
						stage.toLowerCase().replace(' ', '-');

					var searchData = prop_nexus_otarom + ' ' + prop_product_brand + ' ' + prop_product_name + ' ' +prop_board_platform + ' ' + prop_product_board + ' ' +  prop_chipname;
					var stageColor = (stage == "release" ? "success" : "warning");
					var stageDisplay = ' (' + (stage == "release" ? "Release" : "Testing") + ')';

					if (modelSearchData == "") {
						modelSearchData = searchData;
					} else {
						modelSearchData = prop_nexus_otarom + ' ' + modelSearchData;
					}

					modelHtml += '<tr id="' + id + '" class="table-' + stageColor + '" data-search="' + searchData + '" data-spy="scroll">';
					modelHtml += '	<th scope="row">';
					modelHtml += '		<a href="' + url + '">' + prop_nexus_otarom + stageDisplay + '</a>';
					modelHtml += '	</th>';
					// modelHtml += '	<td>' + prop_product_brand + ' ' + prop_product_name + '</td>';
					modelHtml += '	<td>' + dateFormat(prop_build_data_utc * 1000, "dd.mm.yyyy, HH:MM:ss") + '</td>';
					modelHtml += '	<td>' + prop_build_version_release + ' (Patch ' + prop_build_version_security_patch + ')</td>';
					modelHtml += '</tr>';

					modelSidebar += '<li class="nav-item"><a class="nav-link" href="#' + id + '">' + rom + stageDisplay + '</a></li>';
				}
			}

			id = manufacturer.toLowerCase().replace(' ', '-') + '-' + 
				model.toLowerCase().replace(' ', '-');

			html += '<tr id="' + id + '" class="thead-inverse" data-search="' + modelSearchData + '" data-spy="scroll">';
			html += '	<th scope="row" colspan="3">' + manufacturer + ' ' + model + '</th>';
			html += '</tr>';
			html += modelHtml;

			manufacturerSidebar += '<li class="nav-item">';
			manufacturerSidebar += '	<a class="nav-link" href="#' + id + '">' + model + '</a>';
			manufacturerSidebar += '	<ul class="nav nav-pills flex-column">' + modelSidebar + '</ul>';
			manufacturerSidebar += '</li>';
		}

		sidebar += '<li class="nav-item">';
		sidebar += '	<span class="nav-link">' + manufacturer + '</span>';
		sidebar += '	<ul class="nav nav-pills flex-column">' + manufacturerSidebar + '</ul>';
		sidebar += '</li>';
	}

	$('#downloads').append(html);
	$('#sidebar').css({ 'top': $('body > .container').offset().top });
	$('#sidebar > ul').append(sidebar);
}

function clone(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

function sortObject(o) {
    var sorted = {},
    key, a = [];

    for (key in o) {
        if (o.hasOwnProperty(key)) {
            a.push(key);
        }
    }

    a.sort();

    for (key = 0; key < a.length; key++) {
        sorted[a[key]] = o[a[key]];
    }
    return sorted;
}
