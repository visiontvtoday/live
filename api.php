<?php

include("_inc.configs.php");

$action = ""; if(isset($_REQUEST['action'])){ $action = trim($_REQUEST['action']); }

//=====================================//

if($action == "getChannels")
{
    if(empty(mac_serverurl())){ response("error", 503, "Application is not Configured", ""); }
    $live = array(); $tv_list = getChannels();
    $count_tv_list = count($tv_list);
    if(!isset($tv_list[0])) { response('error', 404, 'No TV Channels Found', ''); }
    
    // Get genres for category mapping
    $genres = mac_getGenres();
    
    foreach($tv_list as $etv) {
        $category_title = 'Uncategorized';
        
        // Map category using tv_genre_id
        if(isset($etv['tv_genre_id']) && !empty($etv['tv_genre_id']) && $etv['tv_genre_id'] !== '0') {
            $genre_id = (string)$etv['tv_genre_id'];
            if(isset($genres[$genre_id])) {
                $category_title = $genres[$genre_id];
            }
        }
        
        $live[] = array(
            "id" => $etv['id'], 
            "title" => $etv['title'], 
            "logo" => fixlogoissue($etv['logo']),
            "category_title" => $category_title,
            "tv_genre_id" => isset($etv['tv_genre_id']) ? $etv['tv_genre_id'] : '0'
        );
    }
    response('success', 200, $count_tv_list.' TV Channels Found', array('count' => $count_tv_list, 'list' => $live));
}
elseif($action == "getPlaybackDetails")
{
    if(empty(mac_serverurl())){ response("error", 503, "Application is not Configured", ""); }
}
elseif($action == "get_iptvplaylist")
{
    $livetv = getChannels();
    if(isset($livetv[0]))
    {
        $icdata = '#EXTM3U'."\n";
        $e = 0;
        foreach($livetv as $itv)
        {
            $e++;
            $icdata .= '#EXTINF:-1 tvg-id="'.$e.'" tvg-name="'.$itv['title'].'" tvg-logo="'.fixlogoissue($itv['logo']).'" group-title="'.$APP_CONFIG['APP_NAME'].'",'.$itv['title']."\n";
            $icdata .= $streamenvproto."://".$plhoth.str_replace(" ", "%20", str_replace(basename($_SERVER['PHP_SELF']), '', $_SERVER['PHP_SELF']))."live.php?id=".$itv['id']."&vtoken=&e=.m3u8\n";
        }
        $file = cleanString($APP_CONFIG['APP_NAME'])."_" . time() . "_".cleanString($APP_CONFIG['APP_NAME']).".m3u";
        header('Content-Disposition: attachment; filename="'.$file.'"');
        header("Content-Type: application/vnd.apple.mpegurl");
        exit(trim($icdata));
    }
    http_response_code(503);
    exit();
}
elseif($action == "get_iptvplaylist_categorized")
{
    $livetv = getChannels();
    if(isset($livetv[0]))
    {
        $genres = mac_getGenres();
        
        $icdata = '#EXTM3U'."\n";
        $icdata .= '#PLAYLIST: '.$APP_CONFIG['APP_NAME']."\n";
        
        $channels_by_category = array();
        foreach($livetv as $itv) {
            $cat_title = 'Uncategorized';
            
            if(isset($itv['tv_genre_id']) && !empty($itv['tv_genre_id']) && $itv['tv_genre_id'] !== '0') {
                $genre_id = (string)$itv['tv_genre_id'];
                if(isset($genres[$genre_id])) {
                    $cat_title = $genres[$genre_id];
                }
            }
            
            if(!isset($channels_by_category[$cat_title])) {
                $channels_by_category[$cat_title] = array();
            }
            $channels_by_category[$cat_title][] = $itv;
        }
        
        foreach($channels_by_category as $cat_title => $channels) {
            $icdata .= "\n".'#EXTGRP:'.$cat_title."\n";
            
            foreach($channels as $itv) {
                $tvg_id = preg_replace('/[^a-zA-Z0-9]/', '', $itv['title']);
                $tvg_logo = fixlogoissue($itv['logo']);
                $stream_url = $streamenvproto."://".$plhoth.str_replace(" ", "%20", str_replace(basename($_SERVER['PHP_SELF']), '', $_SERVER['PHP_SELF']))."live.php?id=".$itv['id']."&vtoken=&e=.m3u8";
                
                $icdata .= '#EXTINF:-1 tvg-id="'.$tvg_id.'" tvg-name="'.$itv['title'].'" tvg-logo="'.$tvg_logo.'" group-title="'.$cat_title.'",'.$itv['title']."\n";
                $icdata .= $stream_url."\n";
            }
        }
        
        $file = cleanString($APP_CONFIG['APP_NAME'])."_categorized_" . time() . ".m3u";
        header('Content-Disposition: attachment; filename="'.$file.'"');
        header("Content-Type: application/vnd.apple.mpegurl");
        exit(trim($icdata));
    }
    http_response_code(503);
    exit();
}
elseif($action == "get_genres")
{
    if(empty(mac_serverurl())){ response("error", 503, "Application is not Configured", ""); }
    
    $genres = mac_getGenres();
    
    response('success', 200, count($genres).' Genres Found', array('count' => count($genres), 'list' => $genres));
}
elseif($action == "get_categories")
{
    if(empty(mac_serverurl())){ response("error", 503, "Application is not Configured", ""); }
    
    $categories = mac_getCategories();
    
    response('success', 200, count($categories).' Categories Found', array('count' => count($categories), 'list' => $categories));
}
elseif($action == "force_update_channels")
{
    session_start();
    if(!isset($_SESSION['yuvisession'])){ response("error", 401, "Login To Access This Protected Content", ""); }
    
    if(empty(mac_serverurl())){ response("error", 503, "Stalker Portal details are not configured", ""); }
    
    $channels = mac_forceUpdateChannels();
    
    if(!empty($channels)) {
        response("success", 200, "Channels updated successfully. Total: ".count($channels), "");
    } else {
        response("error", 403, "Failed to update channels. Check error logs.", "");
    }
}
else
{
    session_start();
    if($action == "getCaptcha")
    {
        $captcha_font = "assets/captchaFont.ttf";
        $captcha_image_height = 50; $captcha_image_width = 135;
        $random_captcha_dots = 50; $random_captcha_lines = 25;
        $captcha_text_color = "0x142864"; $captcha_noise_color = "0x142864";
        $captcha_code = generateRandomAlphanumericString(5);
        $captcha_font_size = $captcha_image_height * 0.65;
        $captcha_image = @imagecreate($captcha_image_width,$captcha_image_height);
        $background_color = imagecolorallocate($captcha_image,255,255,255);
        $array_text_color = hextorgb($captcha_text_color);
        $captcha_text_color = imagecolorallocate($captcha_image, $array_text_color['red'], $array_text_color['green'], $array_text_color['blue']);
        $array_noise_color = hextorgb($captcha_noise_color);
        $image_noise_color = imagecolorallocate($captcha_image,$array_noise_color['red'],$array_noise_color['green'],$array_noise_color['blue']);
        for($count=0; $count<$random_captcha_dots; $count++ ) {
            imagefilledellipse($captcha_image,mt_rand(0,$captcha_image_width),mt_rand(0,$captcha_image_height),2,3,$image_noise_color);
        }
        for($count=0; $count<$random_captcha_lines; $count++ ) {
            imageline($captcha_image,mt_rand(0,$captcha_image_width),mt_rand(0,$captcha_image_height),mt_rand(0,$captcha_image_width),mt_rand(0,$captcha_image_height),$image_noise_color);
        }
        $text_box = imagettfbbox($captcha_font_size,0,$captcha_font,$captcha_code);
        $x = ($captcha_image_width - $text_box[4])/2; $y = ($captcha_image_height - $text_box[5])/2;
        imagettftext($captcha_image,$captcha_font_size,0,$x,$y,$captcha_text_color,$captcha_font,$captcha_code);
        header('Content-Type: image/jpg');
        imagejpeg($captcha_image);
        imagedestroy($captcha_image);
        $_SESSION['yuvi_captcha'] = $captcha_code;
    }
    elseif($action == "login")
    {
        $pin = ""; $captcha = "";
        if($_SERVER['REQUEST_METHOD'] !== "POST") { response("error", 405, "Method Not Supported", ""); }
        if(isset($_REQUEST['pin'])){ $pin = trim($_REQUEST['pin']); }
        if(isset($_REQUEST['captcha'])){ $captcha = trim($_REQUEST['captcha']); }
        if(empty($pin)) {
            response("error", 400, "Please Enter Captcha", "");
        }
        if($captcha !== $_SESSION['yuvi_captcha']) {
            response("error", 403, "Captcha Invalid", "");
        }
        if(empty($pin)) {
            response("error", 400, "Please Enter Access PIN To Login", "");
        }
        $irlPIN = app_accesspin("get", "");
        if(md5($pin) == md5($irlPIN)) {
            $_SESSION['yuvisession'] = true;
            response("success", 200, "Logged In Successfully", "");
        }
        response("error", 500, "Invalid Credentials", "");
    }
    elseif($action == "logout")
    {
        session_destroy();
        response("success", 200, "Logged Out Successfully", "");
    }
    else
    {
        if(!isset($_SESSION['yuvisession'])){ response("error", 401, "Login To Access This Protected Content", ""); }
        if($action == "dashboard_data")
        {
            $expirydm = "-";
            if(isset(app_macportalmeta("get")['expiry']) && !empty(app_macportalmeta("get")['expiry'])) {
                $expirydm = date("F d, Y", strtotime(app_macportalmeta("get")['expiry']));
            }
            $xdetail = array("stalker_base" => app_macportaldetail("get", "", "", "", "", "", ""),
                             "stalker_data" => array("channels_count" => count(mac_getallChannels()),
                                                     "expiry" => $expirydm),
                             "settings" => array("stream_proxy" => app_streamproxy('get')));
            response("success", 200, "Dashboard Data", $xdetail);
        }
        elseif($action == "change_access_pin")
        {
            $pin = "";
            if(isset($_POST['pin'])) {
                $pin = trim(strip_tags($_POST['pin']));
            }
            if(empty($pin)) {
                response("error", 400, "Please enter new Access PIN to Change", "");
            }
            if(!isValidAdminPIN($pin)) {
                response("error", 400, "Access PIN should be 4 numbers long", "");
            }
            if(app_accesspin("update", $pin)) {
                response("success", 200, "Access PIN Changed. Login Again.", "");
            }
            response("error", 500, "Failed to change Access PIN", "");
        }
        elseif($action == "save_mac_portal")
        {
            if($_SERVER['REQUEST_METHOD'] !== "POST") { response("error", 405, "Method Not Supported", ""); }
            $server_url = ""; $mac_id = ""; $serial = "";
            $device_id1 = ""; $device_id2 = ""; $signature = "";
            if(isset($_REQUEST['server_url'])){ $server_url = trim(strip_tags($_REQUEST['server_url'])); }
            if(isset($_REQUEST['mac_id'])){ $mac_id = trim(strip_tags($_REQUEST['mac_id'])); }
            if(isset($_REQUEST['serial'])){ $serial = trim(strip_tags($_REQUEST['serial'])); }
            if(isset($_REQUEST['device_id1'])){ $device_id1 = trim(strip_tags($_REQUEST['device_id1'])); }
            if(isset($_REQUEST['device_id2'])){ $device_id2 = trim(strip_tags($_REQUEST['device_id2'])); }
            if(isset($_REQUEST['signature'])){ $signature = trim(strip_tags($_REQUEST['signature'])); }
            if(empty($server_url)) {
                response("error", 400, "Please enter MAC Server URL", "");
            }
            if(empty($mac_id)) {
                response("error", 400, "Please enter MAC ID", "");
            }
            if (substr($server_url, -strlen('/c/')) !== '/c/') {
                response("error", 400, "MAC Server URL should end with /c/", "");
            }
            $savify = app_macportaldetail("update", $server_url, $mac_id, $serial, $device_id1, $device_id2, $signature);
            if($savify) {
                app_recordalogs("SUCCESS", "Stalker Portal Data Saved/Updated");
                response("success", 200, "Saved Successfully", "");
            }
            app_recordalogs("SUCCESS", "Failed To Save Stalker Portal Data");
            response("error", 500, "Failed To Save", "");
        }
        elseif($action == "update_mac_data")
        {
            if(empty(mac_serverurl())){ response("error", 503, "Stalker Portal details are not configured", ""); }
            $profile_data = mac_getprofile();
            if(empty($profile_data)) {
                response("error", 403, "Failed To Fetch Profile Details. Check Error Logs", "");
            }
            $channels = mac_getallChannels();
            if(empty($channels)) { $channels = mac_getallChannels(); }
            if(empty($channels)) {
                response("error", 403, "Failed To Fetch Channels List. Check Error Logs", "");
            }
            app_recordalogs("SUCCESS", "Stalker Portal Meta-Info Saved/Updated");
            response("success", 200, "Stalker Portal Details Updated Successfully", "");
        }
        elseif($action == "delete_mac_portal")
        {
            $scFile = scandir($APP_CONFIG['DATA_FOLDER']);
            if(isset($scFile[0])) {
                foreach($scFile as $vcfile) {
                    if($vcfile !== "axPIN.enc") {
                        $bib = $APP_CONFIG['DATA_FOLDER']."/".$vcfile;
                        if(is_file($bib)) {
                            unlink($bib);
                        }
                    }
                }
            }
            response("success", 200, "Stalker Portal Deleted Successfully", "");
        }
        elseif($action == "toggle_stream_proxy")
        {
            $doChng = app_streamproxy('toggle');
            if(!$doChng) {
                response("error", 500, "Failed To Toggle Stream Proxy Status", "");
            }
            $mesn = app_streamproxy("get");
            response("success", 200, "Stream Proxy Status Changed To ".$mesn, "");
        }
        else
        {
            response("error", 400, "Requested Module Does Not Exist", "");
        }
    }
}

?>