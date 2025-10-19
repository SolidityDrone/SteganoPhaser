'use client';

import { useState } from 'react';
import { StealthKeyPair, SharedSecret } from '../crypto';
import SignatureWallet from '../components/SignatureWallet';
import ECDHExchange from '../components/ECDHExchange';
import StealthSequences from '../components/StealthSequences';
import StealthMessages from '../components/StealthMessages';
import MessageCalculator from '../components/MessageCalculator';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'signature' | 'ecdh' | 'stealth' | 'messages' | 'calculator'>('signature');
  const [generatedWallet, setGeneratedWallet] = useState<StealthKeyPair | null>(null);
  const [sharedSecret, setSharedSecret] = useState<SharedSecret | null>(null);
  const [recipientPubKey, setRecipientPubKey] = useState<string>('');
  const [bobStealthSequence, setBobStealthSequence] = useState<Array<{ nonce: number; address: string }>>([]);
  const [aliceStealthSequence, setAliceStealthSequence] = useState<Array<{ nonce: number; address: string }>>([]);

  const handleWalletGenerated = (wallet: StealthKeyPair) => {
    setGeneratedWallet(wallet);
  };

  const handleSharedSecretGenerated = (shared: SharedSecret) => {
    setSharedSecret(shared);
  };

  const handleRecipientPubKeySet = (pubKey: string) => {
    setRecipientPubKey(pubKey);
  };

  const handleSequencesGenerated = (
    bobSequence: Array<{ nonce: number; address: string }>,
    aliceSequence: Array<{ nonce: number; address: string }>
  ) => {
    setBobStealthSequence(bobSequence);
    setAliceStealthSequence(aliceSequence);
  };

  return (
    <div className="min-h-screen bg-black cyber-grid">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-cyber cyber-glow bg-transparent">
          SteganoPhaser - Steganographic Messaging System
        </h1>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="card cyber-border p-1">
            <button
              onClick={() => setActiveTab('signature')}
              className={`px-6 py-3 rounded-md transition-all font-mono ${activeTab === 'signature'
                ? 'btn-primary'
                : 'btn-secondary'
                }`}
            >
              Signature Wallet
            </button>
            <button
              onClick={() => setActiveTab('ecdh')}
              className={`px-6 py-3 rounded-md transition-all font-mono ${activeTab === 'ecdh'
                ? 'btn-primary'
                : 'btn-secondary'
                }`}
            >
              ECDH Exchange
            </button>
            <button
              onClick={() => setActiveTab('stealth')}
              className={`px-6 py-3 rounded-md transition-all font-mono ${activeTab === 'stealth'
                ? 'btn-primary'
                : 'btn-secondary'
                }`}
            >
              Stealth Sequences
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-6 py-3 rounded-md transition-all font-mono ${activeTab === 'messages'
                ? 'btn-primary'
                : 'btn-secondary'
                }`}
            >
              Check Messages
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-6 py-3 rounded-md transition-all font-mono ${activeTab === 'calculator'
                ? 'btn-primary'
                : 'btn-secondary'
                }`}
            >
              Message Calculator
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'signature' && (
            <SignatureWallet onWalletGenerated={handleWalletGenerated} />
          )}

          {activeTab === 'ecdh' && (
            <ECDHExchange
              generatedWallet={generatedWallet}
              onSharedSecretGenerated={handleSharedSecretGenerated}
              onRecipientPubKeySet={handleRecipientPubKeySet}
            />
          )}

          {activeTab === 'stealth' && (
            <StealthSequences
              sharedSecret={sharedSecret}
              generatedWallet={generatedWallet}
              recipientPubKey={recipientPubKey}
              onSequencesGenerated={handleSequencesGenerated}
            />
          )}

          {activeTab === 'messages' && (
            <StealthMessages
              bobStealthSequence={bobStealthSequence}
              aliceStealthSequence={aliceStealthSequence}
              currentUser="bob"
              generatedWallet={generatedWallet}
              sharedSecret={sharedSecret}
              recipientPubKey={recipientPubKey}
            />
          )}

          {activeTab === 'calculator' && (
            <MessageCalculator />
          )}
        </div>
      </div>
    </div>
  );
}