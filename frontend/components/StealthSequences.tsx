'use client';

import { useState } from 'react';
import { StealthCrypto, SharedSecret, StealthKeyPair } from '../crypto';

interface StealthSequencesProps {
    sharedSecret: SharedSecret | null;
    generatedWallet: StealthKeyPair | null;
    recipientPubKey: string;
    onSequencesGenerated: (bobSequence: Array<{ nonce: number; address: string }>, aliceSequence: Array<{ nonce: number; address: string }>) => void;
}

export default function StealthSequences({
    sharedSecret,
    generatedWallet,
    recipientPubKey,
    onSequencesGenerated
}: StealthSequencesProps) {
    const [bobStealthSequence, setBobStealthSequence] = useState<Array<{ nonce: number; address: string }>>([]);
    const [aliceStealthSequence, setAliceStealthSequence] = useState<Array<{ nonce: number; address: string }>>([]);
    const [sequenceCount, setSequenceCount] = useState<number>(5);

    // Generate stealth address sequences for both Bob and Alice
    const generateStealthSequences = () => {
        if (!sharedSecret || !generatedWallet || !recipientPubKey) return;

        try {
            // Convert recipient public key to Uint8Array
            const recipientPubKeyBytes = new Uint8Array(
                recipientPubKey.startsWith('0x')
                    ? recipientPubKey.slice(2).match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
                    : recipientPubKey.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
            );

            // Generate Bob's stealth address sequence (shared secret + Bob's pub key + nonce)
            const bobSequence = StealthCrypto.generateStealthPublicKeySequence(
                sharedSecret.secret,
                recipientPubKeyBytes, // Bob's public key
                0, // start nonce
                sequenceCount
            ).map(item => ({ nonce: item.nonce, address: item.address }));

            // Generate Alice's stealth address sequence (shared secret + Alice's pub key + nonce)
            const aliceSequence = StealthCrypto.generateStealthPublicKeySequence(
                sharedSecret.secret,
                generatedWallet.publicKey, // Alice's public key
                0, // start nonce
                sequenceCount
            ).map(item => ({ nonce: item.nonce, address: item.address }));

            setBobStealthSequence(bobSequence);
            setAliceStealthSequence(aliceSequence);
            onSequencesGenerated(bobSequence, aliceSequence);
        } catch (error) {
            console.error('Error generating stealth sequences:', error);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
                Stealth Address Sequences
            </h2>

            {/* Sequence Count Input */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Addresses to Generate
                </label>
                <input
                    type="number"
                    value={sequenceCount}
                    onChange={(e) => setSequenceCount(parseInt(e.target.value) || 5)}
                    min="1"
                    max="20"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Generate Sequences Button */}
            <div className="mb-6">
                <button
                    onClick={generateStealthSequences}
                    disabled={!sharedSecret || !generatedWallet || !recipientPubKey}
                    className="px-6 py-3 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Generate Stealth Sequences
                </button>
                {(!sharedSecret || !generatedWallet || !recipientPubKey) && (
                    <p className="text-xs text-gray-500 mt-2">
                        Complete the ECDH Exchange first to generate stealth sequences
                    </p>
                )}
            </div>

            {/* Bob's Stealth Sequence */}
            {bobStealthSequence.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Bob's Stealth Addresses</h3>
                    <div className="space-y-2">
                        {bobStealthSequence.map((item, index) => (
                            <div key={index} className="p-3 bg-blue-50 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-blue-800">Nonce {item.nonce}</span>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(item.address)}
                                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <p className="font-mono text-xs break-all text-blue-700 mt-1">
                                    {item.address}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Alice's Stealth Sequence */}
            {aliceStealthSequence.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Alice's Stealth Addresses</h3>
                    <div className="space-y-2">
                        {aliceStealthSequence.map((item, index) => (
                            <div key={index} className="p-3 bg-green-50 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-green-800">Nonce {item.nonce}</span>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(item.address)}
                                        className="text-xs text-green-600 hover:text-green-800 underline"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <p className="font-mono text-xs break-all text-green-700 mt-1">
                                    {item.address}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Explanation */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">How It Works:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>Bob's addresses:</strong> Generated using shared secret + Bob's public key + nonce</li>
                    <li>• <strong>Alice's addresses:</strong> Generated using shared secret + Alice's public key + nonce</li>
                    <li>• <strong>Both parties</strong> can compute each other's stealth addresses</li>
                    <li>• <strong>Neither party</strong> can derive the other's private keys</li>
                    <li>• <strong>Increasing nonce</strong> generates the next address in the sequence</li>
                </ul>
            </div>
        </div>
    );
}
