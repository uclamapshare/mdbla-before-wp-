/***

	Namespace and defaults

***/
	var mdbla = {};
	mdbla.activeTab = 'prison';
	mdbla.fipsarray = [];
	mdbla.jailarray = [];
	mdbla.jailranks;
	mdbla.bookingsarray = [];
	mdbla.bookingsranks;
	mdbla.bookmarks = [];
	mdbla.allowHover = true;


/*

	Highlighted polygon/data

*/
	mdbla.highlightedPolygon;
	mdbla.highlightedData;
	mdbla.highlightedGeographyID;
	mdbla.highlightedGeographyName;
	mdble.highlightedRanking;

/*

	Data storage

*/
	mdbla.summary={};
	mdbla.data={};
	mdbla.geojson={};

/*

	Colors for charts
	blue: 	#1F78B4
	orage: 	#FF7F00
	green: 	#33A02C
	purple: #6A3D9A
	red: 	#E31A1C

*/
	mdbla.colorPallete = ['#6A3D9A','#FF7F00','#33A02C','#1F78B4','#E31A1C'];


/*

	Map related settings

*/
	mdbla.geography = 'LASDNeighborhoods';
	mdbla.department = 'LASD';
	mdbla.map;
	mdbla.layerCarto;
	mdbla.cartoSubLayer;
	mdbla.geographyIDColumn = {
		'BlockGroups' : 'fips_1',
		'LASDNeighborhoods' : 'slug'
	}

/*

	CartoDB/Mapbox params

*/
	mdbla.cartoKey = '701af57a932440fbe504882c6ccc8f6b3d83488f';
	mdbla.cartoLayerTable = {
		'BlockGroups' : 'lasd_2010_2015_by_block_group',
		'LASDNeighborhoods' : 'lasd_2010_2015_by_neighborhoods_merge'
	}
	mdbla.cartoLayerMap = {
		'BlockGroups' : 'https://mdbla.carto.com/api/v2/viz/e610732a-59ca-11e6-8760-0ecd1babdde5/viz.json',
		'LASDNeighborhoods' : 'https://mdbla.carto.com/api/v2/viz/95917d26-5b65-11e6-b8d9-0e233c30368f/viz.json',
		'LAPDNeighborhoods' : 'https://mdbla.carto.com/api/v2/viz/21c7ebb4-659c-11e6-b830-0e3ff518bd15/viz.json',

	}

	// mapbox token
	L.mapbox.accessToken = 'pk.eyJ1IjoieW9obWFuIiwiYSI6IkxuRThfNFkifQ.u2xRJMiChx914U7mOZMiZw';

/*

	Map layers

*/
	// satellite layer
	mdbla.layerSatellite = L.mapbox.styleLayer('mapbox://styles/mapbox/satellite-v9',{'zIndex':0})

	// label layer
	mdbla.layerLabel = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
		subdomains: 'abcd',
		maxZoom: 19,
		zIndex: 3
	})

/***

	Window resize adjustments

***/
$( window ).resize(function() {
	mdbla.resize();
});

mdbla.resize = function()
{
	$('#map').css('height',$(window).height()+'px');
	// calculate how much to subtract from window height
	var subtractamount = 35+$('#main-menu').height()+$('#display-bookmarks-container').height()+$('#display-geography-title').height()+$('#footer').height();
	$('.menu-content').css('height',$(window).height()-subtractamount+'px');
}

/***

	Let's get this show on the road

***/
$( function() 
{
	console.log('init')
	// adjust windows
	mdbla.resize()

	mdbla.map = new L.Map('map');

	mdbla.map
	.addControl(L.mapbox.geocoderControl('mapbox.places', {
		autocomplete: true
	}));
	
	// fit the map to LA County
	mdbla.map.fitBounds([
		[34.7, -118.85],
		[33.8, -117.75]
	]);

	mdbla.layerSatellite.addTo(mdbla.map)
	// add layer control
	mdbla.layerControl = L.control.layers(null,{"Satellite":mdbla.layerSatellite,"Labels":mdbla.layerLabel}).addTo(mdbla.map)

	// create real-time css for color pallete
	$("<style>")
		.prop("type", "text/css")
		.html(".vis-item.vis-dot.color1{border-color:"+mdbla.colorPallete[0]+";}")
		.append(".vis-item.vis-dot.color2{border-color:"+mdbla.colorPallete[1]+";}")
		.append(".vis-item.vis-dot.color3{border-color:"+mdbla.colorPallete[2]+";}")
		.append(".vis-item.vis-dot.color4{border-color:"+mdbla.colorPallete[3]+";}")
		.appendTo("head");

	// activate tooltips
	$('[data-toggle="tooltip"]').tooltip()

	// go get the data
	mdbla.cartoSQL();

	// click functions
	mdbla.clickFunctions();
	
});

