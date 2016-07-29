/***

	Namespace and defaults

***/
var mdbla = {};
mdbla.highlightedPolygon;
mdbla.highlightedFips;
mdbla.fipsarray = [];
mdbla.jailarray = [];
mdbla.jailranks;
mdbla.bookingsarray = [];
mdbla.bookingsranks;
mdbla.legendWidth = '30%';
mdbla.allowHover = true;
// mdbla.geography = 'Block Groups';
mdbla.geography = 'Neighborhoods';
mdbla.cartoLayerTable = {
	'Block Groups' : 'lasd_2010_2015_by_block_group',
	'Neighborhoods' : 'lasd_2010_2015_by_neighborhoods'
}
mdbla.cartoLayerMap = {
	'Block Groups' : 'https://mdbla.carto.com/api/v2/viz/7c32ed80-4eb6-11e6-a745-0e05a8b3e3d7/viz.json',
	'Neighborhoods' : 'https://mdbla.carto.com/api/v2/viz/6c2a7b6c-5459-11e6-a6cd-0e233c30368f/viz.json'
}
// mapbox token
L.mapbox.accessToken = 'pk.eyJ1IjoieW9obWFuIiwiYSI6IkxuRThfNFkifQ.u2xRJMiChx914U7mOZMiZw';
var map;

/***

	Resize adjustments

***/
$( window ).resize(function() {
	mdbla.resize();
});

mdbla.resize = function()
{
	$('#map').css('height',$(window).height()+'px');
	$('.menu-content').css('height',($(window).height()-45)+'px');
}

/***

	Let's get this show on the road

***/
$( function() 
{
	// activate tooltips
	$('[data-toggle="tooltip"]').tooltip()

	mdbla.cartoSQL();
	
	$('#expand').click(function(){ expandLegend() })
	$('#hover').click(function(){ toggleHover() })
});

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

	Booking data is stored in CartoDB. 
	These SQL calls pulls the data into
	the application

