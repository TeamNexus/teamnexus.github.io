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
	var filters = new Array();

	// first, go through manufacturer
	for (var manufacturer in DOWNLOADS) {
		var models = DOWNLOADS[manufacturer];
		var manufacturerSidebar = "";
		models = sortObject(models);

		if (filters[manufacturer] === undefined)
			filters[manufacturer] = new Array();

		// then through models
		for (var model in models) {
			var roms = models[model];
			var modelSearchData = "";
			var modelSidebar = "";
			var modelHtml = "";
			var modelInfo = "";
			roms = sortObject(roms);

			if (filters[manufacturer][model] === undefined)
				filters[manufacturer][model] = new Array();

			for (var rom in roms) {
				var stages = roms[rom];

				if ($.inArray(rom, filters[manufacturer][model]))
					filters[manufacturer][model].push(rom);

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

					modelInfo = "";
					modelInfo += ' data-manufacturer="' + manufacturer.replace(' ', '-').toLowerCase() + '"';
					modelInfo += ' data-model="' + model.replace(' ', '-').toLowerCase() + '"';
					modelInfo += ' data-rom="' + rom.replace(' ', '-').toLowerCase() + '"';
					modelInfo += ' data-stage="' + stage.toLowerCase() + '"';

					modelHtml += '<tr id="' + id + '" class="table-' + stageColor + '" data-search="' + searchData + '"' + modelInfo + '>';
					modelHtml += '	<th scope="row">';
					modelHtml += '		<a href="' + url + '">' + prop_nexus_otarom + stageDisplay + '</a>';
					modelHtml += '	</th>';
					// modelHtml += '	<td>' + prop_product_brand + ' ' + prop_product_name + '</td>';
					modelHtml += '	<td>' + dateFormat(prop_build_data_utc * 1000, "dd.mm.yyyy, HH:MM:ss") + '</td>';
					modelHtml += '	<td>' + prop_build_version_release + ' (Patch ' + prop_build_version_security_patch + ')</td>';
					modelHtml += '</tr>';

					modelSidebar += '<li class="nav-item downloads-sidebar" data-search="' + modelSearchData + '"' + modelInfo + '>';
					modelSidebar += '	<a class="nav-link" href="#' + id + '">' + rom + stageDisplay + '</a>';
					modelSidebar += '</li>';
				}
			}

			id = manufacturer.toLowerCase().replace(' ', '-') + '-' + 
				model.toLowerCase().replace(' ', '-');

			modelInfo = "";
			modelInfo += ' data-manufacturer="' + manufacturer.replace(' ', '-').toLowerCase() + '"';
			modelInfo += ' data-model="' + model.replace(' ', '-').toLowerCase() + '"';
			modelInfo += ' data-rom=""';
			modelInfo += ' data-stage=""';

			html += '<tr id="' + id + '" class="thead-inverse" data-search="' + modelSearchData + '"' + modelInfo + '>';
			html += '	<th scope="row" colspan="3">' + manufacturer + ' ' + model + '</th>';
			html += '</tr>';
			html += modelHtml;

			manufacturerSidebar += '<li class="nav-item downloads-sidebar" data-search="' + modelSearchData + '"' + modelInfo + '>';
			manufacturerSidebar += '	<a class="nav-link" href="#' + id + '">' + model + '</a>';
			manufacturerSidebar += '	<ul class="nav nav-pills flex-column">' + modelSidebar + '</ul>';
			manufacturerSidebar += '</li>';
		}

		modelInfo = "";
		modelInfo += ' data-manufacturer="' + manufacturer.replace(' ', '-').toLowerCase() + '"';
		modelInfo += ' data-model=""';
		modelInfo += ' data-rom=""';
		modelInfo += ' data-stage=""';

		sidebar += '<li class="nav-item downloads-sidebar" data-search="' + modelSearchData + '"' + modelInfo + '>';
		sidebar += '	<span class="nav-link">' + manufacturer + '</span>';
		sidebar += '	<ul class="nav nav-pills flex-column">' + manufacturerSidebar + '</ul>';
		sidebar += '</li>';
	}

	// init filter
	for (var manufacturer in filters) {
		var models = filters[manufacturer];
		for (var model in models) {
			var roms = models[model];
			for (var rom in roms) {
				rom = roms[rom];
				$('#downloads-rom').append('<option value="' + rom.replace(' ', '-').toLowerCase() + '">' + rom + '</option>');
			}
			$('#downloads-model').append('<option value="' + model.replace(' ', '-').toLowerCase() + '">' + model + '</option>');
		}		
		$('#downloads-manufacturer').append('<option value="' + manufacturer.replace(' ', '-').toLowerCase() + '">' + manufacturer + '</option>');
	}
	
	$('#downloads-stage, #downloads-manufacturer, #downloads-model, #downloads-rom').change(function() {
		var val_stage        = $('#downloads-stage').val();
		var val_manufacturer = $('#downloads-manufacturer').val();
		var val_model        = $('#downloads-model').val();
		var val_rom          = $('#downloads-rom').val();

		$('tr[data-search], li.downloads-sidebar[data-search]').each(function() {

			var otaItem = $(this);
			var data_stage        = otaItem.attr('data-stage');
			var data_manufacturer = otaItem.attr('data-manufacturer');
			var data_model        = otaItem.attr('data-model');
			var data_rom          = otaItem.attr('data-rom');

			if ((val_stage == "" || data_stage == "" || val_stage == data_stage) &&
					(val_manufacturer == "" || data_manufacturer == "" || val_manufacturer == data_manufacturer) &&
					(val_model == "" || data_model == "" || val_model == data_model) &&
					(val_rom == "" || data_rom == "" || val_rom == data_rom))
				otaItem.css('display', 'table-row');
			else
				otaItem.css('display', 'none');

		});
	});

	$('#downloads').append(html);
	$('#sidebar').css({ 'top': $('body > .container').offset().top });
	$('#sidebar > ul').append(sidebar);
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
