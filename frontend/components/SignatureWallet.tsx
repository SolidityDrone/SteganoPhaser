'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { AppKitButton } from '@reown/appkit/react';
import { StealthCrypto, StealthKeyPair } from '../crypto';

const FIXED_MESSAGE = "Aknowledge you are going steganographic";

interface SignatureWalletProps {
    onWalletGenerated: (wallet: StealthKeyPair) => void;
}

export default function SignatureWallet({ onWalletGenerated }: SignatureWalletProps) {
    const [signature, setSignature] = useState<string>('');
    const [generatedWallet, setGeneratedWallet] = useState<StealthKeyPair | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const { address, isConnected } = useAccount();
    const { signMessage, data: signatureData, isPending: isSigning } = useSignMessage();

    // Generate wallet from signature only
    const generateWalletFromSignature = async () => {
        if (!signature) return;

        setIsGenerating(true);
        try {
            // Use signature as seed for deterministic wallet generation
            const signatureBytes = new TextEncoder().encode(signature);
            const seed = StealthCrypto.hash(signatureBytes);

            // Generate deterministic private key from signature seed
            const privateKey = seed.slice(0, 32); // Use first 32 bytes as private key

            // Generate wallet from deterministic private key
            const wallet = StealthCrypto.generateKeyPairFromPrivateKey(privateKey);

            setGeneratedWallet(wallet);
            onWalletGenerated(wallet);
        } catch (error) {
            console.error('Error generating wallet:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    // Handle signature when it's available
    useEffect(() => {
        if (signatureData) {
            setSignature(signatureData);
        }
    }, [signatureData]);

    return (
        <div className="card cyber-border">
            <h2 className="text-2xl font-semibold mb-6 text-cyber cyber-glow">
                Generate Wallet from Signature
            </h2>
            <p className="text-sm text-secondary mb-6 font-mono">
                Sign the steganographic message to generate your embedded wallet
            </p>

            {/* Connection Status */}
            <div className="mb-6 p-6 bg-gray-900 border-2 border-gray-700 rounded-lg cyber-border">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-cyber font-mono">
                        Status: {isConnected ? `Connected as ${address}` : 'Not connected'}
                    </p>
                    <AppKitButton />
                </div>
            </div>


            {/* Fixed Message Display */}
            <div className="mb-6 p-6 bg-gray-900 border-2 border-blue-500 rounded-lg cyber-border">
                <h3 className="font-semibold text-cyber mb-3 cyber-glow">Message to Sign:</h3>
                <p className="text-green-400 font-mono text-sm break-all bg-black p-3 rounded border border-blue-500">
                    "{FIXED_MESSAGE}"
                </p>
            </div>

            {/* Signature Section */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-cyber mb-3">
                    Signature
                </label>
                <div className="flex gap-3">
                    <button
                        onClick={async () => {
                            if (!isConnected) {
                                alert('Please connect your wallet first using the connect button above');
                                return;
                            }
                            console.log('Attempting to sign message:', FIXED_MESSAGE);
                            console.log('Wallet connected:', isConnected);
                            console.log('Address:', address);
                            try {
                                await signMessage({ message: FIXED_MESSAGE });
                            } catch (error) {
                                console.error('Sign message error:', error);
                                alert('Error signing message: ' + (error instanceof Error ? error.message : String(error)));
                            }
                        }}
                        disabled={!isConnected || isSigning}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed font-mono font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/25"
                    >
                        {isSigning ? 'Signing...' : 'Sign Message'}
                    </button>
                </div>
                {signature && (
                    <div className="mt-3 p-4 bg-gray-900 border-2 border-green-500 rounded-lg cyber-border">
                        <p className="text-sm text-cyber mb-2 font-mono">Signature:</p>
                        <p className="font-mono text-xs break-all text-green-400 bg-black p-3 rounded border border-green-500">{signature}</p>
                    </div>
                )}
            </div>

            {/* Generate Wallet Button */}
            <div className="mb-6">
                <button
                    onClick={generateWalletFromSignature}
                    disabled={!signature || isGenerating}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed font-mono font-semibold transition-all hover:shadow-lg hover:shadow-green-500/25"
                >
                    {isGenerating ? 'Generating...' : 'Generate Wallet from Signature'}
                </button>
                {!signature && (
                    <p className="text-xs text-muted mt-2 font-mono">
                        Please sign the message first to generate your wallet
                    </p>
                )}
            </div>

            {/* Generated Wallet Display */}
            {generatedWallet && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-cyber cyber-glow">Generated Wallet</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-gray-900 border-2 border-gray-700 rounded-lg cyber-border">
                            <h4 className="font-medium text-cyber mb-3">Address</h4>
                            <p className="font-mono text-sm break-all text-green-400 bg-black p-3 rounded border border-gray-600">
                                {generatedWallet.address}
                            </p>
                        </div>

                        <div className="p-6 bg-gray-900 border-2 border-gray-700 rounded-lg cyber-border">
                            <h4 className="font-medium text-cyber mb-3">Public Key</h4>
                            <p className="font-mono text-xs break-all text-green-400 bg-black p-3 rounded border border-gray-600">
                                0x{Array.from(generatedWallet.publicKey).map(b => b.toString(16).padStart(2, '0')).join('')}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
