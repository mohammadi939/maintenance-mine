<?php
// Initialize SQLite database with the latest schema and seed admin
require_once __DIR__ . '/db.php';

allow_cors();
ensure_data_dirs();

$legacyDbFile = __DIR__ . '/data/cmms.sqlite';
if (file_exists($legacyDbFile)) {
    $timestamp = date('Ymd_His');
    $backupFile = BACKUP_DIR . '/legacy_cmms_' . $timestamp . '.sqlite';
    if (!@copy($legacyDbFile, $backupFile)) {
        json_response(['error' => 'پشتیبان‌گیری از دیتابیس قدیمی ناموفق بود.'], 500);
    }
    @unlink($legacyDbFile);
}

$db = get_db();

$dropTables = [
    'entry_confirmation_items',
    'entry_confirmations',
    'external_repair_items',
    'external_repairs',
    'exit_request_items',
    'exit_requests',
    'entry_items',
    'entry_confirms',
    'repair_items',
    'repair_forms',
    'exit_items',
    'exit_forms',
];

$schema = [
    // users
    'CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ("manager", "storekeeper", "unit", "workshop")),
        unit_id INTEGER
    )',

    // tokens
    'CREATE TABLE IF NOT EXISTS tokens (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )',

    // units
    'CREATE TABLE IF NOT EXISTS units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
    )',

    // equipment (optional)
    'CREATE TABLE IF NOT EXISTS equipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT,
        unit_id INTEGER,
        image_url TEXT,
        FOREIGN KEY(unit_id) REFERENCES units(id) ON DELETE SET NULL
    )',

    // exit requests
    'CREATE TABLE IF NOT EXISTS exit_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_no TEXT NOT NULL UNIQUE,
        request_date_shamsi TEXT NOT NULL,
        dispatch_type TEXT,
        driver_name TEXT,
        request_reason TEXT,
        unit_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT "در حال ارسال",
        created_by INTEGER,
        FOREIGN KEY(unit_id) REFERENCES units(id) ON DELETE RESTRICT,
        FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
    )',

    'CREATE TABLE IF NOT EXISTS exit_request_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exit_request_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        code TEXT,
        quantity REAL NOT NULL CHECK(quantity > 0),
        unit TEXT NOT NULL,
        equipment_id INTEGER,
        FOREIGN KEY(exit_request_id) REFERENCES exit_requests(id) ON DELETE CASCADE,
        FOREIGN KEY(equipment_id) REFERENCES equipment(id) ON DELETE SET NULL
    )',

    // external repairs
    'CREATE TABLE IF NOT EXISTS external_repairs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repair_no TEXT NOT NULL UNIQUE,
        unit_id INTEGER NOT NULL,
        report_date_shamsi TEXT NOT NULL,
        details TEXT,
        status TEXT NOT NULL DEFAULT "در حال تعمیر",
        reference_exit_request_id INTEGER,
        created_by INTEGER,
        FOREIGN KEY(unit_id) REFERENCES units(id) ON DELETE RESTRICT,
        FOREIGN KEY(reference_exit_request_id) REFERENCES exit_requests(id) ON DELETE SET NULL,
        FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
    )',

    'CREATE TABLE IF NOT EXISTS external_repair_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        external_repair_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        code TEXT,
        quantity REAL NOT NULL CHECK(quantity > 0),
        unit TEXT NOT NULL,
        equipment_id INTEGER,
        FOREIGN KEY(external_repair_id) REFERENCES external_repairs(id) ON DELETE CASCADE,
        FOREIGN KEY(equipment_id) REFERENCES equipment(id) ON DELETE SET NULL
    )',

    // entry confirmations
    'CREATE TABLE IF NOT EXISTS entry_confirmations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        confirmation_no TEXT NOT NULL UNIQUE,
        purchase_date_shamsi TEXT,
        purchase_center TEXT,
        purchase_request_code TEXT,
        buyer_name TEXT,
        driver_name TEXT,
        reference_exit_request_id INTEGER,
        reference_external_repair_id INTEGER,
        created_by INTEGER,
        FOREIGN KEY(reference_exit_request_id) REFERENCES exit_requests(id) ON DELETE SET NULL,
        FOREIGN KEY(reference_external_repair_id) REFERENCES external_repairs(id) ON DELETE SET NULL,
        FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
    )',

    'CREATE TABLE IF NOT EXISTS entry_confirmation_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_confirmation_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        code TEXT,
        quantity REAL NOT NULL CHECK(quantity > 0),
        unit TEXT NOT NULL,
        FOREIGN KEY(entry_confirmation_id) REFERENCES entry_confirmations(id) ON DELETE CASCADE
    )',

    // attachments
    'CREATE TABLE IF NOT EXISTS attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        created_at INTEGER NOT NULL
    )'
];

try {
    $db->beginTransaction();
    foreach ($dropTables as $table) {
        $db->exec("DROP TABLE IF EXISTS {$table}");
    }
    foreach ($schema as $sql) {
        $db->exec($sql);
    }
    $db->commit();
} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    json_response(['error' => 'راه‌اندازی دیتابیس با خطا مواجه شد: ' . $e->getMessage()], 500);
}

// seed admin user if not exists
$stmt = $db->prepare('SELECT id FROM users WHERE username = ?');
$stmt->execute(['admin']);
if (!$stmt->fetch()) {
    $hash = password_hash('admin123', PASSWORD_BCRYPT);
    $db->prepare('INSERT INTO users(username, password_hash, role) VALUES (?,?,?)')
        ->execute(['admin', $hash, 'manager']);
}

json_response(['message' => 'پایگاه‌داده با ساختار جدید راه‌اندازی شد.', 'db_file' => DB_FILE]);