/***

	Assign buttons to perform various functions

***/
mdbla.clickFunctions = function()
{
	$('#button-neighborhoods').click(function(){ mdbla.toggleGeography() })
	$('#button-blockgroups').click(function(){ mdbla.toggleGeography() })
	
	$('#button-LASD').click(function(){ mdbla.toggleGeography('LASDNeighborhoods') })
	$('#button-LAPD').click(function(){ mdbla.toggleGeography('LAPDNeighborhoods') })
	$('#button-COMBINED').click(function(){ mdbla.toggleGeography() })

	$('#button-prison').click(function(){ mdbla.activeTab = 'prison'; mdbla.displayPrisonData() })
	$('#button-charges').click(function(){ mdbla.activeTab = 'charges'; mdbla.displayCharges() })
	$('#button-timeline').click(function(){ mdbla.activeTab = 'timeline'; mdbla.displayTimeline() })
	$('#button-daysinjail').click(function(){ mdbla.activeTab = 'daysinjail'; mdbla.displayDaysInJailChart() })
	$('#button-rankings').click(function(){ mdbla.activeTab = 'rankings'; mdbla.displayRankings() })
}

/***

	Allow toggling of main geography
	Neighborhoods or Census BlockGroups

***/
mdbla.toggleGeography = function(geography)
{
	console.log('toggling...')
	mdbla.geography = geography;

	// reset the map
	mdbla.cartoSubLayer.hide()

	// remove highlighted polygon
	if(mdbla.highlightedPolygon) {mdbla.map.removeLayer(mdbla.highlightedPolygon)};

	// get rid of any open tooltip windows and statss
	$('.cartodb-tooltip').hide();

	//clear title
	$('#display-geography-title').html('...loading...');

	// clear bookmarks
	$('#display-bookmarks').empty();
	mdbla.bookmarks.length = 0;


	mdbla.allowHover = true;

	// reset the tabs
	$('#stats-content-prison1').empty();
	$('#stats-content-prison2').empty();
	$('#stats-content-charges').empty();
	$('#stats-content-timeline').empty();
	$('#stats-content-daysinjail').empty();
	$('#stats-content-rankings').empty();

	if(mdbla.geography == 'LASDNeighborhoods')
	{
		$('#display-geography').html('LASDNeighborhoods');
	}
	else if (mdbla.geography == 'LAPDNeighborhoods')
	{
		$('#display-geography').html('LAPDNeighborhoods');
	}

	// add the layer control back to the map
	mdbla.cartoSQL();
}

/***

	Booking data is stored in CartoDB. 
	These SQL calls pull the data into
	the application

***/
mdbla.cartoSQL = function(sql)
{
	// some summary stuff sql
	var sql_statement1 = 'SELECT MAX(_jaildays) as jailmax,MIN(_jaildays) as jailmin,MAX(_bookings) as bookingsmax,MIN(_bookings) as bookingsmin,AVG(_jaildays) as "jailavg",AVG(_bookings) as "bookingsavg",MAX(_cost) as "costmax",MIN(_cost) as "costmin",AVG(_cost) as "costavg" FROM '+mdbla.cartoLayerTable[mdbla.geography]+'';

	// main data sql
	// var sql_statement2 = 'SELECT name,fips,_bookings,_jaildays,_cost FROM '+mdbla.cartoLayerTable[mdbla.geography]+' ORDER BY _cost DESC ';
	var sql_statement2 = 'SELECT * FROM '+mdbla.cartoLayerTable[mdbla.geography]+' ORDER BY _cost DESC ';

	// get geojson for each polygon
	// WARNING: may take time
	var sql_statement3 = 'SELECT * FROM '+mdbla.cartoLayerTable[mdbla.geography];

	// go fetch 'em
	if(mdbla.summary[mdbla.geography] == undefined)
	{
		var sql1 = $.getJSON('https://mdbla.carto.com/api/v2/sql/?q='+sql_statement1+'&api_key='+mdbla.cartoKey, function(data) {
			mdbla.summary[mdbla.geography] = data.rows[0];
		});
	}

	/*
		Go get the data from Carto
		Cache the data into mdbla objects
		Chain them so that ajax doesn't screw us
	*/
	// if it hasn't been cached
	if(mdbla.data[mdbla.geography] == undefined)
	{
		var sql2 = sql1.then(function(){
			$.getJSON('https://mdbla.carto.com/api/v2/sql/?q='+sql_statement2+'&api_key='+mdbla.cartoKey, function(data) {
				mdbla.data[mdbla.geography] = data;
				// we got the data, let's populate the dropdown-neighborhood
				// mdbla.createNeighborhoodDropdown();
			})
			.then(function(){
				$.getJSON('https://mdbla.carto.com/api/v2/sql/?format=GeoJSON&q='+sql_statement3+'&api_key='+mdbla.cartoKey, function(data) {
					mdbla.geojson[mdbla.geography] = data.features;
				})
				.then(function(){
					// data is got. now create the rankings and start the mapping
					mdbla.createRankings();
					mdbla.setMap();
				})
			})
		})
	}
	// use cached data
	else
	{
		console.log('data is already defined...')
		// data is got. now create the rankings and start the mapping
		mdbla.createRankings();
		mdbla.setMap();		
	}
}

