<?php

namespace App\Auth;

/**
 * Implémentation minimaliste de JSON Web Token (HS256), sans dépendance
 * externe, pour rester déployable par simple upload sur hébergement
 * mutualisé (pas besoin de Composer).
 *
 * Structure standard : base64url(header).base64url(payload).signature
 */
class Jwt
{
    public static function encoder(array $payload, string $secret, int $expirySeconds): string
    {
        $header = ['typ' => 'JWT', 'alg' => 'HS256'];

        $maintenant = $payload['iat'] ?? time();
        $payload['iat'] = $maintenant;
        $payload['exp'] = $maintenant + $expirySeconds;

        $segments = [
            self::base64UrlEncode(json_encode($header, JSON_UNESCAPED_UNICODE)),
            self::base64UrlEncode(json_encode($payload, JSON_UNESCAPED_UNICODE)),
        ];

        $signature = hash_hmac('sha256', implode('.', $segments), $secret, true);
        $segments[] = self::base64UrlEncode($signature);

        return implode('.', $segments);
    }

    /**
     * Décode et vérifie un token. Retourne le payload si valide,
     * ou null si le token est invalide/expiré/mal signé.
     */
    public static function decoder(string $token, string $secret): ?array
    {
        $parties = explode('.', $token);
        if (count($parties) !== 3) {
            return null;
        }

        [$headerB64, $payloadB64, $signatureB64] = $parties;

        $signatureAttendue = hash_hmac('sha256', "{$headerB64}.{$payloadB64}", $secret, true);
        $signatureRecue = self::base64UrlDecode($signatureB64);

        if ($signatureRecue === false || !hash_equals($signatureAttendue, $signatureRecue)) {
            return null;
        }

        $payloadJson = self::base64UrlDecode($payloadB64);
        if ($payloadJson === false) {
            return null;
        }

        $payload = json_decode($payloadJson, true);
        if (!is_array($payload)) {
            return null;
        }

        if (isset($payload['exp']) && time() >= (int) $payload['exp']) {
            return null; // token expiré
        }

        return $payload;
    }

    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string|false
    {
        $data = strtr($data, '-_', '+/');
        $padding = strlen($data) % 4;
        if ($padding > 0) {
            $data .= str_repeat('=', 4 - $padding);
        }
        return base64_decode($data, true);
    }
}
