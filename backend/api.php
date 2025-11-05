<?php
require_once __DIR__ . '/db.php';

allow_cors();

$routes = [
    'exits' => __DIR__ . '/api/exits.php',
    'repairs' => __DIR__ . '/api/repairs.php',
    'entries' => __DIR__ . '/api/entries.php',
    'timeline' => __DIR__ . '/api/timeline.php',
];

$endpoint = '';
$legacyAction = $_GET['action'] ?? '';
if ($legacyAction !== '') {
    $legacyAction = strtolower($legacyAction);
    $legacyMap = [
        'create_exit_form' => ['target' => 'exits', 'method' => 'POST'],
        'create_repair_form' => ['target' => 'repairs', 'method' => 'POST'],
        'create_entry_confirm' => ['target' => 'entries', 'method' => 'POST'],
        'update_status' => ['target' => 'timeline', 'method' => 'POST'],
        'list_statuses' => ['target' => 'timeline', 'method' => 'GET', 'mode' => 'statuses'],
        'recent_forms' => ['target' => 'timeline', 'method' => 'GET', 'mode' => 'recent'],
        'search_forms' => ['target' => 'timeline', 'method' => 'GET', 'mode' => 'search', 'searchParam' => 'q'],
    ];
    if (isset($legacyMap[$legacyAction])) {
        $map = $legacyMap[$legacyAction];
        $endpoint = $map['target'];
        if (isset($map['method'])) {
            $_SERVER['REQUEST_METHOD'] = $map['method'];
        }
        if (isset($map['mode'])) {
            $_GET['mode'] = $map['mode'];
        }
        if (isset($map['searchParam']) && isset($_GET[$map['searchParam']])) {
            $_GET['search'] = $_GET[$map['searchParam']];
        }
    } else {
        $endpoint = $legacyAction;
    }
}

if ($endpoint === '') {
    $endpoint = $_GET['endpoint'] ?? $_GET['resource'] ?? '';
    if ($endpoint === '' && !empty($_SERVER['PATH_INFO'])) {
        $endpoint = trim((string)$_SERVER['PATH_INFO'], '/');
    }
    $endpoint = strtolower(trim((string)$endpoint));
}

if (isset($routes[$endpoint])) {
    require $routes[$endpoint];
    return;
}

$db = get_db();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    switch ($endpoint) {
        case '':
            json_response([
                'message' => 'سامانه API در حال اجرا است.',
                'resources' => array_keys($routes),
                'auth' => ['login', 'me'],
            ]);
            break;

        case 'login':
            if ($method !== 'POST') {
                json_response(['error' => 'متد مجاز نیست.'], 405);
            }
            $body = get_json_input();
            $username = trim($body['username'] ?? '');
            $password = (string)($body['password'] ?? '');
            if ($username === '' || $password === '') {
                json_response(['error' => 'نام کاربری یا رمز عبور خالی است.'], 400);
            }
            $stmt = $db->prepare('SELECT id, password_hash FROM users WHERE username = ?');
            $stmt->execute([$username]);
            $user = $stmt->fetch();
            if (!$user || !password_verify($password, $user['password_hash'])) {
                json_response(['error' => 'نام کاربری یا رمز عبور نادرست است.'], 401);
            }
            $token = bin2hex(random_bytes(24));
            $expires = time() + 24 * 3600;
            $insertToken = $db->prepare('INSERT INTO tokens(token, user_id, expires_at) VALUES (?,?,?)');
            $insertToken->execute([$token, $user['id'], $expires]);
            json_response(['token' => $token, 'expires_at' => $expires]);
            break;

        case 'me':
            $auth = require_auth();
            json_response(['user' => $auth['user']]);
            break;

        case 'units':
            if ($method !== 'GET') {
                json_response(['error' => 'متد مجاز نیست.'], 405);
            }
            require_auth();
            $rows = $db->query('SELECT id, name FROM units ORDER BY name')->fetchAll();
            json_response(['units' => $rows]);
            break;

        default:
            json_response(['error' => 'مسیر ناشناخته است.'], 404);
    }
} catch (Throwable $e) {
    json_response(['error' => 'خطای داخلی سرور', 'details' => $e->getMessage()], 500);
}
