/***

	Namespace and defaults

***/
	var mdbla = {};
	mdbla.activeTab = 'prison';
	mdbla.highlightedPolygon;
	mdbla.highlightedData;
	mdbla.fipsarray = [];
	mdbla.jailarray = [];
	mdbla.jailranks;
	mdbla.bookingsarray = [];
	mdbla.bookingsranks;
	mdbla.legendWidth = '30%';
	mdbla.allowHover = true;
	// mdbla.geography = 'Block Groups';
	mdbla.highlightedGeographyID;
	mdbla.highlightedGeographyName;
	mdbla.geography = 'Neighborhoods';
	mdbla.geographyIDColumn = {
		'Block Groups' : 'fips_1',
		'Neighborhoods' : 'slug'
	}
	mdbla.cartoLayerTable = {
		'Block Groups' : 'lasd_2010_2015_by_block_group',
		'Neighborhoods' : 'lasd_2010_2015_by_neighborhoods'
	}
	mdbla.cartoLayerMap = {
		'Block Groups' : 'https://mdbla.carto.com/api/v2/viz/7c32ed80-4eb6-11e6-a745-0e05a8b3e3d7/viz.json',
		'Neighborhoods' : 'https://mdbla.carto.com/api/v2/viz/6c2a7b6c-5459-11e6-a6cd-0e233c30368f/viz.json'
	}

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
	mdbla.map;
	mdbla.layerCarto;
	mdbla.cartoSubLayer;

	// mapbox token
	L.mapbox.accessToken = 'pk.eyJ1IjoieW9obWFuIiwiYSI6IkxuRThfNFkifQ.u2xRJMiChx914U7mOZMiZw';

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
	$('.menu-content').css('height',($(window).height()-97)+'px');
}

