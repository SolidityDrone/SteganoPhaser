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
    const [inputType, setInputType] = useState<'pubkey' | 'ens'>('pubkey');
    const [ensName, setEnsName] = useState<string>('');
    const [isResolving, setIsResolving] = useState<boolean>(false);
    const [resolveError, setResolveError] = useState<string>('');

    // Resolve ENS name to get public key from description text record
    const resolveENSName = async () => {
        if (!ensName.trim()) return;

        setIsResolving(true);
        setResolveError('');

        try {
            // Make API call to our internal API route
            const response = await fetch(`/api/namestone?domain=${ensName}&text_records=1`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('ENS API response:', data);

            if (data.length === 0) {
                throw new Error('No ENS name found');
            }

            const nameData = data[0];
            const description = nameData.text_records?.description;
            console.log('Description text record:', description);

            if (!description) {
                throw new Error('No description text record found');
            }

            // Extract public key from description
            const pubKey = description.trim();

            // Validate that it looks like a public key (hex string)
            if (!/^0x[a-fA-F0-9]{64}$/.test(pubKey)) {
                throw new Error('Invalid public key format in description');
            }

            setRecipientPubKey(pubKey);
            onRecipientPubKeySet(pubKey);

        } catch (error) {
            console.error('ENS resolution error:', error);
            setResolveError(error instanceof Error ? error.message : 'Failed to resolve ENS name');
        } finally {
            setIsResolving(false);
        }
    };

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

            {/* Input Type Selection */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                    Input Method
                </label>
                <div className="flex gap-2">
                    <button
                        onClick={() => setInputType('pubkey')}
                        className={`px-4 py-2 rounded-md transition-colors ${inputType === 'pubkey'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        Public Key
                    </button>
                    <button
                        onClick={() => setInputType('ens')}
                        className={`px-4 py-2 rounded-md transition-colors ${inputType === 'ens'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        ENS Name
                    </button>
                </div>
            </div>

            {/* Recipient Input */}
            <div className="mb-6">
                {inputType === 'pubkey' ? (
                    <>
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
                    </>
                ) : (
                    <>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            ENS Name
                        </label>
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={ensName}
                                    onChange={(e) => setEnsName(e.target.value)}
                                    placeholder="Enter ENS name (e.g., alice.eth)"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                />
                                <button
                                    onClick={resolveENSName}
                                    disabled={!ensName.trim() || isResolving}
                                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isResolving ? 'Resolving...' : 'Resolve ENS'}
                                </button>
                                {recipientPubKey && (
                                    <button
                                        onClick={generateSharedSecret}
                                        disabled={!generatedWallet}
                                        className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Generate Shared Secret
                                    </button>
                                )}
                            </div>
                            {resolveError && (
                                <p className="text-sm text-red-600">{resolveError}</p>
                            )}
                            {recipientPubKey && (
                                <p className="text-sm text-green-600">
                                    ✓ ENS resolved successfully!
                                </p>
                            )}
                        </div>
                    </>
                )}
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