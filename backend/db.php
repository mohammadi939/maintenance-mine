<?php
// Database connection and helpers for CMMS

ini_set('default_charset', 'UTF-8');
date_default_timezone_set('Asia/Tehran');

const DB_DIR = __DIR__ . '/data';
const DB_FILE = DB_DIR . '/cmms.sqlite';

function ensure_data_dirs(): void {
    if (!is_dir(DB_DIR)) {
        mkdir(DB_DIR, 0777, true);
    }
    $uploads = __DIR__ . '/uploads';
    if (!is_dir($uploads)) {
        mkdir($uploads, 0777, true);
    }
}

function get_db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    ensure_data_dirs();
    $dsn = 'sqlite:' . DB_FILE;
    $pdo = new PDO($dsn);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA foreign_keys = ON');
    return $pdo;
}

function json_response($data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function get_json_input(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function get_bearer_token(): ?string {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (preg_match('/Bearer\s+(.*)$/i', $auth, $m)) {
        return trim($m[1]);
    }
    // Also support token via query for simple testing
    if (isset($_GET['token'])) {
        return $_GET['token'];
    }
    return null;
}

function require_auth(): array {
    $token = get_bearer_token();
    if (!$token) {
        json_response(['error' => 'توکن ارائه نشده است.'], 401);
    }
    $db = get_db();
    $stmt = $db->prepare('SELECT t.token, t.expires_at, u.id, u.username, u.role, u.unit_id FROM tokens t JOIN users u ON u.id = t.user_id WHERE t.token = ?');
    $stmt->execute([$token]);
    $row = $stmt->fetch();
    if (!$row) {
        json_response(['error' => 'توکن نامعتبر است.'], 401);
    }
    if ((int)$row['expires_at'] < time()) {
        json_response(['error' => 'توکن منقضی شده است.'], 401);
    }
    return [
        'token' => $row['token'],
        'user' => [
            'id' => (int)$row['id'],
            'username' => $row['username'],
            'role' => $row['role'],
            'unit_id' => $row['unit_id'] !== null ? (int)$row['unit_id'] : null,
        ],
    ];
}

function allow_cors(): void {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
