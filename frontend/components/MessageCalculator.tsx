'use client';

import { useState } from 'react';

export default function MessageCalculator() {
    const [message, setMessage] = useState<string>('');
    const [encodedAmount, setEncodedAmount] = useState<string>('');
    const [last12Digits, setLast12Digits] = useState<string>('');

    // Encode message in the last 12 digits of a balance amount
    const encodeMessageInBalance = (message: string): string => {
        // Take only first 4 characters to fit in 12 digits
        const truncatedMessage = message.slice(0, 4);
        const truncatedCodes = Array.from(truncatedMessage).map(char => char.charCodeAt(0).toString().padStart(3, '0'));

        // Combine into 12-digit string
        const encodedDigits = truncatedCodes.join('').padEnd(12, '0');

        // Create a balance amount with these last 12 digits
        const baseAmount = '1000000000000000000'; // 1 ETH in wei
        const last12Digits = encodedDigits;
        const fullAmount = baseAmount.slice(0, -12) + last12Digits;

        return fullAmount;
    };

    // Calculate the amount to send
    const calculateAmount = () => {
        if (!message.trim()) return;

        const amount = encodeMessageInBalance(message);
        const last12 = amount.slice(-12);

        setEncodedAmount(amount);
        setLast12Digits(last12);
    };

    // Convert wei to ETH
    const weiToEth = (wei: string): string => {
        const eth = parseInt(wei) / 1e18;
        return eth.toFixed(18);
    };

    // Get ASCII codes for display
    const getAsciiCodes = (message: string): number[] => {
        return Array.from(message.slice(0, 4)).map(char => char.charCodeAt(0));
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
                Message Calculator
            </h2>
            <p className="text-sm text-gray-600 mb-6">
                Calculate the exact ETH amount to send for encoding a message in the last 12 digits
            </p>

            {/* Message Input */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message to Encode (max 4 characters)
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Enter message (e.g., Gang)"
                        maxLength={4}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={calculateAmount}
                        disabled={!message.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Calculate
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    Only the first 4 characters will be used for encoding
                </p>
            </div>

            {/* Results */}
            {encodedAmount && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Encoding Results</h3>

                    {/* Message Analysis */}
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Message Analysis</h4>
                        <div className="space-y-2">
                            <p className="text-sm">
                                <strong>Message:</strong> "{message.slice(0, 4)}"
                            </p>
                            <p className="text-sm">
                                <strong>ASCII Codes:</strong> {getAsciiCodes(message).join(', ')}
                            </p>
                            <p className="text-sm">
                                <strong>Padded Codes:</strong> {getAsciiCodes(message).map(code => code.toString().padStart(3, '0')).join('')}
                            </p>
                        </div>
                    </div>

                    {/* Amount to Send */}
                    <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">Amount to Send</h4>
                        <div className="space-y-2">
                            <p className="text-sm font-mono">
                                <strong>Wei:</strong> {encodedAmount}
                            </p>
                            <p className="text-sm">
                                <strong>ETH:</strong> {weiToEth(encodedAmount)} ETH
                            </p>
                            <p className="text-sm">
                                <strong>Last 12 digits:</strong> {last12Digits}
                            </p>
                        </div>
                    </div>

                    {/* Copy Functionality */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigator.clipboard.writeText(encodedAmount)}
                            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                        >
                            Copy Wei Amount
                        </button>
                        <button
                            onClick={() => navigator.clipboard.writeText(weiToEth(encodedAmount))}
                            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                        >
                            Copy ETH Amount
                        </button>
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">How to Use:</h4>
                <ol className="text-sm text-yellow-700 space-y-1">
                    <li>1. Enter your message (max 4 characters)</li>
                    <li>2. Click "Calculate" to get the exact amount</li>
                    <li>3. Send that exact amount to a stealth address</li>
                    <li>4. The message will be encoded in the last 12 digits</li>
                    <li>5. Bob can decode it using the "Check Messages" tab</li>
                </ol>
            </div>

            {/* Example */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Example: "Gang"</h4>
                <div className="text-sm text-gray-700 space-y-1">
                    <p>• ASCII: 71, 97, 110, 103</p>
                    <p>• Padded: 071097110103</p>
                    <p>• Amount: 1000000000000071097110103 wei</p>
                    <p>• ETH: 1.000000000000071097 ETH</p>
                </div>
            </div>
        </div>
    );
}
