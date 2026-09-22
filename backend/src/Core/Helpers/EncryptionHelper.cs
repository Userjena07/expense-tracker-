using System.Security.Cryptography;
using System.Text;

namespace ExpenseTracker.Core.Helpers;

public static class EncryptionHelper
{
    private static readonly byte[] DefaultKey = SHA256.HashData(Encoding.UTF8.GetBytes("ExpenseTracker-Secure-AES-256-Key-Gautam-2026!"));

    public static string EncryptId(long id, byte[]? key = null)
    {
        key ??= DefaultKey;
        byte[] plaintext = BitConverter.GetBytes(id);
        byte[] nonce = new byte[12]; // 96-bit nonce for AES-GCM
        RandomNumberGenerator.Fill(nonce);

        byte[] ciphertext = new byte[plaintext.Length];
        byte[] tag = new byte[16]; // 128-bit tag

        using var aesGcm = new AesGcm(key, 16);
        aesGcm.Encrypt(nonce, plaintext, ciphertext, tag);

        // Payload: [12 bytes Nonce] + [16 bytes Tag] + [Ciphertext]
        byte[] payload = new byte[nonce.Length + tag.Length + ciphertext.Length];
        Buffer.BlockCopy(nonce, 0, payload, 0, nonce.Length);
        Buffer.BlockCopy(tag, 0, payload, nonce.Length, tag.Length);
        Buffer.BlockCopy(ciphertext, 0, payload, nonce.Length + tag.Length, ciphertext.Length);

        return Convert.ToBase64String(payload).Replace('+', '-').Replace('/', '_').TrimEnd('=');
    }

    public static bool TryDecryptId(string? encryptedId, out long id, byte[]? key = null)
    {
        id = 0;
        if (string.IsNullOrWhiteSpace(encryptedId))
        {
            return false;
        }

        try
        {
            key ??= DefaultKey;
            string base64 = encryptedId.Replace('-', '+').Replace('_', '/');
            switch (base64.Length % 4)
            {
                case 2: base64 += "=="; break;
                case 3: base64 += "="; break;
            }

            byte[] payload = Convert.FromBase64String(base64);
            if (payload.Length < 12 + 16 + 8)
            {
                return false;
            }

            byte[] nonce = new byte[12];
            byte[] tag = new byte[16];
            byte[] ciphertext = new byte[payload.Length - 28];

            Buffer.BlockCopy(payload, 0, nonce, 0, 12);
            Buffer.BlockCopy(payload, 12, tag, 0, 16);
            Buffer.BlockCopy(payload, 28, ciphertext, 0, ciphertext.Length);

            byte[] plaintext = new byte[ciphertext.Length];
            using var aesGcm = new AesGcm(key, 16);
            aesGcm.Decrypt(nonce, ciphertext, tag, plaintext);

            id = BitConverter.ToInt64(plaintext, 0);
            return true;
        }
        catch
        {
            return false;
        }
    }
}
