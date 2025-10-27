<?php
require_once __DIR__ . '/db.php';

allow_cors();
$db = get_db();
$action = $_GET['action'] ?? '';

function unique_form_no_exists(PDO $db, string $table, string $field, string $value): bool {
    $stmt = $db->prepare("SELECT 1 FROM {$table} WHERE {$field} = ? LIMIT 1");
    $stmt->execute([$value]);
    return (bool)$stmt->fetchColumn();
}

switch ($action) {
    case 'login':
        $body = get_json_input();
        $username = trim($body['username'] ?? '');
        $password = $body['password'] ?? '';
        if ($username === '' || $password === '') {
            json_response(['error' => 'نام کاربری یا رمز عبور خالی است.'], 400);
        }
        $stmt = $db->prepare('SELECT * FROM users WHERE username = ?');
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        if (!$user || !password_verify($password, $user['password_hash'])) {
            json_response(['error' => 'نام کاربری یا رمز عبور نادرست است.'], 401);
        }
        $token = bin2hex(random_bytes(24));
        $expires = time() + 24 * 3600;
        $db->prepare('INSERT INTO tokens(token, user_id, expires_at) VALUES (?,?,?)')
            ->execute([$token, $user['id'], $expires]);
        json_response(['token' => $token, 'expires_at' => $expires]);
        break;

    case 'me':
        $auth = require_auth();
        json_response(['user' => $auth['user']]);
        break;

    case 'create_exit_form':
        $auth = require_auth();
        $user = $auth['user'];
        $body = get_json_input();
        $form_no = trim($body['form_no'] ?? '');
        $date_shamsi = trim($body['date_shamsi'] ?? '');
        $out_type = trim($body['out_type'] ?? '');
        $driver_name = trim($body['driver_name'] ?? '');
        $reason = trim($body['reason'] ?? '');
        $unit_id = (int)($body['unit_id'] ?? 0);
        $items = $body['items'] ?? [];

        if ($form_no === '' || $date_shamsi === '' || $unit_id <= 0) {
            json_response(['error' => 'فیلدهای اجباری خالی است.'], 400);
        }
        if (unique_form_no_exists($db, 'exit_forms', 'form_no', $form_no)) {
            json_response(['error' => 'شماره فرم تکراری است.'], 409);
        }
        if (!is_array($items) || count($items) < 1 || count($items) > 5) {
            json_response(['error' => 'تعداد ردیف‌ها باید بین ۱ تا ۵ باشد.'], 400);
        }
        // unit role restriction: unit can only create for own unit
        if ($user['role'] === 'unit' && $user['unit_id'] !== $unit_id) {
            json_response(['error' => 'دسترسی به این واحد مجاز نیست.'], 403);
        }

        foreach ($items as $idx => $it) {
            if (trim($it['description'] ?? '') === '' || trim($it['unit'] ?? '') === '') {
                json_response(['error' => "ردیف $idx نامعتبر است."], 400);
            }
            if (!isset($it['quantity']) || $it['quantity'] <= 0) {
                json_response(['error' => 'مقدار باید > 0 باشد.'], 400);
            }
        }

        $db->beginTransaction();
        $db->prepare('INSERT INTO exit_forms(form_no, date_shamsi, out_type, driver_name, reason, unit_id, created_by) VALUES (?,?,?,?,?,?,?)')
            ->execute([$form_no, $date_shamsi, $out_type, $driver_name, $reason, $unit_id, $user['id']]);
        $exit_form_id = (int)$db->lastInsertId();
        $stmtItem = $db->prepare('INSERT INTO exit_items(exit_form_id, description, code, quantity, unit, equipment_id) VALUES (?,?,?,?,?,?)');
        foreach ($items as $it) {
            $stmtItem->execute([$exit_form_id, trim($it['description']), $it['code'] ?? null, (float)$it['quantity'], trim($it['unit']), $it['equipment_id'] ?? null]);
        }
        $db->commit();

        json_response(['id' => $exit_form_id]);
        break;

    case 'create_repair_form':
        $auth = require_auth();
        $user = $auth['user'];
        $body = get_json_input();
        $form_no = trim($body['form_no'] ?? '');
        $unit_id = (int)($body['unit_id'] ?? 0);
        $date_shamsi = trim($body['date_shamsi'] ?? '');
        $description = trim($body['description'] ?? '');
        $reference_exit_form_no = trim($body['reference_exit_form_no'] ?? '');
        $items = $body['items'] ?? [];
        if ($form_no === '' || $unit_id <= 0 || $date_shamsi === '') {
            json_response(['error' => 'فیلدهای اجباری خالی است.'], 400);
        }
        if (unique_form_no_exists($db, 'repair_forms', 'form_no', $form_no)) {
            json_response(['error' => 'شماره فرم تعمیر تکراری است.'], 409);
        }
        if ($user['role'] === 'unit' && $user['unit_id'] !== $unit_id) {
            json_response(['error' => 'دسترسی به این واحد مجاز نیست.'], 403);
        }
        $exit_id = null;
        if ($reference_exit_form_no !== '') {
            $q = $db->prepare('SELECT id FROM exit_forms WHERE form_no = ?');
            $q->execute([$reference_exit_form_no]);
            $row = $q->fetch();
            if ($row) { $exit_id = (int)$row['id']; }
        }
        foreach ($items as $idx => $it) {
            if (trim($it['description'] ?? '') === '' || trim($it['unit'] ?? '') === '') {
                json_response(['error' => "ردیف $idx نامعتبر است."], 400);
            }
            if (!isset($it['quantity']) || $it['quantity'] <= 0) {
                json_response(['error' => 'مقدار باید > 0 باشد.'], 400);
            }
        }
        $db->beginTransaction();
        $db->prepare('INSERT INTO repair_forms(form_no, unit_id, date_shamsi, description, reference_exit_form_id, created_by) VALUES (?,?,?,?,?,?)')
            ->execute([$form_no, $unit_id, $date_shamsi, $description, $exit_id, $user['id']]);
        $repair_id = (int)$db->lastInsertId();
        if (is_array($items) && count($items) > 0) {
            $stmtItem = $db->prepare('INSERT INTO repair_items(repair_form_id, description, code, quantity, unit, equipment_id) VALUES (?,?,?,?,?,?)');
            foreach ($items as $it) {
                $stmtItem->execute([$repair_id, trim($it['description']), $it['code'] ?? null, (float)$it['quantity'], trim($it['unit']), $it['equipment_id'] ?? null]);
            }
        }
        $db->commit();
        json_response(['id' => $repair_id]);
        break;

    case 'create_entry_confirm':
        $auth = require_auth();
        $user = $auth['user'];
        $body = get_json_input();
        $confirm_no = trim($body['confirm_no'] ?? '');
        $purchase_date_shamsi = trim($body['purchase_date_shamsi'] ?? '');
        $purchase_center = trim($body['purchase_center'] ?? '');
        $purchase_request_code = trim($body['purchase_request_code'] ?? '');
        $buyer_name = trim($body['buyer_name'] ?? '');
        $driver_name = trim($body['driver_name'] ?? '');
        $ref_exit_no = trim($body['reference_exit_form_no'] ?? '');
        $ref_repair_no = trim($body['reference_repair_form_no'] ?? '');
        $items = $body['items'] ?? [];

        if ($confirm_no === '') {
            json_response(['error' => 'شماره تایید ورود الزامی است.'], 400);
        }
        if (unique_form_no_exists($db, 'entry_confirms', 'confirm_no', $confirm_no)) {
            json_response(['error' => 'شماره تایید تکراری است.'], 409);
        }
        if (!is_array($items) || count($items) < 1 || count($items) > 11) {
            json_response(['error' => 'تعداد ردیف‌ها باید بین ۱ تا ۱۱ باشد.'], 400);
        }
        foreach ($items as $idx => $it) {
            if (trim($it['description'] ?? '') === '' || trim($it['unit'] ?? '') === '') {
                json_response(['error' => "ردیف $idx نامعتبر است."], 400);
            }
            if (!isset($it['quantity']) || $it['quantity'] <= 0) {
                json_response(['error' => 'مقدار باید > 0 باشد.'], 400);
            }
        }
        $exit_id = null; $repair_id = null;
        if ($ref_exit_no !== '') {
            $q = $db->prepare('SELECT id FROM exit_forms WHERE form_no = ?');
            $q->execute([$ref_exit_no]);
            $r = $q->fetch(); if ($r) { $exit_id = (int)$r['id']; }
        }
        if ($ref_repair_no !== '') {
            $q = $db->prepare('SELECT id FROM repair_forms WHERE form_no = ?');
            $q->execute([$ref_repair_no]);
            $r = $q->fetch(); if ($r) { $repair_id = (int)$r['id']; }
        }

        $db->beginTransaction();
        $db->prepare('INSERT INTO entry_confirms(confirm_no, purchase_date_shamsi, purchase_center, purchase_request_code, buyer_name, driver_name, reference_exit_form_id, reference_repair_form_id, created_by) VALUES (?,?,?,?,?,?,?,?,?)')
            ->execute([$confirm_no, $purchase_date_shamsi, $purchase_center, $purchase_request_code, $buyer_name, $driver_name, $exit_id, $repair_id, $user['id']]);
        $entry_id = (int)$db->lastInsertId();
        $stmtItem = $db->prepare('INSERT INTO entry_items(entry_confirm_id, description, code, quantity, unit) VALUES (?,?,?,?,?)');
        foreach ($items as $it) {
            $stmtItem->execute([$entry_id, trim($it['description']), $it['code'] ?? null, (float)$it['quantity'], trim($it['unit'])]);
        }
        $db->commit();

        json_response(['id' => $entry_id]);
        break;

    case 'search_forms':
        $auth = require_auth();
        $q = trim($_GET['q'] ?? '');
        if ($q === '') { json_response(['results' => []]); }
        // role/unit filter for exit and repair only (entry is a confirm)
        $params = ["%$q%", "%$q%"];
        $sqlExit = 'SELECT "exit" as type, id, form_no as no, date_shamsi as date FROM exit_forms WHERE form_no LIKE ?';
        $sqlRepair = 'SELECT "repair" as type, id, form_no as no, date_shamsi as date FROM repair_forms WHERE form_no LIKE ?';
        // Apply unit filter for role unit
        if (isset($auth['user']['role']) && $auth['user']['role'] === 'unit') {
            $sqlExit .= ' AND unit_id = ' . (int)$auth['user']['unit_id'];
            $sqlRepair .= ' AND unit_id = ' . (int)$auth['user']['unit_id'];
        }
        $rows = [];
        foreach ([[$sqlExit, [$params[0]]], [$sqlRepair, [$params[1]]]] as $pair) {
            $stmt = $db->prepare($pair[0]);
            $stmt->execute($pair[1]);
            $rows = array_merge($rows, $stmt->fetchAll());
        }
        json_response(['results' => $rows]);
        break;

    case 'list_statuses':
        // Aggregated statuses for board
        $auth = require_auth();
        $conditionsExit = '';
        $conditionsRepair = '';
        if ($auth['user']['role'] === 'unit') {
            $unitId = (int)$auth['user']['unit_id'];
            $conditionsExit = ' WHERE unit_id = ' . $unitId;
            $conditionsRepair = ' WHERE unit_id = ' . $unitId;
        }
        $exitRows = $db->query('SELECT id, form_no, date_shamsi, status FROM exit_forms' . $conditionsExit)->fetchAll();
        $repairRows = $db->query('SELECT id, form_no, date_shamsi, status FROM repair_forms' . $conditionsRepair)->fetchAll();
        // map to common structure
        $items = [];
        foreach ($exitRows as $r) {
            $items[] = ['type' => 'exit', 'no' => $r['form_no'], 'date' => $r['date_shamsi'], 'status' => $r['status'] ?: 'نامعلوم'];
        }
        foreach ($repairRows as $r) {
            $items[] = ['type' => 'repair', 'no' => $r['form_no'], 'date' => $r['date_shamsi'], 'status' => $r['status'] ?: 'نامعلوم'];
        }
        json_response(['items' => $items]);
        break;

    case 'update_status':
        // workshop can update repair status; manager can update both
        $auth = require_auth();
        $user = $auth['user'];
        $body = get_json_input();
        $entity = $body['entity'] ?? '';
        $no = trim($body['no'] ?? '');
        $status = trim($body['status'] ?? '');
        if ($entity === '' || $no === '' || $status === '') {
            json_response(['error' => 'پارامترهای نامعتبر'], 400);
        }
        if ($entity === 'repair') {
            if (!in_array($user['role'], ['workshop','manager'], true)) {
                json_response(['error' => 'دسترسی ندارید.'], 403);
            }
            $stmt = $db->prepare('UPDATE repair_forms SET status = ? WHERE form_no = ?');
            $stmt->execute([$status, $no]);
            json_response(['ok' => true]);
        } elseif ($entity === 'exit') {
            if (!in_array($user['role'], ['storekeeper','manager'], true)) {
                json_response(['error' => 'دسترسی ندارید.'], 403);
            }
            $stmt = $db->prepare('UPDATE exit_forms SET status = ? WHERE form_no = ?');
            $stmt->execute([$status, $no]);
            json_response(['ok' => true]);
        } else {
            json_response(['error' => 'نوع ناشناخته'], 400);
        }
        break;

    case 'recent_forms':
        $auth = require_auth();
        $limit = isset($_GET['limit']) ? max(1, min(50, (int)$_GET['limit'])) : 10;
        $exitWhere = '';
        $repairWhere = '';
        if ($auth['user']['role'] === 'unit') {
            $unitId = (int)$auth['user']['unit_id'];
            $exitWhere = ' WHERE unit_id = ' . $unitId;
            $repairWhere = ' WHERE unit_id = ' . $unitId;
        }
        $exit = $db->query('SELECT id, form_no, date_shamsi, status FROM exit_forms' . $exitWhere . ' ORDER BY id DESC LIMIT ' . $limit)->fetchAll();
        $repair = $db->query('SELECT id, form_no, date_shamsi, status FROM repair_forms' . $repairWhere . ' ORDER BY id DESC LIMIT ' . $limit)->fetchAll();
        json_response(['exit' => $exit, 'repair' => $repair]);
        break;

    case 'list_units':
        $auth = require_auth();
        $rows = $db->query('SELECT id, name FROM units ORDER BY name')->fetchAll();
        json_response(['units' => $rows]);
        break;

    default:
        json_response(['error' => 'اقدام ناشناخته'], 404);
}