/***

	Let's get this show on the road

***/
$( function() 
{
	// adjust windows
	mdbla.resize()

	mdbla.map = new L.Map('map');
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
	$('#button-prison').click(function(){ mdbla.activeTab = 'prison'; mdbla.displayPrisonData() })
	$('#button-charges').click(function(){ mdbla.activeTab = 'charges'; mdbla.displayCharges() })
	$('#button-timeline').click(function(){ mdbla.activeTab = 'timeline'; mdbla.displayTimeline() })
	$('#button-daysinjail').click(function(){ mdbla.activeTab = 'daysinjail'; mdbla.displayDaysInJailChart() })
	$('#hover').click(function(){ mdbla.toggleHover() })

}

/***

	User can click on a polygon to "lock" it on 
	the map, which disables the dynamic hover data
	display. This function toggles that functionality.

***/
mdbla.toggleHover = function()
{
	if(mdbla.allowHover)
	{
		mdbla.allowHover = false;
		$('#hover').html('hover off');
	}
	else
	{
		mdbla.allowHover = true;
		$('#hover').html('hover on');
	}
}

/***

	Allow toggling of main geography
	Neighborhoods or Census Block Groups

***/
mdbla.toggleGeography = function()
{
	// reset the map
	// mdbla.map.remove();
	mdbla.cartoSubLayer.hide()
	// mdbla.map = new L.Map('map');
	// mdbla.layerSatellite.addTo(mdbla.map)

	mdbla.allowHover = true;

	// reset the tabs
	$('#legend-content-1').empty();
	$('#legend-content-2').empty();
	$('#legend-content-3').empty();
	$('#legend-content-4').empty();
	$('#legend-content-5').empty();
	$('#legend-content-6').empty();

	if(mdbla.geography == 'Neighborhoods')
	{
		mdbla.geography = 'Block Groups';
		$('#button-neighborhoods').toggleClass('active');
		$('#button-blockgroups').toggleClass('active');
	}
	else
	{
		mdbla.geography = 'Neighborhoods';
		$('#button-blockgroups').toggleClass('active');
		$('#button-neighborhoods').toggleClass('active');
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
	var sql_statement1 = 'SELECT MAX(_jaildays) as jailmax,MIN(_jaildays) as jailmin,MAX(_bookings) as bookingsmax,MIN(_bookings) as bookingsmin,AVG(_jaildays) as "jailavg",AVG(_bookings) as "bookingsavg",AVG(_cost) as "cost" FROM '+mdbla.cartoLayerTable[mdbla.geography]+'';

	// main data sql
	var sql_statement2 = 'SELECT name,fips,_bookings,_jaildays FROM '+mdbla.cartoLayerTable[mdbla.geography]+' ORDER BY _jaildays ';

	// get geojson for each polygon
	// WARNING: may take time
	var sql_statement3 = 'SELECT * FROM '+mdbla.cartoLayerTable[mdbla.geography];
	

	// go fetch 'em
	var sql1 = $.getJSON('https://mdbla.carto.com/api/v2/sql/?q='+sql_statement1+'&api_key=701af57a932440fbe504882c6ccc8f6b3d83488f', function(data) {
		mdbla.summary = data.rows[0];
	});

	// chain them so that ajax doesn't screw us
	var sql2 = sql1.then(function(){
		$.getJSON('https://mdbla.carto.com/api/v2/sql/?q='+sql_statement2+'&api_key=701af57a932440fbe504882c6ccc8f6b3d83488f', function(data) {
			mdbla.data = data;
			// we got the data, let's populate the dropdown-neighborhood
			mdbla.createNeighborhoodDropdown();
		});
	})
	.then(function(){
		$.getJSON('https://mdbla.carto.com/api/v2/sql/?format=GeoJSON&q='+sql_statement3+'&api_key=701af57a932440fbe504882c6ccc8f6b3d83488f', function(data) {
		mdbla.geojson = data.features;
	}).then(function(){
			// data is got. now create the rankings and start the mapping
			mdbla.createRankings();
			mdbla.setMap();
		})
	})
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

	// fit the map to LA County
	mdbla.map.fitBounds([
		[34.7, -118.85],
		[33.8, -117.75]
	]);

	// Use styleLayer to add a Mapbox style created in Mapbox Studio
	
	// .addTo(mdbla.map);

	mdbla.layerCarto = cartodb.createLayer(mdbla.map, mdbla.cartoLayerMap[mdbla.geography],{legends:false,zIndex:2})
		.addTo(mdbla.map)
		.on('done',function(layer){
	

			// // add search box
			// var v = cdb.vis.Overlay.create('search', mdbla.map.viz, {})
   //          v.show();
   //          $('#map').append(v.render().el);
   			mdbla.cartoLayers = layer;
			mdbla.cartoSubLayer = layer.getSubLayer(0);

			layer.on('featureClick',function(e, pos, latlng, data){

				// turn off the hovering and add a button to allow it back
				mdbla.allowHover = false;
				$('#button-hover').show();
				$('#button-hover').html('Release '+data.name).click(function(){mdbla.allowHover = true; $('#button-hover').hide()})

				// highlight the polygon
				mdbla.highlightPolygon(data.fips,true);

				// let the app know what happened
				mdbla.highlightedData = data;
				mdbla.highlightedGeographyID = data.fips;
				mdbla.highlightedGeographyName = data.name;

				var html = '<div class="legend-title">'+mdbla.highlightedGeographyName+'</div>';
				$('#display-geography').html(html);

				// process data for active tab only
				switch (mdbla.activeTab)
				{
					case 'prison': mdbla.displayPrisonData(); break;
					case 'charges' : mdbla.displayCharges(); break;
					case 'timeline' : mdbla.displayTimeline(); break;
					case 'daysinjail' : mdbla.displayDaysInJailChart(); break;
				}

			})
			.on('featureOver', function(e, latlng, pos, data) 
			{
				// let's change the cursor cuz that hand is too vague
				$('#map').css('cursor', 'pointer');

				// only refresh the data if we hover over a new feature
				if(mdbla.highlightedGeographyID != data.fips && mdbla.allowHover)
				{
					mdbla.highlightedData = data;
					mdbla.highlightedGeographyID = data.fips;
					mdbla.highlightedGeographyName = data.name;
					mdbla.highlightPolygon(data.fips,false);

					var html = '<div class="legend-title">'+mdbla.highlightedGeographyName+'</div>';
					$('#display-geography').html(html);

					// process data for active tab only
					switch (mdbla.activeTab)
					{
						case 'prison': mdbla.displayPrisonData(); break;
						case 'charges' : mdbla.displayCharges(); break;
						case 'timeline' : mdbla.displayTimeline(); break;
						case 'daysinjail' : mdbla.displayDaysInJailChart(); break;
					}

				}

				// only highlight the polygon if it is newly hovered upon
				// if(mdbla.highlightedGeographyID != data.fips && mdbla.allowHover)
				// {
				// 	mdbla.highlightPolygon(data.fips);
				// 	// mdbla.displayPrisonData(data);
				// }
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

mdbla.displayPrisonData = function()
{
	var fipsposition = mdbla.fipsarray.indexOf(mdbla.highlightedData.fips);
	var jailranking = mdbla.jailranks[fipsposition];
	var bookingsranking = mdbla.bookingsranks[fipsposition];
	// var name = data.name;

	// prison data
	var html = '<table border=0 class="table table-condensed" width="100%">';
	// cost
	html += '<tr><td style="vertical-align:middle"><img src="https://cdn4.iconfinder.com/data/icons/aiga-symbol-signs/441/aiga_cashier-24.png"></td><td style="vertical-align:middle" width="30%">Cost of incarceration</td><td style="vertical-align:middle;color:#E31A1C;" colspan=2 class="legend-title">$'+mdbla.numberWithCommas(Math.round(mdbla.highlightedData._cost))+'</td></tr>';
	// total bookings
	html += '<tr><td style="vertical-align:middle"><img src="img/arrests.png"></td><td style="vertical-align:middle" width="30%">Number of arrests</td><td align="right" width="50px" style="vertical-align:middle">'+ mdbla.numberWithCommas(mdbla.highlightedData._bookings)+'</td><td style="vertical-align:middle">'+mdbla.createDotOnBar(bookingsranking,mdbla.fipsarray.length)+'</td></tr>';
	// days in jail
	html += '<tr><td style="vertical-align:middle"><img src="https://cdn2.iconfinder.com/data/icons/nasty/60/prison_jail-24.png"></td><td style="vertical-align:middle" width="30%">Days in jail</td><td  align="right" style="vertical-align:middle">'+ mdbla.numberWithCommas(mdbla.highlightedData._jaildays)+'</td><td style="vertical-align:middle">'+mdbla.createDotOnBar(jailranking,mdbla.fipsarray.length)+'</td></tr>';

	html += '</table>';

	$('#legend-content-1').html(html);

	// let's add some waffles
	$('#legend-content-2').html('<div class="container"><div class="row">');

	// race waffle
	var wafflevalues = {};
	wafflevalues.title = 'Race';
	wafflevalues.data = [mdbla.highlightedData._race_h,mdbla.highlightedData._race_b,mdbla.highlightedData._race_w,Number(mdbla.highlightedData._race_o2)]
	wafflevalues.labels = ['Hispanic','Black','White','Other']
	$('#legend-content-2').append('<div class="col-md-4">'+mdbla.createWaffleChart(wafflevalues)+'</div>');

	// gender waffle
	var wafflevalues = {};
	wafflevalues.title = 'Sex';
	wafflevalues.data = [mdbla.highlightedData._sex_m,mdbla.highlightedData._sex_f]
	wafflevalues.labels = ['Male','Female']
	$('#legend-content-2').append('<div class="col-md-4">'+mdbla.createWaffleChart(wafflevalues)+'</div>');

	// charge waffle
	var wafflevalues = {};
	wafflevalues.title = 'Charge';
	wafflevalues.data = [mdbla.highlightedData._charge_m,mdbla.highlightedData._charge_f,mdbla.highlightedData._charge_d,mdbla.highlightedData._charge_o]
	wafflevalues.labels = ['Misdimeaner','Felony','D','O']
	$('#legend-content-2').append('<div class="col-md-4">'+mdbla.createWaffleChart(wafflevalues)+'</div>');

	$('#legend-content-2').append('</div>');

	// let's get more data from bookings table
	// WARNING: Could be too big to handle...
	// var sql_statement1 = 'SELECT charge_des,count(*) as "count" FROM lasd_2010_2015_bookings WHERE '+mdbla.geographyIDColumn[mdbla.geography]+' = \''+data.fips+'\' GROUP BY charge_des ORDER BY count DESC';
	// var sql_statement2 = 'SELECT arrest_date,_race_b,_race_h,_race_w,_sex_m,_sex_f,occupation,_jaildays,charge_des FROM lasd_2010_2015_bookings WHERE '+mdbla.geographyIDColumn[mdbla.geography]+' = \''+data.fips+'\'';

	// // display charges
	// var sql = $.getJSON('https://mdbla.carto.com/api/v2/sql/?q='+sql_statement1+'&api_key=701af57a932440fbe504882c6ccc8f6b3d83488f', function(data) {
	// 	mdbla.displayCharges(data,name);
	// })

	// // display timeline and days in jail chart
	// .then(function(){
	// 	$.getJSON('https://mdbla.carto.com/api/v2/sql/?q='+sql_statement2+'&api_key=701af57a932440fbe504882c6ccc8f6b3d83488f', function(data) {
	// 		mdbla.displayTimeline(data.rows);
	// 		mdbla.displayDaysInJailChart(data.rows);
	// 	});
	// });
}

mdbla.displayCharges = function()
{
	var sql_statement1 = 'SELECT charge_des,count(*) as "count" FROM lasd_2010_2015_bookings WHERE '+mdbla.geographyIDColumn[mdbla.geography]+' = \''+ mdbla.highlightedGeographyID +'\' GROUP BY charge_des ORDER BY count DESC';
	var html = '';
	// display charges
	var sql = $.getJSON('https://mdbla.carto.com/api/v2/sql/?q='+sql_statement1+'&api_key=701af57a932440fbe504882c6ccc8f6b3d83488f', function(data) {

		// display the geography being charted
		// show charge data in table
		html += '<table class="table table-condensed table-striped">';
		$.each(data.rows,function(i,val){
			if(i<100)
			{
				html += '<tr><td style="vertical-align:middle">'+val.charge_des;		
				html += '</td><td style="vertical-align:middle" colspan=2>'+val.count+'</td></tr>';
			}
		})
		html += '</table>';
		$('#legend-content-4').html(html);
		
	})


}

mdbla.displayTimeline = function()
{
	// clear container
	$('#legend-content-5').empty();

	var sql_statement2 = 'SELECT arrest_date,_race_b,_race_h,_race_w,_sex_m,_sex_f,occupation,_jaildays,charge_des FROM lasd_2010_2015_bookings WHERE '+mdbla.geographyIDColumn[mdbla.geography]+' = \''+mdbla.highlightedGeographyID+'\'';

	// display timeline and days in jail chart
	$.getJSON('https://mdbla.carto.com/api/v2/sql/?q='+sql_statement2+'&api_key=701af57a932440fbe504882c6ccc8f6b3d83488f', function(data) {

		if(data.total_rows > 1000)
		{
			$('#legend-content-5').append('There are too many bookings for '+mdbla.highlightedGeographyName+' ('+data.total_rows+') to display on the time chart...')
		}
		else
		{
			$('#legend-content-5').append('Showing '+data.total_rows+' bookings:');
			var timedata = [];
			$.each(data.rows,function(i,val){
				if(val._race_h == 1)
				{
					className = 'color1'
				}
				else if(val._race_b == 1)
				{
					className = 'color2'
				}
				else if(val._race_w == 1)
				{
					className = 'color3'
				}
				else
				{
					className = 'color4'
				}
				var thisItem = {
					id: i,
					start: val.arrest_date,
					type: 'point',
					className: className
				}
				timedata.push(thisItem)
			})
			var container = document.getElementById('legend-content-5');

			// Create a DataSet (allows two way data-binding)
			var items = new vis.DataSet(timedata);

			// Configuration for the Timeline
			var options = {
				maxHeight:'350px',
				minHeight:'250px',
				margin: {
					item: 0
				},
				orientation: {
					axis: 'top',
					item: 'top'
				}
			};

			// Create a Timeline
			var timeline = new vis.Timeline(container, items, options);

		}
	

	});

}

mdbla.displayDaysInJailChart = function()
{
	// clear container
	$('#legend-content-6').empty();

	var sql_statement2 = 'SELECT arrest_date,_race_b,_race_h,_race_w,_sex_m,_sex_f,occupation,_jaildays,charge_des FROM lasd_2010_2015_bookings WHERE '+mdbla.geographyIDColumn[mdbla.geography]+' = \''+mdbla.highlightedGeographyID+'\'';

	// display timeline and days in jail chart
	$.getJSON('https://mdbla.carto.com/api/v2/sql/?q='+sql_statement2+'&api_key=701af57a932440fbe504882c6ccc8f6b3d83488f', function(data) {

		var jailtimedata = [];

		data.rows.sort(function(a, b) {
			return parseFloat(b._jaildays) - parseFloat(a._jaildays);
		});

		if(data.total_rows > 100)
		{
			$('#legend-content-6').append('Showing 100 out of '+data.total_rows+' total records')
		}
		else
		{
			$('#legend-content-6').append('Showing '+data.total_rows+' total records')
		}

		$('#legend-content-6').append('<button type="button" class="btn btn-default btn-sm" id="stack-toggle">stack toggle</button>');

		$.each(data.rows,function(i,val){
			if(i < 100)
			{
				if(val._race_h == 1)
				{
					className = mdbla.colorPallete[0]
					race = 'HISPANIC'
				}
				else if(val._race_b == 1)
				{
					className = mdbla.colorPallete[1]
					race = 'BLACK'
				}
				else if(val._race_w == 1)
				{
					className = mdbla.colorPallete[2]
					race = 'WHITE'
				}
				else
				{
					className = mdbla.colorPallete[3]
					race = 'OTHER'
				}

				if(val._sex_m == 1)
				{
					sex = 'MALE';
				}
				else
				{
					sex = 'FEMALE';
				}
				var thisItem = {
					id: i,
					start: val.arrest_date,
					type: 'point',
					className: className
				}
				jailtimedata.push(thisItem)

				// is data too big?
				var dataWindowWidth = $(window).width()/2-100;
				if (val._jaildays > dataWindowWidth)
				{
					var barWidth = dataWindowWidth;
				}
				else
				{
					var barWidth = val._jaildays;
				}

				// add data to chart
				if(val._jaildays > 0)
				{
					$('#legend-content-6').append('<div class="duration duration-container"><div class="duration-bar" data-toggle="tooltip" data-placement="left" title="'+ race + ' ' + sex + ' ' + val._jaildays+' days in prison for '+val.charge_des+'" style="float:left;width:'+barWidth+'px;background-color:'+className+'"></div><div class="duration-display">'+val._jaildays+'</div></div>')
				}
				$('[data-toggle="tooltip"]').tooltip()
				
				$("#stack-toggle").click(function(){
					$(".duration").toggleClass("duration-container");
				});
			}
		})
	});

}

/***

	Ranking the data allows us to see how each
	selected geography compares with the rest 
	of the data

***/
mdbla.createRankings = function()
{
	$.each(mdbla.data.rows,function(i,val){
		mdbla.jailarray.push(val._jaildays)
		mdbla.bookingsarray.push(val._bookings)
		mdbla.fipsarray.push(val.fips)
	})
	var jailsorted = mdbla.jailarray.slice().sort(function(a,b){return a-b})
	mdbla.jailranks = mdbla.jailarray.slice().map(function(v){ return jailsorted.indexOf(v)+1 });
	var bookingssorted = mdbla.bookingsarray.slice().sort(function(a,b){return a-b})
	mdbla.bookingsranks = mdbla.bookingsarray.slice().map(function(v){ return bookingssorted.indexOf(v)+1 });
}

mdbla.createBarChart = function(val)
{
	var bar = '<div style="height:10px;width:50px;background:rgba(0,0,0,0.5)"><div style="height:10px;width:'+val/2+'px;background:rgba(255,0,0,1)"></div></div>';
	return bar;
}

mdbla.createDotOnBar = function(val,max)
{
	var left = val/max*100;
	var bar = '<div style="height:10px;width:100%;border-left:1px solid silver;border-right:1px solid silver;"><div style="position:relative;top:5px;height:1px;width:100%;background-color:silver;"><div style="position:relative;left:50%;width:1px;height:10px;background-color:gainsboro;top:-5px;"></div><div style="position:relative;left:'+left+'%;width:5px;height:5px;background-color:red;top:-12px;"></div></div></div>'
	return bar;
}


mdbla.createWaffleChart = function(values)
{
	var color = ['red','orange','blue','green'];

	// var values = [40,20,10,5];
	var sum = 0;
	$.each(values.data,function(i,val){
		sum += val;
	})

	var normalizedValues = [];
	$.each(values.data,function(i,val){
		normalizedValues.push(Math.round(val/sum*100))
	})
	var count = 0;

	// waffle table
	var waffle = '<div style="float:left;">';

	// title
	waffle += '<h2>'+values.title+'</h2>';


	// waffle it
	waffle += '<div class="waffle-container" style="float:left;">';

	$.each(normalizedValues,function(i,val){
		for (var j = 0; j < val; j++) 
		{
			waffle += '<div class="waffle-border" style="float:left;"><div class="waffle-box-empty" style="background-color:'+mdbla.colorPallete[i]+'"></div></div>';
		}
	})
	waffle += '</div>';

	// legend and values
	waffle += '<table class="table table-condensed smallfont">';

	for (var i = 0; i < values.data.length; i++) {
		waffle += '<tr><td width="75%">'+values.labels[i]+'</td><td width="25%" align="right">'+values.data[i]+'</td><td><div class="waffle-border" style="float:left;"><div class="waffle-box-empty" style="background-color:'+mdbla.colorPallete[i]+'"></div></div></td></tr>';
	}

	waffle += '</table></div>'

	return waffle;
}

mdbla.createNeighborhoodDropdown = function()
{

	mdbla.data.rows.sort(function(a, b) {
		return parseFloat(b.name) - parseFloat(a.name);
	});

	$.each(mdbla.data.rows,function(i,val){
		$('#dropdown-neighborhood').append('<li><a href="#" onclick="mdbla.highlightPolygon(\''+val.fips+'\')">'+val.name+'</a></li>')
	})
}

mdbla.highlightPolygon = function(fips,zoomornot)
{


	mdbla.highlightedPolygonStyle = {
		weight: 3,
		color: '#1F78B4',
		opacity: 1,
		fillColor: '#FFFFFF',
		fillOpacity: 0,
		onEachFeature: function(feature, layer){
			layer.on({
				click: 0// console.log('highlighted polygon clicked')
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

	$.each(mdbla.geojson,function(i,val){
		if(val.properties.fips == fips)
		{
			thisGeoJSON = val
		}
	})

		if(mdbla.highlightedPolygon) {mdbla.map.removeLayer(mdbla.highlightedPolygon)};
		mdbla.highlightedPolygon = L.geoJson(thisGeoJSON,mdbla.highlightedPolygonStyle).addTo(mdbla.map);

		// zoom to the polygon
		if(zoomornot) mdbla.map.fitBounds(mdbla.highlightedPolygon.getBounds()); 


	// var sql_statement1 = 'SELECT * FROM '+mdbla.cartoLayerTable[mdbla.geography]+' WHERE fips = \''+fips+'\'';
	// var sql = $.getJSON('https://mdbla.carto.com/api/v2/sql/?format=GeoJSON&q='+sql_statement1+'&api_key=701af57a932440fbe504882c6ccc8f6b3d83488f', function(data) {
	// 	if(mdbla.highlightedPolygon) {mdbla.map.removeLayer(mdbla.highlightedPolygon)};
	// 	mdbla.highlightedPolygon = L.geoJson(data,mdbla.highlightedPolygonStyle).addTo(map);

	// 	// zoom to the polygon
	// 	mdbla.map.fitBounds(mdbla.highlightedPolygon.getBounds()); 
	// });	
}

/*
	Depracated waffle function
*/
mdbla.waffle = function(val)
{
	var waffle = '<div class="legend-title">$'+mdbla.numberWithCommas(Math.round(val))+'</div>';

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