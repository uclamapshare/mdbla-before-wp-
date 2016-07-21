/***

	Namespace and defaults

***/
var mdbla = {};

L.mapbox.accessToken = 'pk.eyJ1IjoieW9obWFuIiwiYSI6IkxuRThfNFkifQ.u2xRJMiChx914U7mOZMiZw';
var map = new L.Map('map',{
    center:[34,-118.3], 
    zoom: 12
});	

// let's get started
$( function() 
{
	cartoSQL()
});

// get data from carto first
function cartoSQL(sql)
{
	var sql_statement1 = 'SELECT MAX(_days_in_jail) as jailmax,MIN(_days_in_jail) as jailmin,MAX(_count) as bookingsmax,MIN(_count) as bookingsmin,AVG(_days_in_jail) as "jailavg",AVG(_count) as "bookingsavg",AVG(_cost) as "cost" FROM lasd_2010_2015_by_block_group_v1_1';
	var sql_statement2 = 'SELECT fips,_count as bookings,_days_in_jail as jail FROM lasd_2010_2015_by_block_group_v1_1 ORDER BY jail ';

	var sql1 = $.getJSON('https://mdbla.carto.com/api/v2/sql/?q='+sql_statement1+'&api_key=701af57a932440fbe504882c6ccc8f6b3d83488f', function(data) {
		mdbla.summary = data.rows[0];
	});
	var sql2 = sql1.then(function(){
		$.getJSON('https://mdbla.carto.com/api/v2/sql/?q='+sql_statement2+'&api_key=701af57a932440fbe504882c6ccc8f6b3d83488f', function(data) {
			mdbla.data = data;
			createRankings();
			setMap();
		});
	})
}

	var fipsarray = [];
	var jailarray = [];
	var jailranks;
	var bookingsarray = [];
	var bookingsranks;

function createRankings()
{
	$.each(mdbla.data.rows,function(i,val){
		jailarray.push(val.jail)
		bookingsarray.push(val.bookings)
		fipsarray.push(val.fips)
	})
	var jailsorted = jailarray.slice().sort(function(a,b){return a-b})
	jailranks = jailarray.slice().map(function(v){ return jailsorted.indexOf(v)+1 });
	var bookingssorted = bookingsarray.slice().sort(function(a,b){return a-b})
	bookingsranks = bookingsarray.slice().map(function(v){ return bookingssorted.indexOf(v)+1 });
}

// https://mdbla.carto.com/api/v2/sql/?q=SELECT fips,_count as bookings,_days_in_jail as jail FROM lasd_2010_2015_by_block_group_v1_1 ORDER BY jail &api_key=701af57a932440fbe504882c6ccc8f6b3d83488f
function setMap()
{
	// Use styleLayer to add a Mapbox style created in Mapbox Studio
	// L.mapbox.styleLayer('mapbox://styles/mapbox/dark-v9').addTo(map);
	var lasd_layer = cartodb.createLayer(map, 'https://mdbla.carto.com/api/v2/viz/7c32ed80-4eb6-11e6-a745-0e05a8b3e3d7/viz.json')
		.addTo(map)
		.on('done',function(layer){
			layer.on('featureOver', function(e, latlng, pos, data, subLayerIndex) 
			{

				var fipsposition = fipsarray.indexOf(data.fips);
				var jailranking = jailranks[fipsposition];
				var bookingsranking = bookingsranks[fipsposition];

				// prison data
				var html = '<table class="table table-condensed">';
				html += '<tr><td style="vertical-align:middle"><img src="https://cdn4.iconfinder.com/data/icons/aiga-symbol-signs/441/aiga_cashier-24.png"></td><td style="vertical-align:middle" width="30%">Cost of incarceration</td><td style="vertical-align:middle" colspan=2 class="legend-title">$'+numberWithCommas(Math.round(data._cost))+'</td></tr>';
				html += '<tr><td style="vertical-align:middle"><img src="img/arrests.png"></td><td style="vertical-align:middle" width="30%">Number of arrests</td><td style="vertical-align:middle">'+ numberWithCommas(data._count)+'</td><td style="vertical-align:middle">'+dotOnBar(bookingsranking,fipsarray.length)+'</td></tr>';
				html += '<tr><td style="vertical-align:middle"><img src="https://cdn2.iconfinder.com/data/icons/nasty/60/prison_jail-24.png"></td><td style="vertical-align:middle" width="30%">Days in jail</td><td style="vertical-align:middle">'+ numberWithCommas(data._days_in_jail)+'</td><td>'+dotOnBar(jailranking,fipsarray.length)+'</td></tr>';

				html += '</table>';

				$('#legend-content-1').html(html);
				var wafflevalues = [data._sum__ethni_hispanic,data._sum__eth_b,data._sum__eth_w,Number(data._sum__eth_o2)]
				console.log(data)
				$('#legend-content-3').html(waffle2(wafflevalues));

			})
			.on('load',function(){
				// add labels
				L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
						attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
						subdomains: 'abcd',
						maxZoom: 19
					}).addTo(map);				
			})



		})
};