/***

	Initialize the map and add the CartoDB layer

***/
mdbla.setMap = function()
{
	// remove layer if it exists
	if(mdbla.cartoSubLayer)
	{
		mdbla.cartoSubLayer.hide()
	}

	$('#display-geography-title').empty();

	mdbla.layerCarto = cartodb.createLayer(mdbla.map, mdbla.cartoLayerMap[mdbla.geography],{legends:false,zIndex:2})
		.addTo(mdbla.map)
		.on('done',function(layer){
	

			// add search box
			// var v = cdb.vis.Overlay.create('search', mdbla.map.viz, {})
   //          v.show();
   //          $('#map').append(v.render().el);
			mdbla.cartoLayers = layer;
			mdbla.cartoSubLayer = layer.getSubLayer(0);

			layer.on('featureClick',function(e, pos, latlng, data){
				// turn off the hovering and add a button to allow it back
				mdbla.allowHover = false;

				// assign map actions
				mdbla.mapAction(data);

				// create bookmark
				mdbla.createBookmark();

				// highlight the polygon
				mdbla.highlightPolygon(data[mdbla.geographyIDColumn[mdbla.geography]],true);

			})
			.on('featureOver', function(e, latlng, pos, data) 
			{
				// let's change the cursor cuz that hand is too vague
				$('#map').css('cursor', 'pointer');

				// only refresh the data if we hover over a new feature
				if(mdbla.highlightedGeographyID != data[mdbla.geographyIDColumn[mdbla.geography]] && mdbla.allowHover)
				{
					// assign map actions
					mdbla.mapAction(data);

					// highlight the polygon
					mdbla.highlightPolygon(data[mdbla.geographyIDColumn[mdbla.geography]],false);
				}
			})
			.on('load',function(){
				console.log('map is loaded')
				// add labels
				// if(mdbla.layerLabel == undefined)
				// {
					// .addTo(mdbla.map);


				// }
			})
		})

};

mdbla.mapAction = function(data)
{

	// let the app know what happened
	mdbla.highlightedData = data;
	mdbla.highlightedGeographyID = data[mdbla.geographyIDColumn[mdbla.geography]];
	mdbla.highlightedGeographyName = data.name;

	var html = '<div><span class="stats-title">'+mdbla.highlightedGeographyName+'</span><br>2010 population: '+mdbla.numberWithCommas(data.pop2010)+'</div>';
	$('#display-geography-title').html(html);

	// process data for active tab only
	switch (mdbla.activeTab)
	{
		case 'prison': mdbla.displayPrisonData(); break;
		case 'charges' : mdbla.displayCharges(); break;
		case 'timeline' : mdbla.displayTimeline(); break;
		case 'daysinjail' : mdbla.displayDaysInJailChart(); break;
		case 'rankings' : mdbla.displayRankings(); break;
	}
}

mdbla.highlightPolygon = function(fips,zoomornot)
{


	mdbla.highlightedPolygonStyle = {
		weight: 3,
		color: 'yellow',
		opacity: 1,
		fillColor: '#FFFFFF',
		fillOpacity: 0,
		onEachFeature: function(feature, layer){
			layer.on({
				click: 0
			})
		}
	};

	function getObjects(obj, key, val) {
		var objects = [];
		for (var i in obj) {
			if (!obj.hasOwnProperty(i)) continue;
			if (typeof obj[i] == 'object') {
				objects = objects.concat(getObjects(obj[i], key, val));
			} else if (i == key && obj[key] == val) {
				objects.push(obj);
			}
		}
		return objects;
	}

	$.each(mdbla.geojson[mdbla.geography],function(i,val){
		if(val.properties.fips == fips)
		{
			thisGeoJSON = val
		}
	})

	if(mdbla.highlightedPolygon) {mdbla.map.removeLayer(mdbla.highlightedPolygon)};
	mdbla.highlightedPolygon = L.geoJson(thisGeoJSON,mdbla.highlightedPolygonStyle).addTo(mdbla.map);

	// zoom to the polygon
	if(zoomornot) mdbla.map.fitBounds(mdbla.highlightedPolygon.getBounds()); 

}

/*
	Depracated waffle function
*/
mdbla.waffle = function(val)
{
	var waffle = '<div class="stats-title">$'+mdbla.numberWithCommas(Math.round(val))+'</div>';

	var cells = Math.ceil(val/10000);
	var cols = Math.ceil(cells/10);
	var remainder = cells%10;

	for (var i = 0; i < 10; i++) 
	{
		waffle += '<div class="waffle-column" style="float:left;">';
		if(i==cols-1){colcells = remainder}else{colcells = 10}
		for (var j = 0; j < 10; j++) {
			if((i>cols-1) || (i==cols-1 && colcells<10 && j >= remainder && remainder != 0))
			{
				waffle += '<div class="waffle-border"><div class="waffle-box-empty"></div></div>';
			}
			else
			{
				waffle += '<div class="waffle-border"><div class="waffle-box"></div></div>';
			}
		}
		waffle+='</div>';
	};

	return waffle;
}

mdbla.numberWithCommas = function(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}