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
  const [currentUser, setCurrentUser] = useState<'bob' | 'alice'>('bob');

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
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-4 text-gray-800">
          Steganographic Wallet Generator
        </h1>

        {/* User Role Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setCurrentUser('bob')}
              className={`px-4 py-2 rounded-md transition-colors ${currentUser === 'bob'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              I am Bob
            </button>
            <button
              onClick={() => setCurrentUser('alice')}
              className={`px-4 py-2 rounded-md transition-colors ${currentUser === 'alice'
                ? 'bg-pink-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              I am Alice
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('signature')}
              className={`px-6 py-2 rounded-md transition-colors ${activeTab === 'signature'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              Signature Wallet
            </button>
            <button
              onClick={() => setActiveTab('ecdh')}
              className={`px-6 py-2 rounded-md transition-colors ${activeTab === 'ecdh'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              ECDH Exchange
            </button>
            <button
              onClick={() => setActiveTab('stealth')}
              className={`px-6 py-2 rounded-md transition-colors ${activeTab === 'stealth'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              Stealth Sequences
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-6 py-2 rounded-md transition-colors ${activeTab === 'messages'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              Check Messages
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-6 py-2 rounded-md transition-colors ${activeTab === 'calculator'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
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
              currentUser={currentUser}
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