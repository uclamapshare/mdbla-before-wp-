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
	mdbla.costarray = [];
	mdbla.costranks;
	mdbla.bookmarks = [];
	mdbla.allowHover = true;


/*

	Highlighted polygon/data

*/
	mdbla.highlightedPolygon;
	mdbla.highlightedData;
	mdbla.highlightedGeographyID;
	mdbla.highlightedGeographyName;

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
		'LASDNeighborhoods' : 'slug',
		'LAPDNeighborhoods' : 'slug',
	}

/*

	CartoDB/Mapbox params

*/
	mdbla.cartoKey = '701af57a932440fbe504882c6ccc8f6b3d83488f';
	mdbla.cartoLayerTable = {
		'BlockGroups' : 'lasd_2010_2015_by_block_group',
		'LASDNeighborhoods' : 'lasd_2010_2015_by_neighborhoods_merge',
		'LAPDNeighborhoods' : 'lapd_2010_2015_by_neighborhoods',
	}
	mdbla.cartoLayerMap = {
		// 'BlockGroups' : 'https://mdbla.carto.com/api/v2/viz/7c32ed80-4eb6-11e6-a745-0e05a8b3e3d7/viz.json',
		'BlockGroups' : 'https://mdbla.carto.com/api/v2/viz/e610732a-59ca-11e6-8760-0ecd1babdde5/viz.json',
		// 'Neighborhoods' : 'https://mdbla.carto.com/api/v2/viz/6c2a7b6c-5459-11e6-a6cd-0e233c30368f/viz.json'
		// 'LASDNeighborhoods' : 'https://mdbla.carto.com/api/v2/viz/95917d26-5b65-11e6-b8d9-0e233c30368f/viz.json'
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
