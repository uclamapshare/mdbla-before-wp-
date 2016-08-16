/***

	Create bookmarks

***/
mdbla.createBookmark = function()
{

	// create default params
	var thisID = mdbla.highlightedGeographyID;
	var thisData = mdbla.highlightedData;

	// if this is the first bookmark, get rid of the help text
	if(mdbla.bookmarks.length == 0)
	{
		$('#display-bookmarks').empty();
	}

	// add the bookmark to the array if it is not already in there
	if(mdbla.bookmarks.indexOf(thisID)==-1)
	{
		mdbla.bookmarks.push(thisID);

		// add it to the bookmark bar
		$('#display-bookmarks').append('<button id="bookmark-'+thisID+'" type="button" class="btn btn-default btn-sm">'+mdbla.highlightedGeographyName+' <span id="close-'+thisID+'" class="glyphicon glyphicon-remove-sign" aria-hidden="true"></span></button>');

		// make it clickable
		$('#bookmark-'+thisID).click(function(){
			mdbla.highlightPolygon(thisID,true);
			mdbla.highlightedData = thisData;
			mdbla.mapAction(thisData);
			mdbla.scrollToRanking(thisID);
		})

		// allow user to delete the bookmark
		$('#close-'+thisID).click(function(){
			$('#bookmark-'+thisID).css('display','none');
			mdbla.bookmarks.splice(mdbla.bookmarks.indexOf(thisID),1);
			if(mdbla.bookmarks.length == 0) mdbla.allowHover = true;
		})
	}
}

/***

	Ranking the data allows us to see how each
	selected geography compares with the rest 
	of the data

***/
mdbla.createRankings = function()
{
	$.each(mdbla.data[mdbla.geography].rows,function(i,val){
		mdbla.jailarray.push(val._jaildays)
		mdbla.bookingsarray.push(val._bookings)
		mdbla.costarray.push(val._cost)
		mdbla.fipsarray.push(val.fips)
	})
	var jailsorted = mdbla.jailarray.slice().sort(function(a,b){return a-b})
	mdbla.jailranks = mdbla.jailarray.slice().map(function(v){ return jailsorted.indexOf(v)+1 });
	var bookingssorted = mdbla.bookingsarray.slice().sort(function(a,b){return a-b})
	mdbla.bookingsranks = mdbla.bookingsarray.slice().map(function(v){ return bookingssorted.indexOf(v)+1 });
	var costsorted = mdbla.costarray.slice().sort(function(a,b){return a-b})
	mdbla.costranks = mdbla.costarray.slice().map(function(v){ return costsorted.indexOf(v)+1 });
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
	var waffle = '<div style="text-align:center">';

	// title
	waffle += '<h2>'+values.title+'</h2>';


	// waffle it
	waffle += '<div class="waffle-container">';

	$.each(normalizedValues,function(i,val){
		for (var j = 0; j < val; j++) 
		{
			waffle += '<div class="waffle-border" style="float:left;"><div class="waffle-box-empty" style="background-color:'+mdbla.colorPallete[i]+'"></div></div>';
		}
	})
	waffle += '</div>';

	// stats and values
	waffle += '<table class="table table-condensed smallfont" style="text-align:left;">';

	for (var i = 0; i < values.data.length; i++) {
		waffle += '<tr><td width="50%">'+values.labels[i]+'</td><td width="50%" align="right">'+values.data[i]+' ('+normalizedValues[i]+'%)</td><td><div class="waffle-border" style="float:left;"><div class="waffle-box-empty" style="background-color:'+mdbla.colorPallete[i]+'"></div></div></td></tr>';
	}

	waffle += '</table></div>'

	return waffle;
}

mdbla.createNeighborhoodDropdown = function()
{

	mdbla.data[mdbla.geography].rows.sort(function(a, b) {
		return parseFloat(b.name) - parseFloat(a.name);
	});

	$.each(mdbla.data[mdbla.geography].rows,function(i,val){
		$('#dropdown-neighborhood').append('<li><a href="#" onclick="mdbla.highlightPolygon(\''+val.fips+'\')">'+val.name+'</a></li>')
	})
}
