<?php
require_once __DIR__ . '/db.php';
allow_cors();
$auth = require_auth();

$entity_type = $_POST['entity_type'] ?? '';
$entity_id = (int)($_POST['entity_id'] ?? 0);

if ($entity_type === '' || $entity_id <= 0) {
    json_response(['error' => 'پارامترهای نامعتبر'], 400);
}

if (!isset($_FILES['file'])) {
    json_response(['error' => 'فایل ارسال نشده است.'], 400);
}

$uploadDir = __DIR__ . '/uploads';
if (!is_dir($uploadDir)) { mkdir($uploadDir, 0777, true); }

$original = $_FILES['file']['name'];
$ext = pathinfo($original, PATHINFO_EXTENSION);
$fname = uniqid('att_', true) . ($ext ? ('.' . $ext) : '');
$dest = $uploadDir . '/' . $fname;
if (!move_uploaded_file($_FILES['file']['tmp_name'], $dest)) {
    json_response(['error' => 'آپلود ناموفق بود.'], 500);
}

$db = get_db();
$db->prepare('INSERT INTO attachments(entity_type, entity_id, file_path, created_at) VALUES (?,?,?,?)')
   ->execute([$entity_type, $entity_id, 'uploads/' . $fname, time()]);

json_response(['file_path' => 'uploads/' . $fname]);
