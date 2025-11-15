<?php
require_once __DIR__ . '/../db.php';

allow_cors();

$db = get_db();
$auth = require_auth();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function build_conditions(array $auth, string $alias, string $search): array
{
    $conditions = [];
    $params = [];

    if (($auth['user']['role'] ?? '') === 'unit' && $auth['user']['unit_id'] !== null) {
        $conditions[] = sprintf('%s.unit_id = ?', $alias);
        $params[] = (int)$auth['user']['unit_id'];
    }

    if ($search !== '') {
        $conditions[] = sprintf('(%1$s.form_no LIKE ? OR %1$s.date_shamsi LIKE ? OR %1$s.status LIKE ?)', $alias);
        $like = "%{$search}%";
        $params = array_merge($params, [$like, $like, $like]);
    }

    $where = $conditions ? ' WHERE ' . implode(' AND ', $conditions) : '';
    return [$where, $params];
}

function status_breakdown(PDO $db, string $fromClause, string $where, array $params): array
{
    if ($where === '') {
        $sql = "SELECT status, COUNT(*) AS count FROM {$fromClause} GROUP BY status";
        $stmt = $db->query($sql);
    } else {
        $sql = "SELECT status, COUNT(*) AS count FROM {$fromClause} {$where} GROUP BY status";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
    }

    $result = [];
    foreach ($stmt->fetchAll() as $row) {
        $status = $row['status'] !== null && $row['status'] !== '' ? $row['status'] : 'نامعلوم';
        $result[$status] = (int)$row['count'];
    }
    return $result;
}

