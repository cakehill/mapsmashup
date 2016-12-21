//All this JS uses the $5 zipcode table for long/lat coordinates
// our geocoder
var geocoder = null;
// our map
var map = null;

//Initializes our map.
function initialize() 
{
	// ensure browser supports Google's API
	if (GBrowserIsCompatible())
    {
    	// instantiate map
        map = new GMap2(document.getElementById("map"));
	    
	    // center map
        map.setCenter(new GLatLng(38.822591,-94.658203), 4);

		// prepapre a geocoder
		geocoder = new GClientGeocoder();
		
		//add the controls
		addControls();
		
		// give focus to form
		document.forms[0].address.focus();
					
	}
}

//Goes to address if possible.
function go(address)
{
	//error check the zipcode that was entered
	if (!address.match(/[0-9]{5}/)) 
	{
        document.getElementById("error").innerHTML = "Invalid zip code! Zip code must be 5-digit!";
		return;
    }
	// ensure geocoder exists
	if (!geocoder)
		return;
  		
	// Clear all overlays
	map.clearOverlays();	

	//add the controls
	addControls();
	
	//set up the center point
	getCenterPoint(address);
			
	//add the moveend function to start the page out so the map centers correctly, then remove it and add zoom and drag
	//we only want movend initially
	var mapEventListener = GEvent.addListener(map, "moveend", function() 
	{
		//start the process
		getZips();
		GEvent.removeListener(mapEventListener);
		
		//add some listeners when the map is either dragged or zoomed
		GEvent.addListener(map, "zoomend", function() 
		{
			//start the process again
			getZips();
		});
		
		GEvent.addListener(map, "dragend", function() 
		{
			//start the process again
			getZips();
		});
	});
}

//find the center of the map with the supplied zipcode, look in the $5 table
function getCenterPoint(address)
{
	var getCenterUrl = "zipcodes.php?z="+address;
	var handleSuccess = function(o)
	{
		if (o.responseXML !== null) 
		{
			var items = o.responseXML.getElementsByTagName("location");
			if (items.length == 0) 
			{
			document.getElementById("error").innerHTML = "No such zip code!";
			return;
			}
			//grab the coordinates out of the xml that was created
			var latitude = items[0].getElementsByTagName("lat")[0].firstChild.nodeValue;
			var longitude = items[0].getElementsByTagName("long")[0].firstChild.nodeValue;
			//set the center and move on
			return map.setCenter(new GLatLng(latitude, longitude), 14);
		}
		else 
		{
			document.getElementById("error").innerHTML = "The getCenterPoint request failed, try again.";
			return;
		}
	}
		
	var handleFailure = function(o)
	{
		if(o.responseText !== undefined)
		{
			document.getElementById("error").innerHTML = "Getting the zipcode failed, try again.";
			return;
		}
	}
	
	var callback =
	{
	  success: handleSuccess,
	  failure: handleFailure
	};
	
	//generate the ajax call
	getRequest(getCenterUrl, callback);		
}

