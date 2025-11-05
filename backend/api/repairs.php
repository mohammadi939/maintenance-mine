<?php
require_once __DIR__ . '/../db.php';

allow_cors();

$db = get_db();
$auth = require_auth();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function repair_form_exists(PDO $db, string $formNo): bool
{
    $stmt = $db->prepare('SELECT 1 FROM repair_forms WHERE form_no = ? LIMIT 1');
    $stmt->execute([$formNo]);
    return (bool)$stmt->fetchColumn();
}

function find_exit_form_id(PDO $db, string $formNo): ?int
{
    $stmt = $db->prepare('SELECT id FROM exit_forms WHERE form_no = ?');
    $stmt->execute([$formNo]);
    $row = $stmt->fetch();
    return $row ? (int)$row['id'] : null;
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
            $conditions[] = 'rf.unit_id = ?';
            $params[] = (int)$auth['user']['unit_id'];
        }

        if ($search !== '') {
            $conditions[] = '(rf.form_no LIKE ? OR rf.description LIKE ?)';
            $like = "%{$search}%";
            $params = array_merge($params, [$like, $like]);
        }

        $where = $conditions ? ' WHERE ' . implode(' AND ', $conditions) : '';

        $countStmt = $db->prepare('SELECT COUNT(*) FROM repair_forms rf' . $where);
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $listStmt = $db->prepare('SELECT rf.id, rf.form_no, rf.unit_id, rf.date_shamsi, rf.description, rf.status, rf.reference_exit_form_id, rf.created_by, ef.form_no AS reference_exit_form_no'
            . ' FROM repair_forms rf LEFT JOIN exit_forms ef ON ef.id = rf.reference_exit_form_id'
            . $where . ' ORDER BY rf.id DESC LIMIT ? OFFSET ?');
        $listStmt->execute(array_merge($params, [$limit, $offset]));
        $forms = $listStmt->fetchAll();

        $itemsMap = [];
        if (!empty($forms)) {
            $ids = array_map('intval', array_column($forms, 'id'));
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $itemsStmt = $db->prepare('SELECT repair_form_id, description, code, quantity, unit, equipment_id FROM repair_items WHERE repair_form_id IN (' . $placeholders . ') ORDER BY id');
            $itemsStmt->execute($ids);
            foreach ($itemsStmt->fetchAll() as $item) {
                $formId = (int)$item['repair_form_id'];
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
            $form['reference_exit_form_id'] = $form['reference_exit_form_id'] !== null ? (int)$form['reference_exit_form_id'] : null;
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
        $unitId = isset($body['unit_id']) ? (int)$body['unit_id'] : 0;
        $dateShamsi = trim($body['date_shamsi'] ?? '');
        $description = trim($body['description'] ?? '');
        $referenceExitFormNo = trim($body['reference_exit_form_no'] ?? '');
        $items = $body['items'] ?? [];

        if ($formNo === '' || $unitId <= 0 || $dateShamsi === '') {
            json_response(['error' => 'فیلدهای اجباری خالی است.'], 400);
        }

        if ($user['role'] === 'unit' && $user['unit_id'] !== $unitId) {
            json_response(['error' => 'دسترسی به این واحد مجاز نیست.'], 403);
        }

        if (!is_array($items)) {
            json_response(['error' => 'ساختار اقلام نامعتبر است.'], 400);
        }

        foreach ($items as $idx => $item) {
            if (trim($item['description'] ?? '') === '' || trim($item['unit'] ?? '') === '') {
                json_response(['error' => "ردیف $idx نامعتبر است."], 400);
            }
            if (!isset($item['quantity']) || (float)$item['quantity'] <= 0) {
                json_response(['error' => 'مقدار باید بیشتر از صفر باشد.'], 400);
            }
        }

        if (repair_form_exists($db, $formNo)) {
            json_response(['error' => 'شماره فرم تعمیر تکراری است.'], 409);
        }

        $referenceExitId = null;
        if ($referenceExitFormNo !== '') {
            $referenceExitId = find_exit_form_id($db, $referenceExitFormNo);
        }

        $db->beginTransaction();
        try {
            $stmt = $db->prepare('INSERT INTO repair_forms(form_no, unit_id, date_shamsi, description, reference_exit_form_id, created_by) VALUES (?,?,?,?,?,?)');
            $stmt->execute([$formNo, $unitId, $dateShamsi, $description, $referenceExitId, $user['id']]);
            $formId = (int)$db->lastInsertId();

            if (!empty($items)) {
                $itemStmt = $db->prepare('INSERT INTO repair_items(repair_form_id, description, code, quantity, unit, equipment_id) VALUES (?,?,?,?,?,?)');
                foreach ($items as $item) {
                    $itemStmt->execute([
                        $formId,
                        trim($item['description']),
                        $item['code'] ?? null,
                        (float)$item['quantity'],
                        trim($item['unit']),
                        $item['equipment_id'] ?? null,
                    ]);
                }
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