***/
mdbla.cartoSQL = function(sql)
{
	// some summary stuff sql
	var sql_statement1 = 'SELECT MAX(_jaildays) as jailmax,MIN(_jaildays) as jailmin,MAX(_bookings) as bookingsmax,MIN(_bookings) as bookingsmin,AVG(_jaildays) as "jailavg",AVG(_bookings) as "bookingsavg",AVG(_cost) as "cost" FROM '+mdbla.cartoLayerTable[mdbla.geography]+'';

	// main data sql
	var sql_statement2 = 'SELECT fips,_bookings,_jaildays FROM '+mdbla.cartoLayerTable[mdbla.geography]+' ORDER BY _jaildays ';

	// go fetch 'em
	var sql1 = $.getJSON('https://mdbla.carto.com/api/v2/sql/?q='+sql_statement1+'&api_key=701af57a932440fbe504882c6ccc8f6b3d83488f', function(data) {
		mdbla.summary = data.rows[0];
	});

	// chain them so that ajax doesn't screw us
	var sql2 = sql1.then(function(){
		$.getJSON('https://mdbla.carto.com/api/v2/sql/?q='+sql_statement2+'&api_key=701af57a932440fbe504882c6ccc8f6b3d83488f', function(data) {
			mdbla.data = data;
			// data is got. now create the rankings and start the mapping
			mdbla.createRankings();
			mdbla.setMap();
		});
	})
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

/***

	Initialize the map and add the CartoDB layer

***/
mdbla.setMap = function()
{
	// initialize map
	map = new L.Map('map',{
		center:[34,-118.3], 
		zoom: 10
	});	

	// Use styleLayer to add a Mapbox style created in Mapbox Studio
	// L.mapbox.styleLayer('mapbox://styles/mapbox/dark-v9').addTo(map);
	var lasd_layer = cartodb.createLayer(map, mdbla.cartoLayerMap[mdbla.geography],{legends:false})
		.addTo(map)
		.on('done',function(layer){
			layer.on('featureClick',function(e, pos, latlng, data){
				mdbla.allowHover = false;
				mdbla.highlightPolygon(data.fips);
				mdbla.showPrisonData(data);
			})
			.on('featureOver', function(e, latlng, pos, data) 
			{
				$('#map').css('cursor', 'pointer');
				// only highlight the polygon if it is newly hovered upon
				if(mdbla.highlightedFips != data.fips && mdbla.allowHover)
				{
					// mdbla.highlightPolygon(data.fips);
					mdbla.showPrisonData(data);
					mdbla.highlightedFips = data.fips;
				}
			})
			.on('load',function(){
				// add labels
				// L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
				// 		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
				// 		subdomains: 'abcd',
				// 		maxZoom: 19
				// 	}).addTo(map);				
			})
		})

};

mdbla.showPrisonData = function(data)
{
	var fipsposition = mdbla.fipsarray.indexOf(data.fips);
	var jailranking = mdbla.jailranks[fipsposition];
	var bookingsranking = mdbla.bookingsranks[fipsposition];

	// prison data
	var html = '<table border=0 class="table table-condensed" width="100%">';
	// geography
	html += '<tr><td style="vertical-align:middle" width="10%"><img src="https://cdn3.iconfinder.com/data/icons/black-white-social-media/32/logo_social_media_location-24.png"></td><td width="30%" style="vertical-align:middle">Location</td><td style="vertical-align:middle" colspan=2>'+data.fips+'</td></tr>';
	// cost
	html += '<tr><td style="vertical-align:middle"><img src="https://cdn4.iconfinder.com/data/icons/aiga-symbol-signs/441/aiga_cashier-24.png"></td><td style="vertical-align:middle" width="30%">Cost of incarceration</td><td style="vertical-align:middle" colspan=2 class="legend-title">$'+mdbla.numberWithCommas(Math.round(data._cost))+'</td></tr>';
	// total bookings
	html += '<tr><td style="vertical-align:middle"><img src="img/arrests.png"></td><td style="vertical-align:middle" width="30%">Number of arrests</td><td align="right" width="50px" style="vertical-align:middle">'+ mdbla.numberWithCommas(data._bookings)+'</td><td style="vertical-align:middle">'+mdbla.dotOnBar(bookingsranking,mdbla.fipsarray.length)+'</td></tr>';
	// days in jail
	html += '<tr><td style="vertical-align:middle"><img src="https://cdn2.iconfinder.com/data/icons/nasty/60/prison_jail-24.png"></td><td style="vertical-align:middle" width="30%">Days in jail</td><td  align="right" style="vertical-align:middle">'+ mdbla.numberWithCommas(data._jaildays)+'</td><td style="vertical-align:middle">'+mdbla.dotOnBar(jailranking,mdbla.fipsarray.length)+'</td></tr>';

	html += '</table>';

	$('#legend-content-1').html(html);

	// let's add some waffles
	$('#legend-content-2').html('<div class="container"><div class="row">');

	// race waffle
	var wafflevalues = {};
	wafflevalues.title = 'Race';
	wafflevalues.data = [data._race_h,data._race_b,data._race_w,Number(data._race_o2)]
	wafflevalues.labels = ['Hispanic','Black','White','Other']
	$('#legend-content-2').append('<div class="col-md-4">'+mdbla.waffle2(wafflevalues)+'</div>');

	// gender waffle
	var wafflevalues = {};
	wafflevalues.title = 'Sex';
	wafflevalues.data = [data._sex_m,data._sex_f]
	wafflevalues.labels = ['Male','Female']
	$('#legend-content-2').append('<div class="col-md-4">'+mdbla.waffle2(wafflevalues)+'</div>');

	// charge waffle
	var wafflevalues = {};
	wafflevalues.title = 'Charge';
	wafflevalues.data = [data._charge_m,data._charge_f,data._charge_d,data._charge_o]
	wafflevalues.labels = ['Misdimeaner','Felony','D','O']
	$('#legend-content-2').append('<div class="col-md-4">'+mdbla.waffle2(wafflevalues)+'</div>');

	$('#legend-content-2').append('</div>');

	// let's get more data
	var fips = data.fips;
	var sql_statement1 = 'SELECT charge_des,count(*) as "count" FROM lasd_2010_2015_bookings WHERE fips_1 = \''+data.fips+'\' GROUP BY charge_des ORDER BY count DESC';
	var sql_statement2 = 'SELECT arrest_date,_race_b,_race_h,_race_w,_sex_m,_sex_f,occupation,_jaildays,charge_des FROM lasd_2010_2015_bookings WHERE fips_1 = \''+data.fips+'\'';

	// display charges
	var sql = $.getJSON('https://mdbla.carto.com/api/v2/sql/?q='+sql_statement1+'&api_key=701af57a932440fbe504882c6ccc8f6b3d83488f', function(data) {
		mdbla.displayCharges(data,fips);
	})

	// display timeline and days in jail chart
	.then(function(){
		$.getJSON('https://mdbla.carto.com/api/v2/sql/?q='+sql_statement2+'&api_key=701af57a932440fbe504882c6ccc8f6b3d83488f', function(data) {
			mdbla.displayTimeline(data.rows);
			mdbla.displayDaysInJailChart(data.rows);
		});
	});
}

mdbla.displayCharges = function(data,fips)
{
	var html = '<table class="table table-condensed">';
	html += '<tr><td style="vertical-align:middle"><img src="https://cdn3.iconfinder.com/data/icons/black-white-social-media/32/logo_social_media_location-24.png"></td><td style="vertical-align:middle" width="30%">Location</td><td style="vertical-align:middle" colspan=2>'+fips+'</td></tr></table>';
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
}

mdbla.highlightPolygon = function(fips)
{
	var HIGHLIGHT_STYLE = {
		weight: 5,
		color: '#FF0000',
		opacity: 1,
		fillColor: '#FFFFFF',
		fillOpacity: 0
	};

	var sql_statement1 = 'SELECT * FROM '+mdbla.cartoLayerTable[mdbla.geography]+' WHERE fips = \''+fips+'\'';
	var sql = $.getJSON('https://mdbla.carto.com/api/v2/sql/?format=GeoJSON&q='+sql_statement1+'&api_key=701af57a932440fbe504882c6ccc8f6b3d83488f', function(data) {
		if(mdbla.highlightedPolygon) {map.removeLayer(mdbla.highlightedPolygon)};
		mdbla.highlightedPolygon = L.geoJson(data,HIGHLIGHT_STYLE).addTo(map);

		// zoom to the polygon
		map.fitBounds(mdbla.highlightedPolygon.getBounds())	
		 
	});	
}

mdbla.barChart = function(val)
{
	var bar = '<div style="height:10px;width:50px;background:rgba(0,0,0,0.5)"><div style="height:10px;width:'+val/2+'px;background:rgba(255,0,0,1)"></div></div>';
	return bar;
}

mdbla.dotOnBar = function(val,max)
{
	var left = val/max*100;
	var bar = '<div style="height:10px;width:100%;border-left:1px solid silver;border-right:1px solid silver;"><div style="position:relative;top:5px;height:1px;width:100%;background-color:silver;"><div style="position:relative;left:50%;width:1px;height:10px;background-color:gainsboro;top:-5px;"></div><div style="position:relative;left:'+left+'%;width:5px;height:5px;background-color:red;top:-12px;"></div></div></div>'
	return bar;
}

mdbla.changeLayer = function(val)
{
	map.setFilter('mdbla',['>=','_cost',val])
}

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

mdbla.waffle2 = function(values)
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
			waffle += '<div class="waffle-border" style="float:left;"><div class="waffle-box-empty" style="background-color:'+color[i]+'"></div></div>';
		}
	})
	waffle += '</div>';

	// legend and values
	waffle += '<table class="table table-condensed smallfont">';

	for (var i = 0; i < values.data.length; i++) {
		waffle += '<tr><td width="75%">'+values.labels[i]+'</td><td width="25%" align="right">'+values.data[i]+'</td><td><div class="waffle-border" style="float:left;"><div class="waffle-box-empty" style="background-color:'+color[i]+'"></div></div></td></tr>';
	}

	waffle += '</table></div>'

	return waffle;
}

