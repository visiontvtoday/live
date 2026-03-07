<?php
// Admin : https://t.me/riseflix

error_reporting(0);

$APP_CONFIG['APP_NAME'] = "Stalker Web";
$APP_CONFIG['APP_FAVICON'] = "assets/favicon.png";
$APP_CONFIG['APP_LOGO'] = "assets/AIO.png";
$APP_CONFIG['DEFAULT_ADMIN_PIN'] = "2929";
$APP_CONFIG['DEFAULT_STREAM_PROXY_STATUS'] = "OFF";
$APP_CONFIG['DATA_FOLDER'] = "__AppData__";
$APP_CONFIG['WHITELABEL_APP_DEVS'] = "@riseflix";

//===================================================================//

if(!is_dir($APP_CONFIG['DATA_FOLDER'])){ mkdir($APP_CONFIG['DATA_FOLDER']); }
if(!file_exists($APP_CONFIG['DATA_FOLDER']."/.htaccess")){ @file_put_contents($APP_CONFIG['DATA_FOLDER']."/.htaccess", "deny from all"); }
if(!file_exists($APP_CONFIG['DATA_FOLDER']."/index.php")){ @file_put_contents($APP_CONFIG['DATA_FOLDER']."/index.php", ""); }

// FIXED: Protocol detection
$streamenvproto = "http";
if(isset($_SERVER['HTTPS'])){ if($_SERVER['HTTPS'] == "on"){ $streamenvproto = "https"; } }
if(isset($_SERVER['HTTP_X_FORWARDED_PROTO'])){ if($_SERVER['HTTP_X_FORWARDED_PROTO'] == "https"){ $streamenvproto = "https"; }}

// FIXED: Don't modify HTTP_HOST - keep original with port
$original_host = $_SERVER['HTTP_HOST']; // Keep full host with port

// FIXED: Don't replace localhost with 127.0.0.1
// Just use the host as is
$plhoth = $original_host;
$plhoth = str_replace(" ", "%20", $plhoth);

//===================================================================//

function response($status, $code, $message, $data)
{
    header("Content-Type: application/json");
    header("Access-Control-Allow-Origin: *");
    $response = array("status" => $status, "code" => $code, "message" => $message, "data" => $data);
    print(json_encode($response));
    exit();
}

function generateRandomAlphanumericString($length)
{
    $characters = '0123456789abcdefghijkmnpqrstuvwxyzABCDEFGHIJKLMNPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, $charactersLength - 1)];
    }
    return $randomString;
}

function hextorgb ($hexstring)
{
    $integar = hexdec($hexstring);
    return array("red" => 0xFF & ($integar >> 0x10), "green" => 0xFF & ($integar >> 0x8), "blue" => 0xFF & $integar);
}

function isValidAdminPIN($pin)
{
    $output = false;
    if(preg_match('/^[0-9]{4}$/', $pin))  {
        $output = true;
    }
    return $output;
}

function cleanString($string)
{
    $string = str_replace(" ", "_", $string);
    return $string;
}

function getRootBase($url)
{
    $output = "";
    $xrl = parse_url($url);
    if(isset($xrl['host']) && !empty($xrl['host'])) {
        $port = isset($xrl['port']) ? ":" . $xrl['port'] : "";
        $output = $xrl['scheme']."://".$xrl['host'].$port;
    }
    return $output;
}

function getRelativeBase($url)
{
    if(stripos($url, "?") !== false) {
        $xrl = explode("?", $url);
        if(isset($xrl[0]) && !empty($xrl[0])) {
            $url = trim($xrl[0]);
        }
    }
    $url_base = str_replace(basename($url), '', $url);
    return $url_base;
}

function extractURIPart($vine)
{
    $output = "";
    $h1 = explode('URI="', $vine);
    if(isset($h1[1]))
    {
        $h2 = explode('"', $h1[1]);
        if(isset($h2[0]) && !empty($h2[0]))
        {
            $output = trim($h2[0]);
        }
    }
    return $output;
}

function ex_encdec($action, $data) {
    $output = '';
    $key = 'tuj2sDq6w0CqGstzTmHEi1a0q40SpMWSyGpP51cdXi5CnLwNJ7tZmSe2zxgYFXjKifJYHuEdwPmUTI0yaH0G8A2bRZpUZYGZ';
    if($action == "decrypt"){ $data = base64_decode(base64_decode($data)); }
    $dataLength = strlen($data);
    $keyLength = strlen($key);
    for ($i = 0; $i < $dataLength; ++$i) { $output .= $data[$i] ^ $key[$i % $keyLength]; }
    if($action == "encrypt"){ $output = str_replace("=", "", base64_encode(base64_encode($output))); }
    return $output;
}

