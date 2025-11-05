<?php
require_once __DIR__ . '/../db.php';

allow_cors();

$db = get_db();
$auth = require_auth();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function exit_form_exists(PDO $db, string $formNo): bool
{
    $stmt = $db->prepare('SELECT 1 FROM exit_forms WHERE form_no = ? LIMIT 1');
    $stmt->execute([$formNo]);
    return (bool)$stmt->fetchColumn();
}

try {
    if ($method === 'GET') {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = (int)($_GET['limit'] ?? 20);
        $limit = max(1, min(100, $limit));
        $offset = ($page - 1) * $limit;
        $search = trim($_GET['search'] ?? '');

        $conditions = [];
        $params = [];

        if (($auth['user']['role'] ?? '') === 'unit' && $auth['user']['unit_id'] !== null) {
            $conditions[] = 'unit_id = ?';
            $params[] = (int)$auth['user']['unit_id'];
        }

        if ($search !== '') {
            $conditions[] = '(form_no LIKE ? OR driver_name LIKE ? OR reason LIKE ?)';
            $like = "%{$search}%";
            $params = array_merge($params, [$like, $like, $like]);
        }

        $where = $conditions ? ' WHERE ' . implode(' AND ', $conditions) : '';

        $countStmt = $db->prepare('SELECT COUNT(*) FROM exit_forms' . $where);
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $listStmt = $db->prepare('SELECT id, form_no, date_shamsi, out_type, driver_name, reason, unit_id, status, created_by FROM exit_forms'
            . $where . ' ORDER BY id DESC LIMIT ? OFFSET ?');
        $listStmt->execute(array_merge($params, [$limit, $offset]));
        $forms = $listStmt->fetchAll();

        $itemsMap = [];
        if (!empty($forms)) {
            $ids = array_map('intval', array_column($forms, 'id'));
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $itemsStmt = $db->prepare('SELECT exit_form_id, description, code, quantity, unit, equipment_id FROM exit_items WHERE exit_form_id IN (' . $placeholders . ') ORDER BY id');
            $itemsStmt->execute($ids);
            foreach ($itemsStmt->fetchAll() as $item) {
                $formId = (int)$item['exit_form_id'];
                $itemsMap[$formId][] = [
                    'description' => $item['description'],
                    'code' => $item['code'],
                    'quantity' => (float)$item['quantity'],
                    'unit' => $item['unit'],
                    'equipment_id' => $item['equipment_id'] !== null ? (int)$item['equipment_id'] : null,
                ];
            }
        }

        foreach ($forms as &$form) {
            $formId = (int)$form['id'];
            $form['id'] = $formId;
            $form['unit_id'] = $form['unit_id'] !== null ? (int)$form['unit_id'] : null;
            $form['created_by'] = $form['created_by'] !== null ? (int)$form['created_by'] : null;
            $form['items'] = array_values($itemsMap[$formId] ?? []);
        }
        unset($form);

        json_response([
            'items' => $forms,
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
        ]);
    } elseif ($method === 'POST') {
        $user = $auth['user'];
        $body = get_json_input();

        $formNo = trim($body['form_no'] ?? '');
        $dateShamsi = trim($body['date_shamsi'] ?? '');
        $outType = trim($body['out_type'] ?? '');
        $driverName = trim($body['driver_name'] ?? '');
        $reason = trim($body['reason'] ?? '');
        $unitId = isset($body['unit_id']) ? (int)$body['unit_id'] : 0;
        $items = $body['items'] ?? [];

        if ($formNo === '' || $dateShamsi === '' || $unitId <= 0) {
            json_response(['error' => 'فیلدهای اجباری خالی است.'], 400);
        }

        if (!is_array($items) || count($items) < 1 || count($items) > 5) {
            json_response(['error' => 'تعداد ردیف‌ها باید بین ۱ تا ۵ باشد.'], 400);
        }

        if ($user['role'] === 'unit' && $user['unit_id'] !== $unitId) {
            json_response(['error' => 'دسترسی به این واحد مجاز نیست.'], 403);
        }

        foreach ($items as $idx => $item) {
            if (trim($item['description'] ?? '') === '' || trim($item['unit'] ?? '') === '') {
                json_response(['error' => "ردیف $idx نامعتبر است."], 400);
            }
            if (!isset($item['quantity']) || (float)$item['quantity'] <= 0) {
                json_response(['error' => 'مقدار باید بیشتر از صفر باشد.'], 400);
            }
        }

        if (exit_form_exists($db, $formNo)) {
            json_response(['error' => 'شماره فرم تکراری است.'], 409);
        }

        $db->beginTransaction();
        try {
            $insertForm = $db->prepare('INSERT INTO exit_forms(form_no, date_shamsi, out_type, driver_name, reason, unit_id, created_by) VALUES (?,?,?,?,?,?,?)');
            $insertForm->execute([$formNo, $dateShamsi, $outType, $driverName, $reason, $unitId, $user['id']]);
            $formId = (int)$db->lastInsertId();

            $insertItem = $db->prepare('INSERT INTO exit_items(exit_form_id, description, code, quantity, unit, equipment_id) VALUES (?,?,?,?,?,?)');
            foreach ($items as $item) {
                $insertItem->execute([
                    $formId,
                    trim($item['description']),
                    $item['code'] ?? null,
                    (float)$item['quantity'],
                    trim($item['unit']),
                    $item['equipment_id'] ?? null,
                ]);
            }

            $db->commit();
            json_response(['id' => $formId], 201);
        } catch (Throwable $e) {
            $db->rollBack();
            throw $e;
        }
    } else {
        json_response(['error' => 'متد مجاز نیست.'], 405);
    }
} catch (Throwable $e) {
    json_response(['error' => 'خطای داخلی سرور', 'details' => $e->getMessage()], 500);
}
