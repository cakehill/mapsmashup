<?
//this page connects with the database to either get the center point of a zipcode or gather all zipcodes that fall within the boundary of the map
//the code decides this by what is passed in with the querystring.

// Puts our function declarations into this page  
require_once('config.php');

//grabs the variables from the url
$sw = explode(",",$_GET['sw']);
$ne = explode(",",$_GET['ne']);
$z = $_GET['z'];

//replaces the characters ( and ) so the database can read the long/lat ok
$latitudesouth =  str_replace("(","",$sw[0]); 
$longitudesouth = str_replace(")","",$sw[1]); 
$latitudenorth =  str_replace("(","",$ne[0]);  
$longitudenorth =  str_replace(")","",$ne[1]);

//clean everything to prevent injection attacks
$latitudesouth = cleanstring($latitudesouth);
$longitudesouth = cleanstring($longitudesouth);
$latitudenorth = cleanstring($latitudenorth);
$longitudenorth = cleanstring($longitudenorth);

//this page is used 2 times.  Once to get the center of the page, and once to get all zipcodes that fall in a certain boundary
//two where clauses allow this to happen
if (isset($z))
{
	$where = "WHERE zipcode =".cleanstring($z);
}
else
{
	$where = "WHERE latitude >= ".$latitudesouth." AND latitude <= ".$latitudenorth." AND longitude >= ".$longitudesouth." AND longitude <=".$longitudenorth;
}

//in the sql statement, we group longitude and latitude together since the $5 zipcode table list lots of multiple long/lat values.  The reason for this is that
//there are only two places after the decimal and if I was to loop through all of them, there would be unneccesary database hits.  Also I decided to only 
//pull 10 random zipcodes regardless of how far out the map is zoomed.  This allows random zipcodes to be displayed when you zoom out and drag the map
$sql = mysql_query("SELECT abbr, zipcode, longitude, latitude, city
				FROM tbl_zipcodes 
				".$where."
				GROUP BY longitude, latitude 
				ORDER BY RAND() 
				LIMIT 10"); 
//error check
if($sql === FALSE)
{
	exit( "Could not query database: " . mysql_error() );
}

//start the xml document
header('Content-Type: text/xml');

echo "<places>\n";
while ($row = mysql_fetch_assoc($sql))
{
	echo "<location>";
	echo "<zip>".$row['zipcode'] . "</zip>";
	echo "<lat>".$row['latitude'] . "</lat>";
	echo "<long>".$row['longitude'] . "</long>";
	echo "<city>".$row['city'] . "</city>";
	echo "<abbr>".$row['abbr'] . "</abbr>";	
	echo "</location>\n";
}
echo "</places>\n";
?>