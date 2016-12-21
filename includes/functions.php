<?
//opens the database connection
function open_db_connection()
{	
	// connect to the database
	if(($connection = mysql_connect(HOSTNAME, DB_USERNAME, DB_PASSWORD)) === FALSE)
	{
	    exit('Connection failed');
	}
	// select the database
	if(mysql_select_db(DB_NAME, $connection) === FALSE)
	{
        exit( "Could not select database: " . mysql_error($connection) );  
	}

	return $connection;
}

//cleans string for query against database
function cleanstring($userstring)
{
 $cleaned = trim(mysql_real_escape_string($userstring));
 return $cleaned;
}
?>