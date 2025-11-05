<?php
require_once __DIR__ . '/../db.php';

allow_cors();

$db = get_db();
$auth = require_auth();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function entry_confirm_exists(PDO $db, string $confirmNo): bool
{
    $stmt = $db->prepare('SELECT 1 FROM entry_confirms WHERE confirm_no = ? LIMIT 1');
    $stmt->execute([$confirmNo]);
    return (bool)$stmt->fetchColumn();
}

function find_form_id_by_no(PDO $db, string $table, string $formNo): ?int
{
    if ($formNo === '') {
        return null;
    }
    $field = $table === 'entry_confirms' ? 'confirm_no' : 'form_no';
    $stmt = $db->prepare("SELECT id FROM {$table} WHERE {$field} = ?");
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

        if ($search !== '') {
            $conditions[] = '(ec.confirm_no LIKE ? OR ec.purchase_center LIKE ? OR ec.purchase_request_code LIKE ?)';
            $like = "%{$search}%";
            $params = array_merge($params, [$like, $like, $like]);
        }

        if (($auth['user']['role'] ?? '') === 'unit') {
            // entry confirms are approvals for all units; no restriction defined previously
        }

        $where = $conditions ? ' WHERE ' . implode(' AND ', $conditions) : '';

        $countStmt = $db->prepare('SELECT COUNT(*) FROM entry_confirms ec' . $where);
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $listStmt = $db->prepare('SELECT ec.id, ec.confirm_no, ec.purchase_date_shamsi, ec.purchase_center, ec.purchase_request_code, ec.buyer_name, ec.driver_name,'
            . ' ec.reference_exit_form_id, ec.reference_repair_form_id, ec.created_by,'
            . ' ef.form_no AS reference_exit_form_no, rf.form_no AS reference_repair_form_no'
            . ' FROM entry_confirms ec'
            . ' LEFT JOIN exit_forms ef ON ef.id = ec.reference_exit_form_id'
            . ' LEFT JOIN repair_forms rf ON rf.id = ec.reference_repair_form_id'
            . $where . ' ORDER BY ec.id DESC LIMIT ? OFFSET ?');
        $listStmt->execute(array_merge($params, [$limit, $offset]));
        $entries = $listStmt->fetchAll();

        $itemsMap = [];
        if (!empty($entries)) {
            $ids = array_map('intval', array_column($entries, 'id'));
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $itemsStmt = $db->prepare('SELECT entry_confirm_id, description, code, quantity, unit FROM entry_items WHERE entry_confirm_id IN (' . $placeholders . ') ORDER BY id');
            $itemsStmt->execute($ids);
            foreach ($itemsStmt->fetchAll() as $item) {
                $entryId = (int)$item['entry_confirm_id'];
                $itemsMap[$entryId][] = [
                    'description' => $item['description'],
                    'code' => $item['code'],
                    'quantity' => (float)$item['quantity'],
                    'unit' => $item['unit'],
                ];
            }
        }

        foreach ($entries as &$entry) {
            $entryId = (int)$entry['id'];
            $entry['id'] = $entryId;
            $entry['created_by'] = $entry['created_by'] !== null ? (int)$entry['created_by'] : null;
            $entry['reference_exit_form_id'] = $entry['reference_exit_form_id'] !== null ? (int)$entry['reference_exit_form_id'] : null;
            $entry['reference_repair_form_id'] = $entry['reference_repair_form_id'] !== null ? (int)$entry['reference_repair_form_id'] : null;
            $entry['items'] = array_values($itemsMap[$entryId] ?? []);
        }
        unset($entry);

        json_response([
            'items' => $entries,
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
        ]);
    } elseif ($method === 'POST') {
        $user = $auth['user'];
        $body = get_json_input();

        $confirmNo = trim($body['confirm_no'] ?? '');
        $purchaseDateShamsi = trim($body['purchase_date_shamsi'] ?? '');
        $purchaseCenter = trim($body['purchase_center'] ?? '');
        $purchaseRequestCode = trim($body['purchase_request_code'] ?? '');
        $buyerName = trim($body['buyer_name'] ?? '');
        $driverName = trim($body['driver_name'] ?? '');
        $refExitNo = trim($body['reference_exit_form_no'] ?? '');
        $refRepairNo = trim($body['reference_repair_form_no'] ?? '');
        $items = $body['items'] ?? [];

        if ($confirmNo === '') {
            json_response(['error' => 'شماره تایید ورود الزامی است.'], 400);
        }

        if (!is_array($items) || count($items) < 1 || count($items) > 11) {
            json_response(['error' => 'تعداد ردیف‌ها باید بین ۱ تا ۱۱ باشد.'], 400);
        }

        foreach ($items as $idx => $item) {
            if (trim($item['description'] ?? '') === '' || trim($item['unit'] ?? '') === '') {
                json_response(['error' => "ردیف $idx نامعتبر است."], 400);
            }
            if (!isset($item['quantity']) || (float)$item['quantity'] <= 0) {
                json_response(['error' => 'مقدار باید بیشتر از صفر باشد.'], 400);
            }
        }

        if (entry_confirm_exists($db, $confirmNo)) {
            json_response(['error' => 'شماره تایید تکراری است.'], 409);
        }

        $referenceExitId = $refExitNo !== '' ? find_form_id_by_no($db, 'exit_forms', $refExitNo) : null;
        $referenceRepairId = $refRepairNo !== '' ? find_form_id_by_no($db, 'repair_forms', $refRepairNo) : null;

        $db->beginTransaction();
        try {
            $stmt = $db->prepare('INSERT INTO entry_confirms(confirm_no, purchase_date_shamsi, purchase_center, purchase_request_code, buyer_name, driver_name, reference_exit_form_id, reference_repair_form_id, created_by) VALUES (?,?,?,?,?,?,?,?,?)');
            $stmt->execute([
                $confirmNo,
                $purchaseDateShamsi,
                $purchaseCenter,
                $purchaseRequestCode,
                $buyerName,
                $driverName,
                $referenceExitId,
                $referenceRepairId,
                $user['id'],
            ]);
            $entryId = (int)$db->lastInsertId();

            $itemStmt = $db->prepare('INSERT INTO entry_items(entry_confirm_id, description, code, quantity, unit) VALUES (?,?,?,?,?)');
            foreach ($items as $item) {
                $itemStmt->execute([
                    $entryId,
                    trim($item['description']),
                    $item['code'] ?? null,
                    (float)$item['quantity'],
                    trim($item['unit']),
                ]);
            }

            $db->commit();
            json_response(['id' => $entryId], 201);
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
