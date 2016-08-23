
mdbla.displayPrisonData = function()
{
	// let's resize the windows
	mdbla.resize();

	var fipsposition = mdbla.fipsarray.indexOf(mdbla.highlightedData.fips);
	var jailranking = mdbla.jailranks[fipsposition];
	var bookingsranking = mdbla.bookingsranks[fipsposition];
	var costranking = mdbla.costranks[fipsposition];

	// Cost of incarceration
	var html = '<div class="col-md-4" style="text-align:center;"><span class="stats-title" style="color:'+mdbla.colorPallete[4]+'">$'+mdbla.numberWithCommas(Math.round(mdbla.highlightedData._cost))+'</span><br>Cost of incarceration</div>';
	
	// Days in Jail
	html += '<div class="col-md-4" style="text-align:center;"><span class="stats-title" style="color:'+mdbla.colorPallete[4]+'">'+mdbla.numberWithCommas(Math.round(mdbla.highlightedData._jaildays))+'</span><br>Days in jail</div>';

	// Number of arrests
	var peopleicon = '<img src="img/icon-man-16.png">';
	var peopleicons = '';
	if(mdbla.geography == 'Neighborhoods')
	{
		var peoplepericon = 100;		
	}
	else
	{
		var peoplepericon = 10;
	}

	for (var i = 0; i < Math.round(mdbla.highlightedData._bookings/peoplepericon); i++) {
		peopleicons += peopleicon;
	}
	// has people icons
	// html += '<div class="col-md-4" style="text-align:center;"><span class="stats-title" style="color:'+mdbla.colorPallete[4]+'">'+mdbla.numberWithCommas(Math.round(mdbla.highlightedData._bookings))+'</span><br>('+peopleicon+' = '+peoplepericon+' arrests)<div style="padding:4px;">'+peopleicons+'</div>Number of arrests ('+bookingsranking+' out of '+mdbla.bookingsranks.length+')</div>';
	// no people icons
	html += '<div class="col-md-4" style="text-align:center;"><span class="stats-title" style="color:'+mdbla.colorPallete[4]+'">'+mdbla.numberWithCommas(Math.round(mdbla.highlightedData._bookings))+'</span><br>Number of arrests</div>';

	// html += '</div>';

	$('#stats-content-prison1').html(html);

	// let's add some waffles
	$('#stats-content-prison2').html('');

	// race waffle
	var wafflevalues = {};
	wafflevalues.title = 'Race';
	wafflevalues.data = [mdbla.highlightedData._race_h,mdbla.highlightedData._race_b,mdbla.highlightedData._race_w,Number(mdbla.highlightedData._race_o2)]
	wafflevalues.labels = ['Hispanic','Black','White','Other']
	$('#stats-content-prison2').append('<div class="col-md-4">'+mdbla.createWaffleChart(wafflevalues)+'</div>');

	// gender waffle
	var wafflevalues = {};
	wafflevalues.title = 'Gender';
	wafflevalues.data = [mdbla.highlightedData._sex_m,mdbla.highlightedData._sex_f]
	wafflevalues.labels = ['Male','Female']
	$('#stats-content-prison2').append('<div class="col-md-4">'+mdbla.createWaffleChart(wafflevalues)+'</div>');

	// charge waffle
	var wafflevalues = {};
	wafflevalues.title = 'Charge';
	wafflevalues.data = [mdbla.highlightedData._charge_m,mdbla.highlightedData._charge_f,mdbla.highlightedData._charge_d,mdbla.highlightedData._charge_o]
	wafflevalues.labels = ['Misdimeaner','Felony','D','O']
	$('#stats-content-prison2').append('<div class="col-md-4">'+mdbla.createWaffleChart(wafflevalues)+'</div>');

}

