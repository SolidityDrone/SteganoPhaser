'use client';

import { useState } from 'react';
import { useAccount, useSendTransaction } from 'wagmi';

interface StealthMessagesProps {
    bobStealthSequence: Array<{ nonce: number; address: string }>;
    aliceStealthSequence: Array<{ nonce: number; address: string }>;
    currentUser: 'bob' | 'alice';
}

interface BalanceData {
    nonce: number;
    address: string;
    balance: string;
    message?: string;
    type: 'bob' | 'alice';
}

export default function StealthMessages({ bobStealthSequence, aliceStealthSequence, currentUser }: StealthMessagesProps) {
    const [balanceData, setBalanceData] = useState<BalanceData[]>([]);
    const [isCheckingBalances, setIsCheckingBalances] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<{ address: string; nonce: number; type: 'bob' | 'alice' } | null>(null);
    const [messageText, setMessageText] = useState('');
    const [calculatedAmount, setCalculatedAmount] = useState('');

    const { address, isConnected } = useAccount();
    const { sendTransaction, isPending: isSending } = useSendTransaction();

    // Encode message in the last 12 digits of a balance amount
    const encodeMessageInBalance = (message: string): string => {
        try {
            // Take only first 4 characters to fit in 12 digits
            const truncatedMessage = message.slice(0, 4);

            // Convert characters to ASCII codes and then to 3-digit numeric strings
            const asciiCodes = Array.from(truncatedMessage).map(char => {
                const code = char.charCodeAt(0);
                // Ensure valid ASCII range
                if (code < 0 || code > 127) {
                    return '000'; // Invalid character becomes 000
                }
                return code.toString().padStart(3, '0');
            });

            // Combine into 12-digit string
            const encodedDigits = asciiCodes.join('').padEnd(12, '0');

            // Create a balance amount with these last 12 digits
            const baseAmount = '1000000000000'; // 1 trillion wei (much smaller than 1 ETH)
            const last12Digits = encodedDigits;
            const fullAmount = baseAmount.slice(0, -12) + last12Digits;

            return fullAmount;
        } catch (error) {
            console.error('Error encoding message:', error);
            return '1000000000000'; // Return base amount on error
        }
    };

    // Decode message from balance amount
    const decodeMessageFromBalance = (balance: string): string => {
        // Extract last 12 digits
        const last12Digits = balance.slice(-12);

        // Check if this is a concatenated message (has sequence info)
        const sequence = parseInt(last12Digits.slice(0, 3));
        const total = parseInt(last12Digits.slice(3, 6));

        if (sequence > 0 && total > 0 && sequence <= total) {
            // This is a concatenated message chunk
            const messagePart = last12Digits.slice(6, 12);
            const asciiCodes = [];
            for (let i = 0; i < 6; i += 3) {
                const code = parseInt(messagePart.slice(i, i + 3));
                if (code > 0 && code < 128) {
                    asciiCodes.push(code);
                }
            }
            const chunk = asciiCodes.map(code => String.fromCharCode(code)).join('');
            return `[${sequence}/${total}] ${chunk}`;
        } else {
            // Regular single message
            const asciiCodes = [];
            for (let i = 0; i < 12; i += 3) {
                const code = parseInt(last12Digits.slice(i, i + 3));
                if (code > 0 && code < 128) { // Valid ASCII range
                    asciiCodes.push(code);
                }
            }

            // Convert ASCII codes back to string
            const message = asciiCodes.map(code => String.fromCharCode(code)).join('');

            return message;
        }
    };

    // Open modal for sending message
    const openSendModal = (address: string, nonce: number, type: 'bob' | 'alice') => {
        setSelectedAddress({ address, nonce, type });
        setShowModal(true);
        setMessageText('');
        setCalculatedAmount('');
    };

    // Calculate amount for message
    const calculateMessageAmount = () => {
        if (!messageText.trim()) return;
        const amount = encodeMessageInBalance(messageText);
        setCalculatedAmount(amount);
    };

    // Send transaction
    const sendMessage = async () => {
        if (!selectedAddress || !calculatedAmount || !isConnected) return;

        try {
            await sendTransaction({
                to: selectedAddress.address as `0x${string}`,
                value: BigInt(calculatedAmount),
            });

            // Close modal after successful send
            setShowModal(false);
            setSelectedAddress(null);
            setMessageText('');
            setCalculatedAmount('');
        } catch (error) {
            console.error('Error sending transaction:', error);
            alert('Error sending transaction: ' + (error instanceof Error ? error.message : String(error)));
        }
    };

    // Check balances for all stealth addresses using Base Sepolia
    const checkStealthBalances = async () => {
        if (!bobStealthSequence.length && !aliceStealthSequence.length) return;

        setIsCheckingBalances(true);
        const balanceResults: BalanceData[] = [];

        // Check Bob's sequence
        console.log('Checking Bob\'s stealth addresses...');
        for (const bobAddress of bobStealthSequence) {
            try {
                const balance = await getBalanceFromBaseSepolia(bobAddress.address);
                const decodedMessage = balance !== '0' ? decodeMessageFromBalance(balance) : undefined;

                balanceResults.push({
                    nonce: bobAddress.nonce,
                    address: bobAddress.address,
                    balance: balance,
                    message: decodedMessage,
                    type: 'bob'
                });

                // Stop checking Bob's sequence if we find a zero balance
                if (balance === '0') {
                    console.log(`Found zero balance at Bob nonce ${bobAddress.nonce}, stopping Bob sequence check`);
                    break;
                }
            } catch (error) {
                console.error(`Error checking Bob balance for ${bobAddress.address}:`, error);
                balanceResults.push({
                    nonce: bobAddress.nonce,
                    address: bobAddress.address,
                    balance: '0',
                    type: 'bob'
                });
                break; // Stop on error
            }
        }

        // Check Alice's sequence
        console.log('Checking Alice\'s stealth addresses...');
        for (const aliceAddress of aliceStealthSequence) {
            try {
                const balance = await getBalanceFromBaseSepolia(aliceAddress.address);
                const decodedMessage = balance !== '0' ? decodeMessageFromBalance(balance) : undefined;

                balanceResults.push({
                    nonce: aliceAddress.nonce,
                    address: aliceAddress.address,
                    balance: balance,
                    message: decodedMessage,
                    type: 'alice'
                });

                // Stop checking Alice's sequence if we find a zero balance
                if (balance === '0') {
                    console.log(`Found zero balance at Alice nonce ${aliceAddress.nonce}, stopping Alice sequence check`);
                    break;
                }
            } catch (error) {
                console.error(`Error checking Alice balance for ${aliceAddress.address}:`, error);
                balanceResults.push({
                    nonce: aliceAddress.nonce,
                    address: aliceAddress.address,
                    balance: '0',
                    type: 'alice'
                });
                break; // Stop on error
            }
        }

        setBalanceData(balanceResults);
        setIsCheckingBalances(false);
    };

    // Get balance from Base Sepolia network
    const getBalanceFromBaseSepolia = async (address: string): Promise<string> => {
        try {
            // Try multiple RPC endpoints for Base Sepolia
            const rpcEndpoints = [
                'https://sepolia.base.org',
                'https://base-sepolia.blockscout.com/api',
                'https://base-sepolia-rpc.publicnode.com'
            ];

            for (const endpoint of rpcEndpoints) {
                try {
                    console.log(`Trying RPC endpoint: ${endpoint} for address: ${address}`);

                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            jsonrpc: '2.0',
                            method: 'eth_getBalance',
                            params: [address, 'latest'],
                            id: 1
                        })
                    });

                    if (!response.ok) {
                        console.log(`Endpoint ${endpoint} failed with status: ${response.status}`);
                        continue;
                    }

                    const data = await response.json();
                    console.log(`Response from ${endpoint}:`, data);

                    if (data.result) {
                        // Convert hex to decimal
                        const balanceWei = parseInt(data.result, 16);
                        console.log(`Balance for ${address}: ${balanceWei} wei`);
                        return balanceWei.toString();
                    }
                } catch (endpointError) {
                    console.log(`Endpoint ${endpoint} failed:`, endpointError);
                    continue;
                }
            }

            console.log('All RPC endpoints failed, returning 0');
            return '0';
        } catch (error) {
            console.error('Error fetching balance from Base Sepolia:', error);
            return '0';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
                Stealth Message Checker
            </h2>

            {/* User Info */}
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                    You are: <span className="font-bold text-blue-800">Bob</span>
                </label>
                <p className="text-xs text-gray-800">
                    You can only send messages to your own addresses (you own the private keys)
                </p>
            </div>

            <p className="text-sm text-gray-900 mb-6">
                Checking balances on Base Sepolia network (https://base-sepolia.blockscout.com)
            </p>

            {/* Quick Message Composer */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">✍️ Quick Message Composer</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Message (max 20 characters)
                        </label>
                        <input
                            type="text"
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder="Enter your message"
                            maxLength={20}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        />
                        <p className="text-xs text-gray-700 mt-1">
                            {messageText.length <= 4
                                ? "Single message (4 characters or less)"
                                : `Concatenated message (${messageText.length} characters, ${Math.ceil(messageText.length / 4)} chunks)`
                            }
                        </p>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={calculateMessageAmount}
                            disabled={!messageText.trim()}
                            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Calculate Amount
                        </button>
                    </div>
                </div>

                {calculatedAmount && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">Amount to Send:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-mono text-green-700">
                                    <strong>Wei:</strong> {calculatedAmount}
                                </p>
                                <p className="text-sm text-green-600">
                                    <strong>ETH:</strong> {(() => {
                                        try {
                                            if (!calculatedAmount || !/^\d+$/.test(calculatedAmount)) {
                                                return "Invalid amount";
                                            }
                                            const weiBigInt = BigInt(calculatedAmount);
                                            const ethBigInt = weiBigInt / BigInt(1e18);
                                            const remainder = weiBigInt % BigInt(1e18);
                                            const remainderStr = remainder.toString().padStart(18, '0');
                                            return `${ethBigInt.toString()}.${remainderStr}`;
                                        } catch (error) {
                                            return "Conversion error";
                                        }
                                    })()} ETH
                                </p>
                            </div>
                            <div className="flex items-center">
                                <button
                                    onClick={() => navigator.clipboard.writeText(calculatedAmount)}
                                    className="px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600"
                                >
                                    Copy Wei
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Check Balances Button */}
            <div className="mb-6">
                <button
                    onClick={checkStealthBalances}
                    disabled={!bobStealthSequence.length && !aliceStealthSequence.length || isCheckingBalances}
                    className="px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isCheckingBalances ? 'Checking Balances...' : 'Check All Stealth Address Balances'}
                </button>
                {(!bobStealthSequence.length && !aliceStealthSequence.length) && (
                    <p className="text-xs text-gray-700 mt-2">
                        Generate stealth sequences first to check for messages
                    </p>
                )}
            </div>

            {/* Manual Balance Check */}
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Manual Balance Check</h4>
                <p className="text-sm text-yellow-700 mb-2">
                    Test specific addresses to verify RPC connectivity
                </p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Enter address to check (e.g., 0x855971f4c64cdd5b48c5a5bc00c18c2a843d95d5)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        id="manual-address"
                    />
                    <button
                        onClick={async () => {
                            const address = (document.getElementById('manual-address') as HTMLInputElement)?.value;
                            if (!address) return;

                            console.log(`Manually checking balance for: ${address}`);
                            const balance = await getBalanceFromBaseSepolia(address);
                            console.log(`Manual check result: ${balance} wei`);

                            alert(`Address: ${address}\nBalance: ${balance} wei\nETH: ${(parseInt(balance) / 1e18).toFixed(18)} ETH`);
                        }}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                    >
                        Check Balance
                    </button>
                </div>
            </div>

            {/* Balance Results */}
            {balanceData.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Balance Check Results</h3>

                    {/* Messages Found */}
                    {balanceData.filter(item => item.message).length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-md font-semibold text-green-800 mb-3">📨 Messages Found:</h4>
                            <div className="space-y-2">
                                {balanceData.filter(item => item.message).map((item, index) => (
                                    <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-medium text-green-800">
                                                    {item.type === 'bob' ? 'Bob' : 'Alice'} Nonce {item.nonce}
                                                </p>
                                                <p className="font-mono text-xs text-green-700 break-all mt-1">
                                                    {item.address}
                                                </p>
                                                <p className="text-sm text-green-600 mt-2">
                                                    <strong>Message:</strong> "{item.message}"
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-green-600">
                                                    Balance: {item.balance} wei
                                                </p>
                                                <p className="text-xs text-gray-700 mt-1">
                                                    Last 12 digits: {item.balance.slice(-12)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Side by Side Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Bob's Addresses */}
                        <div className="space-y-2">
                            <h4 className="text-md font-semibold text-blue-800 mb-3">🔵 Bob's Stealth Addresses</h4>
                            {balanceData.filter(item => item.type === 'bob').map((item, index) => (
                                <div key={index} className={`p-3 rounded-lg ${item.message ? 'bg-green-50 border border-green-200' : 'bg-blue-50'
                                    }`}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-sm font-bold ${item.message ? 'text-green-800' : 'text-blue-800'
                                                    }`}>
                                                    Nonce {item.nonce}
                                                </span>
                                                {!item.message && item.type === 'bob' && (
                                                    <button
                                                        onClick={() => openSendModal(item.address, item.nonce, item.type)}
                                                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                                                    >
                                                        Send
                                                    </button>
                                                )}
                                            </div>
                                            <p className="font-mono text-xs text-gray-900 break-all">
                                                {item.address}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900">
                                                {item.balance === '0' ? '0 wei' : `${item.balance} wei`}
                                            </p>
                                            {item.message && (
                                                <p className="text-xs text-green-600 mt-1">
                                                    "{item.message}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Alice's Addresses */}
                        <div className="space-y-2">
                            <h4 className="text-md font-semibold text-pink-800 mb-3">🟣 Alice's Stealth Addresses</h4>
                            {balanceData.filter(item => item.type === 'alice').map((item, index) => (
                                <div key={index} className={`p-3 rounded-lg ${item.message ? 'bg-green-50 border border-green-200' : 'bg-pink-50'
                                    }`}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-sm font-bold ${item.message ? 'text-green-800' : 'text-pink-800'
                                                    }`}>
                                                    Nonce {item.nonce}
                                                </span>
                                                {!item.message && item.type === 'alice' && (
                                                    <button
                                                        onClick={() => openSendModal(item.address, item.nonce, item.type)}
                                                        className="px-3 py-1 bg-pink-600 text-white text-xs rounded-md hover:bg-pink-700 transition-colors"
                                                    >
                                                        Send
                                                    </button>
                                                )}
                                            </div>
                                            <p className="font-mono text-xs text-gray-900 break-all">
                                                {item.address}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900">
                                                {item.balance === '0' ? '0 wei' : `${item.balance} wei`}
                                            </p>
                                            {item.message && (
                                                <p className="text-xs text-green-600 mt-1">
                                                    "{item.message}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* How It Works */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">How Stealth Messaging Works:</h4>
                <ul className="text-sm text-blue-900 space-y-1">
                    <li>• <strong>You send ETH</strong> to your own stealth addresses with encoded messages</li>
                    <li>• <strong>Last 12 digits</strong> of the balance amount encode the message (4 characters max)</li>
                    <li>• <strong>The other party checks</strong> your addresses sequentially until finding a zero balance</li>
                    <li>• <strong>Non-zero balances</strong> indicate messages you've sent to yourself</li>
                    <li>• <strong>Only you can access</strong> the private keys to retrieve your funds</li>
                    <li>• <strong>Sequential checking</strong> stops at first zero balance for efficiency</li>
                </ul>
            </div>

            {/* Send Message Modal */}
            {showModal && selectedAddress && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            Send Message to {selectedAddress.type === 'bob' ? 'Bob' : 'Alice'} Nonce {selectedAddress.nonce}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                    Message (max 4 characters)
                                </label>
                                <input
                                    type="text"
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    placeholder="Enter message"
                                    maxLength={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={calculateMessageAmount}
                                    disabled={!messageText.trim()}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Calculate Amount
                                </button>
                            </div>

                            {calculatedAmount && (
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <h4 className="font-medium text-green-800 mb-2">Amount to Send:</h4>
                                    <p className="text-sm font-mono text-green-700">
                                        {calculatedAmount} wei
                                    </p>
                                    <p className="text-sm text-green-600">
                                        {(() => {
                                            const weiBigInt = BigInt(calculatedAmount);
                                            const ethBigInt = weiBigInt / BigInt(1e18);
                                            const remainder = weiBigInt % BigInt(1e18);
                                            const remainderStr = remainder.toString().padStart(18, '0');
                                            return `${ethBigInt.toString()}.${remainderStr}`;
                                        })()} ETH
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={sendMessage}
                                    disabled={!calculatedAmount || !isConnected || isSending}
                                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSending ? 'Sending...' : 'Send Transaction'}
                                </button>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>

                            {!isConnected && (
                                <p className="text-sm text-red-600">
                                    Please connect your wallet to send transactions
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
