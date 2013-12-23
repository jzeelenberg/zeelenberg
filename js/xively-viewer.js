var defaultKey		= 'HTbC5waYpwmWcujqTLwFeLUpskZqeo4RZV5k6AfTXTX5xnE4', // Unique master Xively API key to be used as a default
		defaultFeed	= '1884441883', // Comma separated array of Xively Feed ID numbers
		applicationName	= 'Zeelenberg', // Replaces Xively logo in the header
		dataDuration	= '1day', // Default duration of data to be displayed // ref: https://xively.com/dev/docs/api/data/read/historical_data/
		dataInterval	= 120, // Default interval for data to be displayed (in seconds)
		dataColor		= '', // CSS HEX value of color to represent data (omit leading #)
		hideForm		= 1; // To hide input form use value of 1, otherwise set to 0
		defaultmin		= 15;
		defaultmax		= 35;


$( document ).ready(function() {
    var key = defaultKey;
    var feed = defaultFeed;
    var newGraph = $('#graph-sample');//.clone().appendTo('#graph-container');
    newGraph.show();
    addNewGraph(key, feed, newGraph);
	$('#output').html("debugField");
    return false;
});

/*
 * Coordinate getting the feed information, fetching the datastreams, displaying the graph.
 */
function addNewGraph(key, feed, element) {
  
  xively.setKey( key );  
  
  xively.feed.get(feed, function(feedInfo) {
    //console.log("Feed info", feedInfo);
	$('#output').html("3");
	var now = new Date();
	var then = new Date();
	var diff = null;
	var duration = dataDuration;
	if(duration == '6hours') diff = 21600000;
	 if(duration == '1day') diff = 86400000;
	 if(duration == '1week') diff = 604800000;
	 if(duration == '1month') diff = 2628000000;
	 if(duration == '90days') diff = 7884000000;
	 if(duration == '30min') diff = 1800000;
	then.setTime(now.getTime() - diff);

    $(element).find('.title').html(feedInfo.title);
    $(element).find('.description').html(feedInfo.description);
	
    var history = { 
      "start": then,
      "end": now,
      limit: 1000
    };
    var interval = dataInterval;
    if (interval != 0) {
      history['interval'] = interval;
      history['interval_type'] = 'discrete';
    }
	    
    var dataStreams = {};
    _.each(feedInfo.datastreams, function(ds) {
      console.log('Fetching datastream: %s', ds);
      xively.datapoint.history(feed, ds.id, history, function(dsData) {
        dataStreams[ds.id] = xivelyToRickshawPoints(dsData);
        //$('#output').html(dataStreams[ds.id].x);
        // Are we done loading?
        if (_.keys(dataStreams).length == feedInfo.datastreams.length) {
          //console.log('dataStreams', dataStreams);
          displayFeed(element, dataStreams);
        }
      });
    });
  });
}

/* Returns the best interval to graph the specified date range 
 * or undefined if the range is too large. 
 */
function getBestInterval(start, end) {
  var hours = end.diff(start, 'hours');
  
  // https://xively.com/dev/docs/api/quick_reference/historical_data/
  var intervals = [
    {value:     0, max: 6},
    {value:    30, max: 12},
    {value:    60, max: 24},
    {value:   300, max: 5*24},
    {value:   900, max: 14*24},
    {value:  1800, max: 31*24},
    {value:  3600, max: 31*24},
    {value: 10800, max: 90*24},
    {value: 21600, max: 180*24},
    {value: 43200, max: 366*24},
    {value: 86400, max: 366*24}    
  ];
  var usableIntervals = _.filter(intervals, function(interval) { return hours <= interval.max; });
  return usableIntervals[0].value;
}

function xivelyToRickshawPoints(data) { 
  var points = _.map(data, function(point) {
    var m = moment(point.at)
	//$('#output').html(m.format());

    return {
      x: moment(point.at).unix(),
      y: parseFloat(point.value) 
    };
  });
  //console.log("Data has %s points from %s to %s", data.length, data[0].at, data[data.length - 1].at);
  return points;
} 

function displayFeed(container, datastreams) {
  console.log('draw chart - container=%j data=%j', container, datastreams);
  
  var series = [];
  var colorsFixture = new Rickshaw.Fixtures.Color();
  var colorPalette = colorsFixture.schemes.munin;
  var scales = {};
  _.each(_.keys(datastreams), function (dsId, idx) {
    var values = _.pluck(datastreams[dsId], 'y');
    var min = _.min(values);
    var max = _.max(values);
	var name = "name"
    
	//TODO:  change to a switch
    if(dsId==11){
		name="Amy";
	}
		
	if(dsId==12){
		name="Leo";
	}
		
		
    series.push({
      name: name,//dsId,
      color: colorPalette[idx],
      data: datastreams[dsId],
      //scale: scales[dsId]
    });
  });
  
  var graph = new Rickshaw.Graph({
    element: $( container ).find('.chart-container').get(0),
    //width:800,
	//height:1000,
	renderer: 'line',
    min: parseFloat(defaultmin),
    max: parseFloat(defaultmax),
	series: series
  });

/*
  var hoverDetail = new Rickshaw.Graph.HoverDetail( {
      graph: graph
  } );
  */
  var legend = new Rickshaw.Graph.Legend({
      graph: graph,
      element: $( container ).find('.legend-container').get(0)
  });
    
  var ticksTreatment = 'glow';
	
  var xAxis = new Rickshaw.Graph.Axis.Time({
    graph: graph,
	ticksTreatment: ticksTreatment,
    ticks: 5,
  });
  xAxis.render();
  
  var yAxis = new Rickshaw.Graph.Axis.Y({
	graph: graph,
	tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
    ticksTreatment: ticksTreatment,
    ticks: 20,
  });
  yAxis.render();

  graph.render();
 
  container.find('.loader').hide();
}


/* Some sample data is always useful to demonstrate the product */
$(document).ready(function() {
  $('.sample-data').click(function(event) {
    $('#key').val(event.currentTarget.attributes['data-key'].value);
    $('#feed').val(event.currentTarget.attributes['data-feed'].value);
  });
});