function barChart(val)
{
	var bar = '<div style="height:10px;width:50px;background:rgba(0,0,0,0.5)"><div style="height:10px;width:'+val/2+'px;background:rgba(255,0,0,1)"></div></div>';
	return bar;
}

function dotOnBar(val,max)
{
	var left = val/max*100;
	var bar = '<div style="height:10px;width:102px;border-left:1px solid silver;border-right:1px solid silver;"><div style="position:relative;top:5px;height:1px;width:100px;background-color:silver;"><div style="position:relative;left:50px;width:1px;height:10px;background-color:gainsboro;top:-5px;"></div><div style="position:relative;left:'+left+'px;width:5px;height:5px;background-color:red;top:-12px;"></div></div></div>'
	return bar;
}

function changeLayer(val)
{
	map.setFilter('mdbla',['>=','_cost',val])
}

function waffle(val)
{
	var waffle = '<div class="legend-title">$'+numberWithCommas(Math.round(val))+'</div>';

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
	// return waffle;
	
}

function waffle2(values)
{
	console.log(values)
	var color = ['red','orange','blue','green'];

	// var values = [40,20,10,5];
	var sum = 0;
	$.each(values,function(i,val){
		sum += val;
	})

	var normalizedValues = [];
	$.each(values,function(i,val){
		normalizedValues.push(Math.round(val/sum*100))
	})

	// waffle table
	var waffle = '';

	// legend and values
	waffle += '<div style="float:left"><table class="table">'
	waffle += '<div style="float:left"><tr><td>Hispanic</td><td>'+values[0]+'</td><td><div class="waffle-border" style="float:left;"><div class="waffle-box-empty" style="background-color:'+color[0]+'"></div></div></td></tr>';
	waffle += '<div style="float:left"><tr><td>Black</td><td>'+values[1]+'</td><td><div class="waffle-border" style="float:left;"><div class="waffle-box-empty" style="background-color:'+color[1]+'"></div></div></td></tr>';
	waffle += '<div style="float:left"><tr><td>White</td><td>'+values[2]+'</td><td><div class="waffle-border" style="float:left;"><div class="waffle-box-empty" style="background-color:'+color[2]+'"></div></div></td></tr>';
	waffle += '<div style="float:left"><tr><td>Other</td><td>'+values[3]+'</td><td><div class="waffle-border" style="float:left;"><div class="waffle-box-empty" style="background-color:'+color[3]+'"></div></div></td></tr>';
	waffle += '</table></div>'

	var count = 0;

	waffle += '<div class="waffle-container" style="float:right">';

	$.each(normalizedValues,function(i,val){
		for (var j = 0; j < val; j++) 
		{
			waffle += '<div class="waffle-border" style="float:left;"><div class="waffle-box-empty" style="background-color:'+color[i]+'"></div></div>';
		}
	})
	waffle += '</div>';
	return waffle;
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}