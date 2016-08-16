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
				mdbla.highlightPolygon(data.fips,true);

				mdbla.scrollToRanking(data.fips);

			})
			.on('featureOver', function(e, latlng, pos, data) 
			{
				// let's change the cursor cuz that hand is too vague
				$('#map').css('cursor', 'pointer');

				// only refresh the data if we hover over a new feature
				if(mdbla.highlightedGeographyID != data.fips && mdbla.allowHover)
				{
					// assign map actions
					mdbla.mapAction(data);

					// highlight the polygon
					mdbla.highlightPolygon(data.fips,false);
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
	mdbla.highlightedGeographyID = data.fips;
	mdbla.highlightedGeographyName = data.name;

	// populate the title box
	var html = '<div><span class="stats-title">'+mdbla.highlightedGeographyName+'</span><br>2010 population: '+mdbla.numberWithCommas(data.pop2010)+'</div>';
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

mdbla.highlightRanking = function(fips)
{
	console.log('highlighting ranking row '+fips)
	$('#ranking-'+fips).css('background-color','yellow')
	if(mdbla.highlightedRanking) mdbla.highlightedRanking.css('background-color','white');
	mdbla.highlightedRanking = $('#ranking-'+fips);
}

mdbla.scrollToRanking = function(fips)
{
	$('#rankings').animate({
		scrollTop: $('#ranking-'+fips).offset().top - $('#rankings').offset().top + $('#rankings').scrollTop()
	});
}

mdbla.highlightPolygon = function(fips,zoomornot)
{

	if(mdbla.activeTab == 'rankings') mdbla.highlightRanking(fips);

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