//after page has been centered, it uses the map boundaries and goes and asks for an xml document of all nearby zips within the long/lat range
function getZips()
{
	map.clearOverlays();
	//find all the boundaries to send off to the php
	var bounds = map.getBounds();
	var southWest = bounds.getSouthWest();
	var northEast = bounds.getNorthEast();
	var sgetzipsUrl  = "zipcodes.php?sw="+  southWest + "&ne=" +northEast;

	var handleSuccess = function(o)
	{
		if (o.responseXML !== null) 
		{
			var items = o.responseXML.getElementsByTagName("location");

			if (items.length == 0) 
			{
				//document.getElementById("error").innerHTML = "Invalid zip code, or no news is happening at "+address+"!";
				//return;
			}
			//initialize the arrays we will need
			var zipcodes = new Array();
			var city = new Array();
			var abbr = new Array();
			var latitude = new Array();
			var longitude = new Array();
			//add to the arrays
			for (var i = 0; i < items.length; i++) 
			{
				city[i] = items[i].getElementsByTagName("city")[0].firstChild.nodeValue;
				abbr[i] = items[i].getElementsByTagName("abbr")[0].firstChild.nodeValue;
				zipcodes[i] = items[i].getElementsByTagName("zip")[0].firstChild.nodeValue;
				latitude[i] = items[i].getElementsByTagName("lat")[0].firstChild.nodeValue;
				longitude[i] = items[i].getElementsByTagName("long")[0].firstChild.nodeValue;
			}					
			//loop through all the zipcodes, adding markers and listeners		
			for (i in zipcodes) 
			{
				add_marker(zipcodes[i], city[i], abbr[i], latitude[i], longitude[i]);
			}
		}
		else 
		{
			document.getElementById("error").innerHTML = "The getZips request failed, try again.";
			return;
		}
	}
		
	var handleFailure = function(o)
	{
		if(o.responseText !== undefined)
		{
			document.getElementById("error").innerHTML = "Getting zipcodes failed, try again.";
			return;
		}
	}
	
	var callback =
	{
	  success: handleSuccess,
	  failure: handleFailure
	};
	//generate the ajax call
	getRequest(sgetzipsUrl, callback);	
}

//function to grab all the news for the zipcode
function getNewsHtml(zipcode,marker,city,abbr)
{
	var sUrl = "getnews.php?z=" + zipcode;
		
	var handleSuccess = function(o)
	{
		if (o.responseXML !== null) 
		{
			var items = o.responseXML.getElementsByTagName("item");
			
			if (items.length == 0) 
			{
				var html=""+city+", "+abbr+" "+zipcode+"<p>We cannot find any news.  Try another zipcode.</p>";
			}
			else
			{
				//start creating what will show up in the popin window
				var html="<h3>"+city+", "+abbr+" "+zipcode+"</h3>";
				//keep the count dynamic so if we change the sql query
				html += '<p>The top '+items.length+' news items from google news.</p>';
			}

			//loop through the top 10 news items for that area
			for (var i = 0; i < items.length; i++) 
			{
            	html +='<p style="font-size:.8em;;"><a href="'+ items[i].getElementsByTagName("link")[0].firstChild.nodeValue +'" target="_blank">' + items[i].getElementsByTagName("title")[0].firstChild.nodeValue + '</a></p>'; 
			}
			//return the data in the window
			return marker.openInfoWindowHtml(html);		
		} 
		else 
		{
			document.getElementById("error").innerHTML = "The getNewsHtml request failed, try again.";
			return;
		}
	}
		
	var handleFailure = function(o)
	{
		if(o.responseText !== undefined)
		{
			document.getElementById("error").innerHTML = "Getting news failed, try again.";
			return;
		}
	}
	
	var callback =
	{
	  success: handleSuccess,
	  failure: handleFailure
	};
	//generate the ajax call
	getRequest(sUrl, callback);	
}

//adds common controls to map
function addControls()
{
	// add large control for navigation
	map.addControl(new GSmallZoomControl());

	// add control for type
	map.addControl(new GMapTypeControl());

	// enable scroll wheel for zooming
	map.enableScrollWheelZoom();
}

//call the YUI ajax connect
function getRequest(sUrl, callback)
{
var request = YAHOO.util.Connect.asyncRequest('GET', sUrl, callback);
}

//add the marker to the page
function add_marker(zipcode,city, abbr, latitude, longitude)
{
	var point = new GLatLng(latitude, longitude);
	var marker = createMarker(point, zipcode, city, abbr);
	map.addOverlay(marker);
}

//add the listener so when someone clicks, they get the proper news
function createMarker(point,zipcode,city,abbr) 
{
	var marker = new GMarker(point);
	GEvent.addListener(marker, "click", function() 
	{
		getNewsHtml(zipcode,marker,city,abbr);
	});
	return marker;
}