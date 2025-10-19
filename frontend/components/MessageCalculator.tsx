'use client';

import { useState } from 'react';

export default function MessageCalculator() {
    const [message, setMessage] = useState<string>('');
    const [encodedAmount, setEncodedAmount] = useState<string>('');
    const [last12Digits, setLast12Digits] = useState<string>('');
    const [messageChunks, setMessageChunks] = useState<Array<{ chunk: string, sequence: number, total: number, amount: string }>>([]);
    const [showConcatenated, setShowConcatenated] = useState<boolean>(false);

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

    // Split long message into chunks for multiple nonces
    const splitMessageIntoChunks = (message: string): string[] => {
        const chunks = [];
        for (let i = 0; i < message.length; i += 4) {
            chunks.push(message.slice(i, i + 4));
        }
        return chunks;
    };

    // Encode message chunk with sequence number
    const encodeMessageChunk = (chunk: string, sequenceNumber: number, totalChunks: number): string => {
        try {
            // Validate sequence numbers
            if (sequenceNumber < 1 || totalChunks < 1 || sequenceNumber > totalChunks) {
                throw new Error('Invalid sequence numbers');
            }

            // Convert chunk characters to ASCII codes and then to 3-digit strings
            const asciiCodes = Array.from(chunk).map(char => {
                const code = char.charCodeAt(0);
                // Ensure valid ASCII range
                if (code < 0 || code > 127) {
                    return '000'; // Invalid character becomes 000
                }
                return code.toString().padStart(3, '0');
            });

            // Take only first 2 characters (6 digits total) for the message part
            const messageStr = asciiCodes.join('').slice(0, 6).padEnd(6, '0');

            // Add sequence info: first 3 digits = sequence, next 3 = total, last 6 = message
            const sequenceStr = sequenceNumber.toString().padStart(3, '0');
            const totalStr = totalChunks.toString().padStart(3, '0');

            const encodedDigits = sequenceStr + totalStr + messageStr;

            // Create a balance amount with these last 12 digits
            const baseAmount = '1000000000000'; // 1 trillion wei
            const fullAmount = baseAmount.slice(0, -12) + encodedDigits;

            return fullAmount;
        } catch (error) {
            console.error('Error encoding message chunk:', error);
            return '1000000000000'; // Return base amount on error
        }
    };

    // Calculate the amount to send
    const calculateAmount = () => {
        if (!message.trim()) return;

        if (message.length <= 4) {
            // Single message (4 characters or less)
            const amount = encodeMessageInBalance(message);
            const last12 = amount.slice(-12);

            setEncodedAmount(amount);
            setLast12Digits(last12);
            setMessageChunks([]);
            setShowConcatenated(false);
        } else {
            // Concatenated message (more than 4 characters)
            const chunks = splitMessageIntoChunks(message);
            const chunkData = chunks.map((chunk, index) => ({
                chunk,
                sequence: index + 1,
                total: chunks.length,
                amount: encodeMessageChunk(chunk, index + 1, chunks.length)
            }));

            setMessageChunks(chunkData);
            setShowConcatenated(true);
            setEncodedAmount(''); // Clear single message data
            setLast12Digits('');
        }
    };

    // Convert wei to ETH with proper precision
    const weiToEth = (wei: string): string => {
        try {
            // Validate that wei is a valid number string
            if (!wei || !/^\d+$/.test(wei)) {
                return "Invalid amount";
            }

            const weiBigInt = BigInt(wei);
            const ethBigInt = weiBigInt / BigInt(1e18);
            const remainder = weiBigInt % BigInt(1e18);
            const remainderStr = remainder.toString().padStart(18, '0');

            // If the amount is less than 1 ETH, show as 0.xxxxx
            if (ethBigInt === 0n) {
                return `0.${remainderStr}`;
            }

            return `${ethBigInt.toString()}.${remainderStr}`;
        } catch (error) {
            console.error('Error converting wei to ETH:', error);
            return "Conversion error";
        }
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
            <p className="text-sm text-gray-800 mb-6">
                Calculate the exact ETH amount to send for encoding a message in the last 12 digits
            </p>

            {/* Message Input */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                    Message to Encode (max 4 characters)
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Enter message (e.g., Gang or HelloWorld)"
                        maxLength={20}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                    <button
                        onClick={calculateAmount}
                        disabled={!message.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Calculate
                    </button>
                </div>
                <p className="text-xs text-gray-700 mt-1">
                    {message.length <= 4
                        ? "Single message encoding (4 characters or less)"
                        : `Concatenated message encoding (${message.length} characters, ${Math.ceil(message.length / 4)} chunks)`
                    }
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
                            <p className="text-sm text-gray-900">
                                <strong>Message:</strong> "{message.slice(0, 4)}"
                            </p>
                            <p className="text-sm text-gray-900">
                                <strong>ASCII Codes:</strong> {getAsciiCodes(message).join(', ')}
                            </p>
                            <p className="text-sm text-gray-900">
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

            {/* Concatenated Message Results */}
            {showConcatenated && messageChunks.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Concatenated Message Results</h3>

                    <div className="p-4 bg-purple-50 rounded-lg">
                        <h4 className="font-medium text-purple-800 mb-2">Message Chunks</h4>
                        <p className="text-sm text-gray-900 mb-3">
                            <strong>Full Message:</strong> "{message}" ({message.length} characters)
                        </p>
                        <p className="text-sm text-gray-900 mb-3">
                            <strong>Total Chunks:</strong> {messageChunks.length} (send to {messageChunks.length} different nonces)
                        </p>

                        <div className="space-y-3">
                            {messageChunks.map((chunk, index) => (
                                <div key={index} className="p-3 bg-white rounded border">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium text-gray-900">
                                            Chunk {chunk.sequence}/{chunk.total}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            Nonce {index}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-gray-900">
                                            <strong>Content:</strong> "{chunk.chunk}"
                                        </p>
                                        <p className="text-sm font-mono text-gray-700">
                                            <strong>Wei:</strong> {chunk.amount}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                            <strong>ETH:</strong> {weiToEth(chunk.amount)} ETH
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-lg">
                        <h4 className="font-medium text-yellow-800 mb-2">How to Send Concatenated Messages:</h4>
                        <ol className="text-sm text-yellow-700 space-y-1">
                            <li>1. Send each chunk to a different stealth address (different nonce)</li>
                            <li>2. Send chunks in sequence order (chunk 1 to nonce 0, chunk 2 to nonce 1, etc.)</li>
                            <li>3. The receiver will automatically concatenate the chunks</li>
                            <li>4. Each chunk contains sequence info for proper ordering</li>
                        </ol>
                    </div>
                </div>
            )}

            {/* Example */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Example: "Gang"</h4>
                <div className="text-sm text-gray-900 space-y-1">
                    <p>• ASCII: 71, 97, 110, 103</p>
                    <p>• Padded: 071097110103</p>
                    <p>• Amount: 1000000000000071097110103 wei</p>
                    <p>• ETH: 1.000000000000071097 ETH</p>
                </div>
            </div>
        </div>
    );
}
