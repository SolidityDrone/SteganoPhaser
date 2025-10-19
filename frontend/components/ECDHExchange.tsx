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
        <div className="card cyber-border">
            <h2 className="text-2xl font-semibold mb-6 text-cyber cyber-glow">
                ECDH Key Exchange
            </h2>

            {/* Input Type Selection */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-cyber mb-3">
                    Input Method
                </label>
                <div className="flex gap-3">
                    <button
                        onClick={() => setInputType('pubkey')}
                        className={`px-6 py-3 rounded-md transition-all font-mono ${inputType === 'pubkey'
                            ? 'btn-primary'
                            : 'btn-secondary'
                            }`}
                    >
                        Public Key
                    </button>
                    <button
                        onClick={() => setInputType('ens')}
                        className={`px-6 py-3 rounded-md transition-all font-mono ${inputType === 'ens'
                            ? 'btn-primary'
                            : 'btn-secondary'
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
                        <label className="block text-sm font-medium text-cyber mb-3">
                            Recipient Public Key
                        </label>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={recipientPubKey}
                                onChange={(e) => setRecipientPubKey(e.target.value)}
                                placeholder="Enter recipient's public key (hex format)"
                                className="flex-1 px-4 py-3 border-2 border-gray-600 rounded-lg focus:border-green-400 focus:ring-2 focus:ring-green-400/20 bg-gray-900 text-white placeholder-gray-400 font-mono"
                            />
                            <button
                                onClick={generateSharedSecret}
                                disabled={!generatedWallet || !recipientPubKey}
                                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed font-mono font-semibold transition-all hover:shadow-lg hover:shadow-purple-500/25"
                            >
                                Generate Shared Secret
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <label className="block text-sm font-medium text-cyber mb-3">
                            ENS Name
                        </label>
                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={ensName}
                                    onChange={(e) => setEnsName(e.target.value)}
                                    placeholder="Enter ENS name (e.g., alice.eth)"
                                    className="flex-1 px-4 py-3 border-2 border-gray-600 rounded-lg focus:border-green-400 focus:ring-2 focus:ring-green-400/20 bg-gray-900 text-white placeholder-gray-400 font-mono"
                                />
                                <button
                                    onClick={resolveENSName}
                                    disabled={!ensName.trim() || isResolving}
                                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed font-mono font-semibold transition-all hover:shadow-lg hover:shadow-green-500/25"
                                >
                                    {isResolving ? 'Resolving...' : 'Resolve ENS'}
                                </button>
                                {recipientPubKey && (
                                    <button
                                        onClick={generateSharedSecret}
                                        disabled={!generatedWallet}
                                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed font-mono font-semibold transition-all hover:shadow-lg hover:shadow-purple-500/25"
                                    >
                                        Generate Shared Secret
                                    </button>
                                )}
                            </div>
                            {resolveError && (
                                <p className="text-sm text-red-400 font-mono">{resolveError}</p>
                            )}
                            {recipientPubKey && (
                                <p className="text-sm text-green-400 font-mono">
                                    ✓ ENS resolved successfully!
                                </p>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Your Public Key Display */}
            {generatedWallet && (
                <div className="mb-6 p-6 bg-gray-900 border-2 border-gray-700 rounded-lg cyber-border">
                    <h3 className="font-medium text-cyber mb-3">Your Public Key</h3>
                    <p className="font-mono text-sm break-all text-green-400 bg-black p-3 rounded border border-gray-600">
                        0x{Array.from(generatedWallet.publicKey).map(b => b.toString(16).padStart(2, '0')).join('')}
                    </p>
                    <button
                        onClick={() => navigator.clipboard.writeText('0x' + Array.from(generatedWallet.publicKey).map(b => b.toString(16).padStart(2, '0')).join(''))}
                        className="mt-3 text-xs text-cyber hover:text-green-300 underline font-mono transition-colors"
                    >
                        Copy to clipboard
                    </button>
                </div>
            )}

            {/* Shared Secret Display */}
            {sharedSecret && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-cyber cyber-glow">Shared Secret</h3>

                    <div className="p-6 bg-gray-900 border-2 border-green-500 rounded-lg cyber-glow">
                        <h4 className="font-medium text-cyber mb-3">Shared Secret</h4>
                        <p className="font-mono text-sm break-all text-green-400 bg-black p-3 rounded border border-green-500">
                            0x{Array.from(sharedSecret.secret).map(b => b.toString(16).padStart(2, '0')).join('')}
                        </p>
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="mt-6 p-6 bg-gray-900 border-2 border-yellow-500 rounded-lg cyber-border">
                <h4 className="font-medium text-cyber mb-3 cyber-glow">Instructions:</h4>
                <ol className="text-sm text-yellow-400 space-y-2 font-mono">
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