<?php
// Initialize SQLite database with schema and seed admin
require_once __DIR__ . '/db.php';

allow_cors();

$db = get_db();

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

    // exit forms
    'CREATE TABLE IF NOT EXISTS exit_forms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_no TEXT NOT NULL UNIQUE,
        date_shamsi TEXT NOT NULL,
        out_type TEXT,
        driver_name TEXT,
        reason TEXT,
        unit_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT "در حال ارسال",
        created_by INTEGER NOT NULL,
        FOREIGN KEY(unit_id) REFERENCES units(id) ON DELETE RESTRICT,
        FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
    )',

    'CREATE TABLE IF NOT EXISTS exit_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exit_form_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        code TEXT,
        quantity REAL NOT NULL CHECK(quantity > 0),
        unit TEXT NOT NULL,
        equipment_id INTEGER,
        FOREIGN KEY(exit_form_id) REFERENCES exit_forms(id) ON DELETE CASCADE,
        FOREIGN KEY(equipment_id) REFERENCES equipment(id) ON DELETE SET NULL
    )',

    // repair forms
    'CREATE TABLE IF NOT EXISTS repair_forms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_no TEXT NOT NULL UNIQUE,
        unit_id INTEGER NOT NULL,
        date_shamsi TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT "در حال تعمیر",
        reference_exit_form_id INTEGER,
        created_by INTEGER NOT NULL,
        FOREIGN KEY(unit_id) REFERENCES units(id) ON DELETE RESTRICT,
        FOREIGN KEY(reference_exit_form_id) REFERENCES exit_forms(id) ON DELETE SET NULL,
        FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
    )',

    'CREATE TABLE IF NOT EXISTS repair_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repair_form_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        code TEXT,
        quantity REAL NOT NULL CHECK(quantity > 0),
        unit TEXT NOT NULL,
        equipment_id INTEGER,
        FOREIGN KEY(repair_form_id) REFERENCES repair_forms(id) ON DELETE CASCADE,
        FOREIGN KEY(equipment_id) REFERENCES equipment(id) ON DELETE SET NULL
    )',

    // entry confirms
    'CREATE TABLE IF NOT EXISTS entry_confirms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        confirm_no TEXT NOT NULL UNIQUE,
        purchase_date_shamsi TEXT,
        purchase_center TEXT,
        purchase_request_code TEXT,
        buyer_name TEXT,
        driver_name TEXT,
        reference_exit_form_id INTEGER,
        reference_repair_form_id INTEGER,
        created_by INTEGER NOT NULL,
        FOREIGN KEY(reference_exit_form_id) REFERENCES exit_forms(id) ON DELETE SET NULL,
        FOREIGN KEY(reference_repair_form_id) REFERENCES repair_forms(id) ON DELETE SET NULL,
        FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
    )',

    'CREATE TABLE IF NOT EXISTS entry_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_confirm_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        code TEXT,
        quantity REAL NOT NULL CHECK(quantity > 0),
        unit TEXT NOT NULL,
        FOREIGN KEY(entry_confirm_id) REFERENCES entry_confirms(id) ON DELETE CASCADE
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

$db->beginTransaction();
foreach ($schema as $sql) {
    $db->exec($sql);
}
$db->commit();

// seed admin user if not exists
$stmt = $db->prepare('SELECT id FROM users WHERE username = ?');
$stmt->execute(['admin']);
if (!$stmt->fetch()) {
    $hash = password_hash('admin123', PASSWORD_BCRYPT);
    $db->prepare('INSERT INTO users(username, password_hash, role) VALUES (?,?,?)')
        ->execute(['admin', $hash, 'manager']);
}

json_response(['message' => 'پایگاه‌داده راه‌اندازی شد.', 'db_file' => DB_FILE]);
