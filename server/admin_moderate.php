<?php
require 'db.php';
require 'utils.php';

$user = require_role('admin');
$actor_user_id = $user['id'];

$input = json_decode(file_get_contents("php://input"), true);

$qr_id = isset($input['qr_id']) ? (int) $input['qr_id'] : 0;
$action = $input['action'] ?? ''; // ban | activate | approve | clear_flag | flag | approve_request | deny_request
$flag_reason = $input['flag_reason'] ?? null;
// $actor_user_id from input is ignored (security fix)

if ($qr_id <= 0 || $action === '') {
	http_response_code(400);
	echo json_encode(["error" => "Missing qr_id or action"]);
	exit();
}

try {
	if ($action === 'ban') {
		$stmt = $conn->prepare(
			"UPDATE qr_codes
			 SET status = 'banned', reviewed_by = :rid, reviewed_at = NOW()
			 WHERE id = :id"
		);
		$stmt->execute([':rid' => $actor_user_id, ':id' => $qr_id]);
		audit_log($conn, $actor_user_id, 'qr_ban', 'qr_code', $qr_id);

	} elseif ($action === 'activate') {
		$stmt = $conn->prepare(
			"UPDATE qr_codes
			 SET status = 'active', reviewed_by = :rid, reviewed_at = NOW()
			 WHERE id = :id"
		);
		$stmt->execute([':rid' => $actor_user_id, ':id' => $qr_id]);
		audit_log($conn, $actor_user_id, 'qr_activate', 'qr_code', $qr_id);

	} elseif ($action === 'approve' || $action === 'clear_flag') {
		$stmt = $conn->prepare(
			"UPDATE qr_codes
			 SET is_flagged = 0,
				 flag_reason = NULL,
				 flagged_at = NULL,
				 status = 'active',
				 reviewed_by = :rid,
				 reviewed_at = NOW()
			 WHERE id = :id"
		);
		$stmt->execute([':rid' => $actor_user_id, ':id' => $qr_id]);
		audit_log($conn, $actor_user_id, 'qr_clear_flag', 'qr_code', $qr_id);

	} elseif ($action === 'flag') {
		$stmt = $conn->prepare(
			"UPDATE qr_codes
			 SET is_flagged = 1,
				 flag_reason = :reason,
				 flagged_at = NOW(),
				 status = 'paused',
				 reviewed_by = :rid,
				 reviewed_at = NOW()
			 WHERE id = :id"
		);
		$stmt->execute([':reason' => $flag_reason, ':rid' => $actor_user_id, ':id' => $qr_id]);
		audit_log($conn, $actor_user_id, 'qr_flag', 'qr_code', $qr_id, ['reason' => $flag_reason]);

	} elseif ($action === 'approve_request') {
		$stmt = $conn->prepare(
			"UPDATE qr_codes
			 SET approval_request_status = 'approved',
			     approval_resolved_at = NOW(),
			     approval_resolved_by = :rid,
			     status = 'active',
			     is_flagged = 0,
			     flag_reason = NULL,
			     flagged_at = NULL,
			     reviewed_by = :rid,
			     reviewed_at = NOW()
			 WHERE id = :id AND COALESCE(approval_request_status, 'none') = 'requested'"
		);
		$stmt->execute([':rid' => $actor_user_id, ':id' => $qr_id]);
		audit_log($conn, $actor_user_id, 'qr_approve_request', 'qr_code', $qr_id);

	} elseif ($action === 'deny_request') {
		$stmt = $conn->prepare(
			"UPDATE qr_codes
			 SET approval_request_status = 'denied',
			     approval_resolved_at = NOW(),
			     approval_resolved_by = :rid,
			     reviewed_by = :rid,
			     reviewed_at = NOW()
			 WHERE id = :id AND COALESCE(approval_request_status, 'none') = 'requested'"
		);
		$stmt->execute([':rid' => $actor_user_id, ':id' => $qr_id]);
		audit_log($conn, $actor_user_id, 'qr_deny_request', 'qr_code', $qr_id);

	} elseif ($action === 'delete') {
		$stmt = $conn->prepare("DELETE FROM qr_codes WHERE id = :id");
		$stmt->execute([':id' => $qr_id]);
		audit_log($conn, $actor_user_id, 'qr_delete', 'qr_code', $qr_id);

	} else {
		http_response_code(400);
		echo json_encode(["error" => "Invalid action"]);
		exit();
	}

	echo json_encode(["success" => true]);
} catch (PDOException $e) {
	http_response_code(500);
	echo json_encode(["error" => "Database error"]);
}
?>