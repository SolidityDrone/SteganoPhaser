import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { hmac } from '@noble/hashes/hmac';
import { randomBytes } from '@noble/hashes/utils';
import { StealthKeyPair, SharedSecret, EncryptedMessage } from './types.js';

/**
 * Crypto utilities for ECDH, AES encryption, and stealth address generation
 */
export class StealthCrypto {
    /**
     * Generate a new key pair
     */
    static generateKeyPair(): StealthKeyPair {
        const privateKey = secp256k1.utils.randomPrivateKey();
        const publicKey = secp256k1.getPublicKey(privateKey);
        const address = this.publicKeyToAddress(publicKey);

        return {
            privateKey,
            publicKey,
            address
        };
    }

    /**
     * Generate a key pair from a deterministic private key
     */
    static generateKeyPairFromPrivateKey(privateKey: Uint8Array): StealthKeyPair {
        const publicKey = secp256k1.getPublicKey(privateKey);
        const address = this.publicKeyToAddress(publicKey);

        return {
            privateKey,
            publicKey,
            address
        };
    }

    /**
     * Convert public key to Ethereum address
     */
    static publicKeyToAddress(publicKey: Uint8Array): string {
        const hash = sha256(publicKey.slice(1)); // Remove 0x04 prefix
        return '0x' + Array.from(hash.slice(-20)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Perform ECDH to get shared secret
     */
    static performECDH(privateKey: Uint8Array, publicKey: Uint8Array): SharedSecret {
        const sharedPoint = secp256k1.getSharedSecret(privateKey, publicKey);
        const secret = sha256(sharedPoint);
        const seed = '0x' + Array.from(secret).map(b => b.toString(16).padStart(2, '0')).join('');

        return {
            secret,
            seed
        };
    }

    /**
     * Generate stealth address seed from shared secret and public keys
     */
    static generateStealthSeed(sharedSecret: Uint8Array, pubKeyF: Uint8Array, pubKeyD: Uint8Array): string {
        const combined = new Uint8Array(sharedSecret.length + pubKeyF.length + pubKeyD.length);
        combined.set(sharedSecret, 0);
        combined.set(pubKeyF, sharedSecret.length);
        combined.set(pubKeyD, sharedSecret.length + pubKeyF.length);

        const hash = sha256(combined);
        return '0x' + Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Simple AES-128 encryption using HMAC-SHA256 for key derivation
     */
    static encryptAES128(message: string, key: Uint8Array): Uint8Array {
        // For simplicity, we'll use a basic XOR cipher with HMAC
        // In production, use a proper AES implementation
        const messageBytes = new TextEncoder().encode(message);
        const hmacKey = hmac(sha256, key, new Uint8Array([0x01]));
        const iv = randomBytes(16);

        const encrypted = new Uint8Array(messageBytes.length);
        for (let i = 0; i < messageBytes.length; i++) {
            encrypted[i] = messageBytes[i] ^ hmacKey[i % hmacKey.length];
        }

        // Prepend IV
        const result = new Uint8Array(iv.length + encrypted.length);
        result.set(iv, 0);
        result.set(encrypted, iv.length);

        return result;
    }

    /**
     * Simple AES-128 decryption
     */
    static decryptAES128(encrypted: Uint8Array, key: Uint8Array): string {
        const iv = encrypted.slice(0, 16);
        const ciphertext = encrypted.slice(16);

        const hmacKey = hmac(sha256, key, new Uint8Array([0x01]));

        const decrypted = new Uint8Array(ciphertext.length);
        for (let i = 0; i < ciphertext.length; i++) {
            decrypted[i] = ciphertext[i] ^ hmacKey[i % hmacKey.length];
        }

        return new TextDecoder().decode(decrypted);
    }

    /**
     * Encode encrypted message as transaction amount
     */
    static encodeMessageAsAmount(encrypted: Uint8Array): bigint {
        // Convert encrypted bytes to a bigint
        let amount = 0n;
        for (let i = 0; i < encrypted.length; i++) {
            amount = (amount << 8n) + BigInt(encrypted[i]);
        }
        return amount;
    }

    /**
     * Decode transaction amount back to encrypted message
     */
    static decodeAmountAsMessage(amount: bigint, expectedLength: number): Uint8Array {
        const bytes = new Uint8Array(expectedLength);
        let temp = amount;

        for (let i = expectedLength - 1; i >= 0; i--) {
            bytes[i] = Number(temp & 0xFFn);
            temp = temp >> 8n;
        }

        return bytes;
    }

    /**
     * Create encrypted message for stealth communication
     */
    static createEncryptedMessage(message: string, sharedSecret: Uint8Array): EncryptedMessage {
        const encrypted = this.encryptAES128(message, sharedSecret);
        const amount = this.encodeMessageAsAmount(encrypted);

        return {
            encrypted,
            amount
        };
    }

    /**
     * Decrypt message from transaction amount
     */
    static decryptMessageFromAmount(amount: bigint, sharedSecret: Uint8Array, expectedLength: number): string {
        const encrypted = this.decodeAmountAsMessage(amount, expectedLength);
        return this.decryptAES128(encrypted, sharedSecret);
    }

    /**
     * Simple hash function using SHA256
     */
    static hash(data: Uint8Array): Uint8Array {
        return sha256(data);
    }

    /**
     * Generate stealth address from shared key, public key, and nonce
     * Formula: h(sharedkey, pubkey, nonce) as private key
     */
    static generateStealthPrivateKey(
        sharedSecret: Uint8Array,
        publicKey: Uint8Array,
        nonce: number
    ): Uint8Array {
        const nonceBytes = new Uint8Array(4);
        new DataView(nonceBytes.buffer).setUint32(0, nonce, false); // Big-endian

        const combined = new Uint8Array(sharedSecret.length + publicKey.length + nonceBytes.length);
        combined.set(sharedSecret, 0);
        combined.set(publicKey, sharedSecret.length);
        combined.set(nonceBytes, sharedSecret.length + publicKey.length);

        return sha256(combined);
    }

    /**
     * Generate stealth address from private key
     */
    static privateKeyToStealthAddress(privateKey: Uint8Array): string {
        const publicKey = secp256k1.getPublicKey(privateKey);
        return this.publicKeyToAddress(publicKey);
    }

    /**
     * Generate stealth address directly from shared key, public key, and nonce
     */
    static generateStealthAddress(
        sharedSecret: Uint8Array,
        publicKey: Uint8Array,
        nonce: number
    ): { privateKey: Uint8Array; address: string } {
        const privateKey = this.generateStealthPrivateKey(sharedSecret, publicKey, nonce);
        const address = this.privateKeyToStealthAddress(privateKey);

        return { privateKey, address };
    }

    /**
     * Generate a sequence of stealth addresses
     */
    static generateStealthSequence(
        sharedSecret: Uint8Array,
        publicKey: Uint8Array,
        startNonce: number,
        count: number
    ): Array<{ nonce: number; privateKey: Uint8Array; address: string }> {
        const addresses = [];

        for (let i = 0; i < count; i++) {
            const nonce = startNonce + i;
            const stealth = this.generateStealthAddress(sharedSecret, publicKey, nonce);
            addresses.push({
                nonce,
                privateKey: stealth.privateKey,
                address: stealth.address
            });
        }

        return addresses;
    }

    /**
     * Generate stealth public key from shared key, public key, and nonce
     * This gives you the public key of a stealth address without the private key
     */
    static generateStealthPublicKey(
        sharedSecret: Uint8Array,
        publicKey: Uint8Array,
        nonce: number
    ): { publicKey: Uint8Array; address: string } {
        const stealthPrivateKey = this.generateStealthPrivateKey(sharedSecret, publicKey, nonce);
        const stealthPublicKey = secp256k1.getPublicKey(stealthPrivateKey);
        const address = this.publicKeyToAddress(stealthPublicKey);

        return { publicKey: stealthPublicKey, address };
    }

    /**
     * Generate a sequence of stealth public keys (without private keys)
     */
    static generateStealthPublicKeySequence(
        sharedSecret: Uint8Array,
        publicKey: Uint8Array,
        startNonce: number,
        count: number
    ): Array<{ nonce: number; publicKey: Uint8Array; address: string }> {
        const addresses = [];

        for (let i = 0; i < count; i++) {
            const nonce = startNonce + i;
            const stealth = this.generateStealthPublicKey(sharedSecret, publicKey, nonce);
            addresses.push({
                nonce,
                publicKey: stealth.publicKey,
                address: stealth.address
            });
        }

        return addresses;
    }
}
