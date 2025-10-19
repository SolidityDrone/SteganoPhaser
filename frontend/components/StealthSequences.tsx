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
    const [sequenceCount] = useState<number>(100);

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
        <div className="card cyber-border">
            <h2 className="text-2xl font-semibold mb-6 text-cyber cyber-glow">
                Stealth Address Sequences
            </h2>

            {/* Sequence Info */}
            <div className="mb-6 p-4 bg-gray-900 border-2 border-blue-500 rounded-lg cyber-border">
                <p className="text-sm text-cyber font-mono">
                    Generating <strong>100 stealth addresses</strong> for both Bob and Alice
                </p>
            </div>

            {/* Generate Sequences Button */}
            <div className="mb-6">
                <button
                    onClick={generateStealthSequences}
                    disabled={!sharedSecret || !generatedWallet || !recipientPubKey}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed font-mono font-semibold transition-all hover:shadow-lg hover:shadow-purple-500/25"
                >
                    Generate Stealth Sequences
                </button>
                {(!sharedSecret || !generatedWallet || !recipientPubKey) && (
                    <p className="text-xs text-muted mt-2 font-mono">
                        Complete the ECDH Exchange first to generate stealth sequences
                    </p>
                )}
            </div>

            {/* Stealth Sequences - Side by Side Layout */}
            {(bobStealthSequence.length > 0 || aliceStealthSequence.length > 0) && (
                <div className="mb-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Bob's Stealth Sequence - Left Side */}
                        {bobStealthSequence.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-cyber mb-4 cyber-glow">Bob's Stealth Addresses</h3>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {bobStealthSequence.map((item, index) => (
                                        <div key={index} className="p-4 bg-gray-900 border-2 border-blue-500 rounded-lg cyber-border">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-cyber font-mono">Nonce {item.nonce}</span>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(item.address)}
                                                    className="text-xs text-cyber hover:text-green-300 underline font-mono transition-colors"
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                            <p className="font-mono text-xs break-all text-green-400 bg-black p-3 rounded border border-blue-500 mt-2">
                                                {item.address}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Alice's Stealth Sequence - Right Side */}
                        {aliceStealthSequence.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-cyber mb-4 cyber-glow">Alice's Stealth Addresses</h3>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {aliceStealthSequence.map((item, index) => (
                                        <div key={index} className="p-4 bg-gray-900 border-2 border-green-500 rounded-lg cyber-border">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-cyber font-mono">Nonce {item.nonce}</span>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(item.address)}
                                                    className="text-xs text-cyber hover:text-green-300 underline font-mono transition-colors"
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                            <p className="font-mono text-xs break-all text-green-400 bg-black p-3 rounded border border-green-500 mt-2">
                                                {item.address}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Explanation */}
            <div className="mt-6 p-6 bg-gray-900 border-2 border-yellow-500 rounded-lg cyber-border">
                <h4 className="font-medium text-cyber mb-3 cyber-glow">How It Works:</h4>
                <ul className="text-sm text-yellow-400 space-y-2 font-mono">
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
