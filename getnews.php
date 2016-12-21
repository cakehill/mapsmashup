<?php
// If given argument is not zip code, exit
if (!preg_match('/^[0-9]{5}$/', @$_GET['z']))
    exit;

$zipcode = $_GET['z'];

// Set the appropriate Google News URL to use
$gNewsUrl = 'http://news.google.com/news?svnum=10&as_scoring=r&ned=us&as_drrb=q&as_qdr=m'
.'&as_mind=28&as_minm=2&as_maxd=30&as_maxm=3&geo='.$zipcode.'&aq=f&output=rss';

// Get the RSS feed in a string
$xmlString = file_get_contents($gNewsUrl);

// Generate DOM from feed
$xml = new SimpleXMLElement($xmlString);

// We are generating an XML document
header('Content-Type: text/xml, charset=UTF-8');

echo "<news>\n";

// Return the zip code just for fun
echo "<zipcode>$zipcode</zipcode>\n";

// For each news item, send it to the Ajax client
foreach($xml->channel->item as $item) {
    echo "  <item>\n";
    
    echo "     <title>".htmlspecialchars($item->title)."</title>\n";
    echo "     <link>".htmlspecialchars($item->link)."</link>\n";
    
    echo "  </item>\n";
}

echo "</news>";