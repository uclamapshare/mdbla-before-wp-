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

				mdbla.scrollToRanking(data[mdbla.geographyIDColumn[mdbla.geography]]);

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

	// populate the title box
	var percentPop = Math.round(data.pop2010/mdbla.summary[mdbla.geography].pop2010sum*100);
	var percentBooked = Math.round(data._bookings/mdbla.summary[mdbla.geography].bookingssum*100);
	var percentCost = Math.round(data._cost/mdbla.summary[mdbla.geography].costsum*100);
	var html = '<div class="stats-title">'+mdbla.highlightedGeographyName+'</div><div class="well"><span class="stats-number">'+percentPop+'%</span> of Los Angeles County population, <span class="stats-number">'+percentBooked+'%</span> of all jail bookings and <span class="stats-number">'+percentCost+'%</span> of total costs</div>';

	$('#display-geography-title').html(html);

	// process data for active tab only
	// tabs with switches here enables the data to be refreshed as user hovers over map (data intensive)
	// keeping "rankings" out of this functionality
	switch (mdbla.activeTab)
	{
		case 'prison': mdbla.displayPrisonData(); break;
		case 'charges' : mdbla.displayCharges(); break;
		case 'timeline' : mdbla.displayTimeline(); break;
		case 'daysinjail' : mdbla.displayDaysInJailChart(); break;
		// case 'rankings' : mdbla.displayRankings(); break;
	}
}

mdbla.highlightRanking = function(id)
{
	console.log('highlighting ranking row '+id)
	$('#ranking-'+id).css('background-color','yellow')
	if(mdbla.highlightedRanking) mdbla.highlightedRanking.css('background-color','white');
	mdbla.highlightedRanking = $('#ranking-'+id);
}

mdbla.scrollToRanking = function(id)
{
	$('#rankings').animate({
		scrollTop: $('#ranking-'+id).offset().top - $('#rankings').offset().top + $('#rankings').scrollTop()
	});
}

mdbla.highlightPolygon = function(id,zoomornot)
{
	console.log('higlighting '+id)
	if(mdbla.activeTab == 'rankings') mdbla.highlightRanking(id);

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
		if(val.properties[mdbla.geographyIDColumn[mdbla.geography]] == id)
		{
			thisGeoJSON = val
		}
	})

	if(mdbla.highlightedPolygon) {mdbla.map.removeLayer(mdbla.highlightedPolygon)};
	mdbla.highlightedPolygon = L.geoJson(thisGeoJSON,mdbla.highlightedPolygonStyle).addTo(mdbla.map);

	// zoom to the polygon
	if(zoomornot) mdbla.map.fitBounds(mdbla.highlightedPolygon.getBounds()); 

}