function getRequest($url, $headers)
{
    $process = curl_init($url);
    curl_setopt($process, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($process, CURLOPT_HEADER, 0);
    curl_setopt($process, CURLOPT_TIMEOUT, 10);
    curl_setopt($process, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($process, CURLOPT_FOLLOWLOCATION, 1);
    $return = curl_exec($process);
    $effURL = curl_getinfo($process, CURLINFO_EFFECTIVE_URL);
    $httpcode = curl_getinfo($process, CURLINFO_HTTP_CODE);
    curl_close($process);
    return array("url" => $effURL, "code" => $httpcode, "data" => $return);
}

function postRequest($url, $headers, $payload)
{
    $process = curl_init($url);
    curl_setopt($process, CURLOPT_POST, 1);
    curl_setopt($process, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($process, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($process, CURLOPT_HEADER, 0);
    curl_setopt($process, CURLOPT_TIMEOUT, 10);
    curl_setopt($process, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($process, CURLOPT_FOLLOWLOCATION, 1);
    $return = curl_exec($process);
    $effURL = curl_getinfo($process, CURLINFO_EFFECTIVE_URL);
    $httpcode = curl_getinfo($process, CURLINFO_HTTP_CODE);
    curl_close($process);
    return array("url" => $effURL, "code" => $httpcode, "data" => $return);
}

//===================================================================//

function app_recordalogs($status, $message)
{
    global $APP_CONFIG;
    $data_actionlogs = "";
    $path_actionlogs = $APP_CONFIG['DATA_FOLDER']."/axLogs.enc";
    if(file_exists($path_actionlogs)) {
        $data_actionlogs = @file_get_contents($path_actionlogs);
    }
    $log_msg = date('F d, Y h:i:s A')." || ".$message." || ".$_SERVER['REMOTE_ADDR']." - ".$_SERVER['HTTP_USER_AGENT']."\n";
    $final_actionlogs = $log_msg.$data_actionlogs;
    if(file_put_contents($path_actionlogs, $final_actionlogs)){ return true; }else{ return false; }
}

function app_accesspin($action, $data)
{
    global $APP_CONFIG; $kdata = "";
    $kpath = $APP_CONFIG['DATA_FOLDER']."/axPIN.enc";
    if($action == "update")
    {
        $output = false;
        if(isValidAdminPIN($data) && file_put_contents($kpath, $data)) {
            $output = true;
        }
        return $output;
    }
    else
    {
        if(file_exists($kpath)){ $kdata = @file_get_contents($kpath); }
        if(!empty($kdata)) {
            return $kdata;
        } else {
            if(isset($APP_CONFIG['DEFAULT_ADMIN_PIN']) && isValidAdminPIN($APP_CONFIG['DEFAULT_ADMIN_PIN'])) {
                return $APP_CONFIG['DEFAULT_ADMIN_PIN'];
            } else {
                return "";
            }
        }
    }
}

function app_macportaldetail($action, $url, $mac_id, $serial, $deviceid1, $deviceid2, $signature)
{
    global $APP_CONFIG;
    $mdata = array();
    $mpath = $APP_CONFIG['DATA_FOLDER']."/axMAC.enc";
    if(file_exists($mpath)) {
        $mget = @file_get_contents($mpath);
        if(!empty($mget)) {
            $mjson = @json_decode($mget, true);
            if(isset($mjson['server_url']) && !empty($mjson['server_url'])) { $mdata = $mjson;}
        }
    }
    if($action == "update")
    {
        $dataToSave = array("server_url" => $url, "mac_id" => $mac_id, "serial" => $serial, "device_id1" => $deviceid1, "device_id2" => $deviceid2, "signature" => $signature);
        if(file_put_contents($mpath, json_encode($dataToSave))) {
            return true;
        } else {
            return false;
        }
    }
    else
    {
        return $mdata;
    }
}

function app_streamproxy($action)
{
    global $APP_CONFIG;
    $path_StrmPxy = $APP_CONFIG['DATA_FOLDER']."/axSTMPXY.enc";
    if(isset($APP_CONFIG['DEFAULT_STREAM_PROXY_STATUS']) && $APP_CONFIG['DEFAULT_STREAM_PROXY_STATUS'] == "ON" || $APP_CONFIG['DEFAULT_STREAM_PROXY_STATUS'] == "OFF") { $output = $APP_CONFIG['DEFAULT_STREAM_PROXY_STATUS']; }else{ $output = "OFF"; }
    if(file_exists($path_StrmPxy)) {
        $data_StmPxy = @file_get_contents($path_StrmPxy);
        if($data_StmPxy == "ON" || $data_StmPxy == "OFF") {
            $output = $data_StmPxy;
        }
    }
    if($action == "toggle")
    {
        if($output == "ON"){ $new_int = "OFF"; }else{ $new_int = "ON"; }
        if(file_put_contents($path_StrmPxy, $new_int)){ return true; }else{ return false; }
    }
    else
    {
        return $output;
    }
}

function getChannels()
{
    $output = array();
    $list_tv = mac_getallChannels();
    if(isset($list_tv[0])) {
        $output = $list_tv;
    }
    return $output;
}

function getChannelDetail($id)
{
    $output = array();
    foreach(getChannels() as $itv) {
        if(md5($id) == md5($itv['id'])) {
            $output = $itv;
        }
    }
    return $output;
}

function fixlogoissue($logo)
{
    global $plhoth; global $streamenvproto;
    $custom_logo = 0;
    if(empty($logo)) { $custom_logo = 1; }
    if(stripos($logo, "http://") === false && stripos($logo, "https://") === false) { $custom_logo = 1; }
    if($custom_logo == 1) {
        // Use the same domain detection for logo
        $current_path = str_replace(basename($_SERVER['PHP_SELF']), '', $_SERVER['PHP_SELF']);
        $logo = $streamenvproto."://".$plhoth.$current_path."assets/aio_tv_logo.png";
        return $logo;
    } else {
        return $logo;
    }
}

include("_inc.upstrm.php");


?>