mdbla.displayCharges = function()
{
	var sql_statement1 = 'SELECT charge_des,count(*) as "count" FROM lasd_2010_2015_bookings2 WHERE '+mdbla.geographyIDColumn[mdbla.geography]+' = \''+ mdbla.highlightedGeographyID +'\' GROUP BY charge_des ORDER BY count DESC';
	var html = '';
	// display charges
	var sql = $.getJSON('https://mdbla.carto.com/api/v2/sql/?q='+sql_statement1+'&api_key='+mdbla.cartoKey, function(data) {

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
		$('#stats-content-charges').html(html);
		
	})


}

mdbla.displayTimeline = function()
{
	// clear container
	$('#stats-content-timeline').empty();

	var sql_statement2 = 'SELECT arrest_date,_race_b,_race_h,_race_w,_sex_m,_sex_f,occupation,_jaildays,charge_des FROM lasd_2010_2015_bookings2 WHERE '+mdbla.geographyIDColumn[mdbla.geography]+' = \''+mdbla.highlightedGeographyID+'\'';

	// display timeline and days in jail chart
	$.getJSON('https://mdbla.carto.com/api/v2/sql/?q='+sql_statement2+'&api_key='+mdbla.cartoKey, function(data) {

		if(data.total_rows > 1000)
		{
			$('#stats-content-timeline').append('There are too many bookings for '+mdbla.highlightedGeographyName+' ('+data.total_rows+') to display on the time chart...')
		}
		else
		{
			// $('#stats-content-timeline').append('Showing '+data.total_rows+' bookings:');
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
			var container = document.getElementById('stats-content-timeline');

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
	$('#stats-content-daysinjail').empty();

	var sql_statement2 = 'SELECT arrest_date,_race_b,_race_h,_race_w,_sex_m,_sex_f,occupation,_jaildays,charge_des FROM lasd_2010_2015_bookings2 WHERE '+mdbla.geographyIDColumn[mdbla.geography]+' = \''+mdbla.highlightedGeographyID+'\'';

	// display timeline and days in jail chart
	$.getJSON('https://mdbla.carto.com/api/v2/sql/?q='+sql_statement2+'&api_key='+mdbla.cartoKey, function(data) {

		var jailtimedata = [];

		data.rows.sort(function(a, b) {
			return parseFloat(b._jaildays) - parseFloat(a._jaildays);
		});

		if(data.total_rows > 100)
		{
			$('#stats-content-daysinjail').append('Showing 100 out of '+data.total_rows+' total records')
		}
		else
		{
			$('#stats-content-daysinjail').append('Showing '+data.total_rows+' total records')
		}

		$('#stats-content-daysinjail').append('<button type="button" class="btn btn-default btn-sm" id="stack-toggle">stack toggle</button>');

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
					$('#stats-content-daysinjail').append('<div class="duration duration-container"><div class="duration-bar" data-toggle="tooltip" data-placement="top" title="'+ race + ' ' + sex + ' ' + val._jaildays+' days in prison for '+val.charge_des+'" style="float:left;width:'+barWidth+'px;background-color:'+className+'"></div><div class="duration-display">'+val._jaildays+'</div></div>')
				}
				$('[data-toggle="tooltip"]').tooltip()
				
				$("#stack-toggle").click(function(){
					$(".duration").toggleClass("duration-container");
				});
			}
		})
	});

}