try {
    if ($method === 'GET') {
        $mode = strtolower(trim($_GET['mode'] ?? ''));

        if ($mode === 'search') {
            $term = trim($_GET['search'] ?? ($_GET['q'] ?? ''));
            if ($term === '') {
                json_response(['results' => [], 'search' => $term]);
            }
            $like = "%{$term}%";

            $results = [];

            $exitSql = 'SELECT "exit" AS type, id, form_no AS no, date_shamsi AS date FROM exit_forms WHERE form_no LIKE ?';
            $exitParams = [$like];
            if (($auth['user']['role'] ?? '') === 'unit' && $auth['user']['unit_id'] !== null) {
                $exitSql .= ' AND unit_id = ?';
                $exitParams[] = (int)$auth['user']['unit_id'];
            }
            $exitStmt = $db->prepare($exitSql);
            $exitStmt->execute($exitParams);
            foreach ($exitStmt->fetchAll() as $row) {
                $row['id'] = (int)$row['id'];
                $results[] = $row;
            }

            $repairSql = 'SELECT "repair" AS type, id, form_no AS no, date_shamsi AS date FROM repair_forms WHERE form_no LIKE ?';
            $repairParams = [$like];
            if (($auth['user']['role'] ?? '') === 'unit' && $auth['user']['unit_id'] !== null) {
                $repairSql .= ' AND unit_id = ?';
                $repairParams[] = (int)$auth['user']['unit_id'];
            }
            $repairStmt = $db->prepare($repairSql);
            $repairStmt->execute($repairParams);
            foreach ($repairStmt->fetchAll() as $row) {
                $row['id'] = (int)$row['id'];
                $results[] = $row;
            }

            json_response(['results' => $results, 'search' => $term]);
        }

        if ($mode === 'statuses') {
            $items = [];
            $unitClause = '';
            $unitParams = [];
            if (($auth['user']['role'] ?? '') === 'unit' && $auth['user']['unit_id'] !== null) {
                $unitClause = ' WHERE unit_id = ?';
                $unitParams = [(int)$auth['user']['unit_id']];
            }

            $exitStmt = $db->prepare('SELECT id, form_no, date_shamsi, status FROM exit_forms' . $unitClause . ' ORDER BY id DESC');
            $exitStmt->execute($unitParams);
            foreach ($exitStmt->fetchAll() as $row) {
                $items[] = [
                    'type' => 'exit',
                    'no' => $row['form_no'],
                    'date' => $row['date_shamsi'],
                    'status' => $row['status'] !== null && $row['status'] !== '' ? $row['status'] : 'نامعلوم',
                ];
            }

            $repairStmt = $db->prepare('SELECT id, form_no, date_shamsi, status FROM repair_forms' . $unitClause . ' ORDER BY id DESC');
            $repairStmt->execute($unitParams);
            foreach ($repairStmt->fetchAll() as $row) {
                $items[] = [
                    'type' => 'repair',
                    'no' => $row['form_no'],
                    'date' => $row['date_shamsi'],
                    'status' => $row['status'] !== null && $row['status'] !== '' ? $row['status'] : 'نامعلوم',
                ];
            }

            json_response(['items' => $items]);
        }

        if ($mode === 'recent') {
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            $limit = max(1, min(50, $limit));

            $unitClause = '';
            $unitParams = [];
            if (($auth['user']['role'] ?? '') === 'unit' && $auth['user']['unit_id'] !== null) {
                $unitClause = ' WHERE unit_id = ?';
                $unitParams = [(int)$auth['user']['unit_id']];
            }

            $exitStmt = $db->prepare('SELECT id, form_no, date_shamsi, status FROM exit_forms' . $unitClause . ' ORDER BY id DESC LIMIT ?');
            $exitStmt->execute(array_merge($unitParams, [$limit]));
            $exitRows = $exitStmt->fetchAll();

            $repairStmt = $db->prepare('SELECT id, form_no, date_shamsi, status FROM repair_forms' . $unitClause . ' ORDER BY id DESC LIMIT ?');
            $repairStmt->execute(array_merge($unitParams, [$limit]));
            $repairRows = $repairStmt->fetchAll();

            json_response([
                'limit' => $limit,
                'exit' => $exitRows,
                'repair' => $repairRows,
            ]);
        }

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = (int)($_GET['limit'] ?? 20);
        $limit = max(1, min(100, $limit));
        $offset = ($page - 1) * $limit;
        $search = trim($_GET['search'] ?? '');
        $typeFilter = strtolower(trim($_GET['type'] ?? ''));

        $includeExit = $typeFilter === '' || $typeFilter === 'exit' || $typeFilter === 'all';
        $includeRepair = $typeFilter === '' || $typeFilter === 'repair' || $typeFilter === 'all';

        $exitWhere = '';
        $exitParams = [];
        $repairWhere = '';
        $repairParams = [];

        if ($includeExit) {
            [$exitWhere, $exitParams] = build_conditions($auth, 'ef', $search);
        }
        if ($includeRepair) {
            [$repairWhere, $repairParams] = build_conditions($auth, 'rf', $search);
        }

        $total = 0;
        if ($includeExit) {
            if ($exitWhere === '') {
                $total += (int)$db->query('SELECT COUNT(*) FROM exit_forms')->fetchColumn();
            } else {
                $stmt = $db->prepare('SELECT COUNT(*) FROM exit_forms ef' . $exitWhere);
                $stmt->execute($exitParams);
                $total += (int)$stmt->fetchColumn();
            }
        }
        if ($includeRepair) {
            if ($repairWhere === '') {
                $total += (int)$db->query('SELECT COUNT(*) FROM repair_forms')->fetchColumn();
            } else {
                $stmt = $db->prepare('SELECT COUNT(*) FROM repair_forms rf' . $repairWhere);
                $stmt->execute($repairParams);
                $total += (int)$stmt->fetchColumn();
            }
        }

        $selects = [];
        $selectParams = [];

        if ($includeExit) {
            $selects[] = 'SELECT "exit" AS type, ef.id, ef.form_no, ef.date_shamsi, ef.status FROM exit_forms ef' . $exitWhere;
            $selectParams = array_merge($selectParams, $exitParams);
        }

        if ($includeRepair) {
            $selects[] = 'SELECT "repair" AS type, rf.id, rf.form_no, rf.date_shamsi, rf.status FROM repair_forms rf' . $repairWhere;
            $selectParams = array_merge($selectParams, $repairParams);
        }

        $items = [];
        if (!empty($selects)) {
            $unionSql = implode(' UNION ALL ', $selects) . ' ORDER BY date_shamsi DESC, id DESC LIMIT ? OFFSET ?';
            $stmt = $db->prepare($unionSql);
            $stmt->execute(array_merge($selectParams, [$limit, $offset]));
            $items = $stmt->fetchAll();
        }

        foreach ($items as &$item) {
            $item['id'] = (int)$item['id'];
            $item['no'] = $item['form_no'];
            $item['date'] = $item['date_shamsi'];
            $item['status'] = $item['status'] !== null && $item['status'] !== '' ? $item['status'] : 'نامعلوم';
        }
        unset($item);

        $summary = [];
        if ($includeExit) {
            $summary['exit'] = status_breakdown($db, 'exit_forms ef', $exitWhere, $exitParams);
        }
        if ($includeRepair) {
            $summary['repair'] = status_breakdown($db, 'repair_forms rf', $repairWhere, $repairParams);
        }

        $totalPages = (int)ceil($total / $limit);

        json_response([
            'items' => $items,
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'total_pages' => $totalPages,
            'summary' => $summary,
        ]);
    } elseif ($method === 'POST') {
        $user = $auth['user'];
        $body = get_json_input();

        $entity = $body['entity'] ?? '';
        $formNo = trim($body['no'] ?? '');
        $status = trim($body['status'] ?? '');

        if ($entity === '' || $formNo === '' || $status === '') {
            json_response(['error' => 'پارامترهای نامعتبر'], 400);
        }

        if ($entity === 'repair') {
            if (!in_array($user['role'], ['workshop', 'manager'], true)) {
                json_response(['error' => 'دسترسی ندارید.'], 403);
            }
            $stmt = $db->prepare('UPDATE repair_forms SET status = ? WHERE form_no = ?');
            $stmt->execute([$status, $formNo]);
            if ($stmt->rowCount() < 1) {
                json_response(['error' => 'فرم مورد نظر یافت نشد.'], 404);
            }
            json_response(['ok' => true]);
        } elseif ($entity === 'exit') {
            if (!in_array($user['role'], ['storekeeper', 'manager'], true)) {
                json_response(['error' => 'دسترسی ندارید.'], 403);
            }
            $stmt = $db->prepare('UPDATE exit_forms SET status = ? WHERE form_no = ?');
            $stmt->execute([$status, $formNo]);
            if ($stmt->rowCount() < 1) {
                json_response(['error' => 'فرم مورد نظر یافت نشد.'], 404);
            }
            json_response(['ok' => true]);
        } else {
            json_response(['error' => 'نوع ناشناخته'], 400);
        }
    } else {
        json_response(['error' => 'متد مجاز نیست.'], 405);
    }
} catch (Throwable $e) {
    json_response(['error' => 'خطای داخلی سرور', 'details' => $e->getMessage()], 500);
}