mdbla.displayTimeline = function(data)
{
	// clear container
	$('#legend-content-5').empty();

	var timedata = [];
	$.each(data,function(i,val){
		if(val._race_h == 1)
		{
			className = 'red'
		}
		else if(val._race_b == 1)
		{
			className = 'orange'
		}
		else if(val._race_w == 1)
		{
			className = 'blue'
		}
		else
		{
			className = 'green'
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

mdbla.displayDaysInJailChart = function(data)
{
	// clear container
	$('#legend-content-6').empty();

	var jailtimedata = [];

	data.sort(function(a, b) {
		return parseFloat(b._jaildays) - parseFloat(a._jaildays);
	});
	$('#legend-content-6').append('<button type="button" class="btn btn-secondary-outline btn-sm" id="stack-toggle">stack toggle</button>');

	$.each(data,function(i,val){
		if(val._race_h == 1)
		{
			className = 'red'
			race = 'HISPANIC'
		}
		else if(val._race_b == 1)
		{
			className = 'orange'
			race = 'BLACK'
		}
		else if(val._race_w == 1)
		{
			className = 'blue'
			race = 'WHITE'
		}
		else
		{
			className = 'green'
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

		// add data to chart
		if(val._jaildays > 0)
		{
			$('#legend-content-6').append('<div class="duration duration-container"><div class="duration-bar" data-toggle="tooltip" data-placement="left" title="'+ race + ' ' + sex + ' ' + val._jaildays+' days in prison for '+val.charge_des+'" style="float:left;width:'+val._jaildays+'px;background-color:'+className+'"></div><div class="duration-display">'+val._jaildays+'</div></div>')
		}
	})

	$("#stack-toggle").click(function(){
        $(".duration").toggleClass("duration-container");
    });
	$('[data-toggle="tooltip"]').tooltip()


}

mdbla.numberWithCommas = function(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}