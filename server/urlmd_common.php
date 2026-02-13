<?php

function urlmd_is_bot_request(string $userAgent): bool
{
    $ua = strtolower($userAgent);
    if ($ua === '') {
        return false;
    }

    $botMarkers = ['bot', 'spider', 'crawler', 'preview', 'headless', 'facebookexternalhit', 'slackbot', 'discordbot'];
    foreach ($botMarkers as $marker) {
        if (str_contains($ua, $marker)) {
            return true;
        }
    }

    return false;
}

function urlmd_generate_code(int $length = 7): string
{
    $chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $result = '';

    for ($i = 0; $i < $length; $i++) {
        $result .= $chars[random_int(0, strlen($chars) - 1)];
    }

    return $result;
}

function urlmd_pick_ab_destination(PDO $conn, int $linkId, string $fallbackUrl): string
{
    try {
        $stmt = $conn->prepare(
            "SELECT destination_url, weight_percent
             FROM url_ab_variants
             WHERE url_link_id = :id AND is_active = 1 AND weight_percent > 0"
        );
        $stmt->execute([':id' => $linkId]);
        $variants = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!$variants) {
            return $fallbackUrl;
        }

        $bucket = random_int(1, 100);
        $running = 0;

        foreach ($variants as $variant) {
            $running += (int) $variant['weight_percent'];
            if ($bucket <= $running) {
                return (string) $variant['destination_url'];
            }
        }
    } catch (Exception $e) {
        return $fallbackUrl;
    }

    return $fallbackUrl;
}

function urlmd_track_click(PDO $conn, array $link, ?int $qrCodeId = null): void
{
    $ip = get_client_ip();
    $uaRaw = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $ua = parse_user_agent($uaRaw);
    $country = lookup_country($ip);
    $referrer = $_SERVER['HTTP_REFERER'] ?? null;
    $isBot = urlmd_is_bot_request($uaRaw) ? 1 : 0;

    try {
        $stmt = $conn->prepare(
            "INSERT INTO url_clicks (url_link_id, qr_code_id, ip_address, country, referrer, user_agent, device_type, os, browser, is_bot)
             VALUES (:link_id, :qr_id, :ip, :country, :ref, :ua_raw, :device, :os, :browser, :is_bot)"
        );
        $stmt->execute([
            ':link_id' => (int) $link['id'],
            ':qr_id' => $qrCodeId,
            ':ip' => $ip,
            ':country' => $country,
            ':ref' => $referrer,
            ':ua_raw' => $uaRaw,
            ':device' => $ua['device_type'],
            ':os' => $ua['os'],
            ':browser' => $ua['browser'],
            ':is_bot' => $isBot,
        ]);
    } catch (Exception $e) {
        // best effort only
    }
}