mdbla.displayRankings = function()
{
	console.log('displaying rankings...')
	// clear container
	$('#stats-content-rankings').empty();

	// create the table headers
	var htmltableheader = '';
	htmltableheader = '<div id="rankings-container"><table class="table table-hover table-condensed"><thead>';
	// rank and name
	htmltableheader += '<th></th><th class="sort" data-sort="name">name</th>';
	// cost
	htmltableheader += '<th class="sort" data-sort="cost">cost</th>';
	// jail days
	htmltableheader += '<th class="sort" data-sort="jaildays">days in jail</th>';
	// arrests
	htmltableheader += '<th class="sort" data-sort="arrests">arrests</th>';
	// pop 2010
	htmltableheader += '<th class="sort" data-sort="pop2010">2010 Population</th>';
	// end table
	htmltableheader += '</thead><tbody id="ranking-list" class="list">';
	// htmltableheader += '</thead><tbody id="ranking-list" class="list"></tbody></table></div>';

	$('#stats-content-rankings').html(htmltableheader);

	// ranking options for list.js
	var options = {
		valueNames: [ 
			'name',
			'costdisplay',
			'jaildaysdisplay',
			'arrestsdisplay',
			'pop2010display',
			{data:['cost']},
			{data:['jaildays']},
			{data:['arrests']},
			{data:['pop2010']},
		]
	};

	// loop through data
	$.each(mdbla.data[mdbla.geography].rows,function(i,val){

		var cost = Math.round(val._cost);
		var arrests = Math.round(val._bookings);
		var jaildays = Math.round(val._jaildays);
		var pop2010 = Math.round(val.pop2010);

		var costdisplay = '$'+mdbla.numberWithCommas(Math.round(val._cost));
		var arrestsdisplay = mdbla.numberWithCommas(Math.round(val._bookings));
		var jaildaysdisplay = mdbla.numberWithCommas(Math.round(val._jaildays));
		var pop2010display = mdbla.numberWithCommas(Math.round(val.pop2010));

		var costwidth = Math.round(cost/mdbla.summary[mdbla.geography]["costmax"]*100);
		var arrestswidth = Math.round(arrests/mdbla.summary[mdbla.geography]["bookingsmax"]*100);
		var jaildayswidth = Math.round(jaildays/mdbla.summary[mdbla.geography]["jailmax"]*100);
		var pop2010width = Math.round(pop2010/mdbla.summary[mdbla.geography]["pop2010max"]*100);

		var thisrowhtml = '';

		// add each data params to the tr
		thisrowhtml += '<tr id="ranking-'+val.fips+'" onmouse data-cost='+cost+' data-arrests='+val._bookings+' data-jaildays='+val._jaildays+' data-pop2010='+val.pop2010+'>';
		// rank and name
		thisrowhtml += '<td>'+(i+1)+'</td><td class="name">'+val.name+'</td>';
		// cost
		thisrowhtml += '<td class="cost"><div style="background-color:skyblue;width:'+costwidth+'%">'+costdisplay+'</div></td>';
		// jail days
		thisrowhtml += '<td class="jaildays"><div style="background-color:skyblue;width:'+jaildayswidth+'%">'+jaildaysdisplay+'</div></td>';
		// arrests
		thisrowhtml += '<td class="arrests"><div style="background-color:skyblue;width:'+arrestswidth+'%">'+arrestsdisplay+'</div></td>';
		// 2010 population
		thisrowhtml += '<td class="pop2010"><div style="background-color:skyblue;width:'+pop2010width+'%">'+pop2010display+'</div></td>';
		// close tr and table
		thisrowhtml += '</tr></tbody></table></div>';
		
		$('#ranking-list').append(thisrowhtml);

		$('#ranking-'+val.fips).mouseover(function(event) {
			// mdbla.highlightPolygon(val.fips);
			// let's change the cursor cuz that hand is too vague

			$('#map').css('cursor', 'pointer');

			// only refresh the data if we hover over a new feature
			if(mdbla.highlightedGeographyID != val.fips && mdbla.allowHover)
			{
				// assign map actions
				// mdbla.mapAction(val);

				// highlight the polygon
				mdbla.highlightPolygon(val.fips,false);
			}
		});
		$('#ranking-'+val.fips).mouseout(function(event) {
			$('#ranking-'+val.fips).css('background-color','white')
		});
		$('#ranking-'+val.fips).click(function(event) {
			// mdbla.highlightPolygon(val.fips,true);
			// turn off the hovering and add a button to allow it back

			mdbla.allowHover = false;

			// assign map actions
			mdbla.mapAction(val);

			// create bookmark
			mdbla.createBookmark();

			// highlight the polygon
			mdbla.highlightPolygon(val.fips,true);

		});
	})

	var userList = new List('rankings-container', options);

}
