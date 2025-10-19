'use client';

import { useState } from 'react';
import { StealthCrypto, StealthKeyPair, SharedSecret } from '../crypto';

interface ECDHExchangeProps {
    generatedWallet: StealthKeyPair | null;
    onSharedSecretGenerated: (sharedSecret: SharedSecret) => void;
    onRecipientPubKeySet: (pubKey: string) => void;
}

export default function ECDHExchange({ generatedWallet, onSharedSecretGenerated, onRecipientPubKeySet }: ECDHExchangeProps) {
    const [recipientPubKey, setRecipientPubKey] = useState<string>('');
    const [sharedSecret, setSharedSecret] = useState<SharedSecret | null>(null);

    // Generate shared secret via ECDH
    const generateSharedSecret = () => {
        if (!generatedWallet || !recipientPubKey) return;

        try {
            // Convert recipient public key from hex string to Uint8Array
            const recipientPubKeyBytes = new Uint8Array(
                recipientPubKey.startsWith('0x')
                    ? recipientPubKey.slice(2).match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
                    : recipientPubKey.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
            );

            const shared = StealthCrypto.performECDH(generatedWallet.privateKey, recipientPubKeyBytes);
            setSharedSecret(shared);
            onSharedSecretGenerated(shared);
            onRecipientPubKeySet(recipientPubKey);
        } catch (error) {
            console.error('Error generating shared secret:', error);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
                ECDH Key Exchange
            </h2>

            {/* Recipient Public Key Input */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                    Recipient Public Key
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={recipientPubKey}
                        onChange={(e) => setRecipientPubKey(e.target.value)}
                        placeholder="Enter recipient's public key (hex format)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                    <button
                        onClick={generateSharedSecret}
                        disabled={!generatedWallet || !recipientPubKey}
                        className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Generate Shared Secret
                    </button>
                </div>
            </div>

            {/* Your Public Key Display */}
            {generatedWallet && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Your Public Key</h3>
                    <p className="font-mono text-sm break-all text-blue-800">
                        0x{Array.from(generatedWallet.publicKey).map(b => b.toString(16).padStart(2, '0')).join('')}
                    </p>
                    <button
                        onClick={() => navigator.clipboard.writeText('0x' + Array.from(generatedWallet.publicKey).map(b => b.toString(16).padStart(2, '0')).join(''))}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                        Copy to clipboard
                    </button>
                </div>
            )}

            {/* Shared Secret Display */}
            {sharedSecret && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Shared Secret</h3>

                    <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Shared Secret</h4>
                        <p className="font-mono text-sm break-all text-green-800">
                            0x{Array.from(sharedSecret.secret).map(b => b.toString(16).padStart(2, '0')).join('')}
                        </p>
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Instructions:</h4>
                <ol className="text-sm text-yellow-700 space-y-1">
                    <li>1. First generate your wallet using the "Signature Wallet" tab</li>
                    <li>2. Share your public key with the recipient</li>
                    <li>3. Enter the recipient's public key above</li>
                    <li>4. Click "Generate Shared Secret" to perform ECDH</li>
                    <li>5. Use the shared secret for stealth address generation</li>
                </ol>
            </div>
        </div>
    );
}
