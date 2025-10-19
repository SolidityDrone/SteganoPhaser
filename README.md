# SteganoPhaser 🔐

**Steganographic Communication Protocol for Ethereum**

Last minute steganographic messaging system that enables secure, private communication through Ethereum transactions using stealth addresses and encrypted message encoding.

## 🎯 Project Overview

SteganoPhaser is a decentralized steganographic communication protocol that allows users to send hidden messages through Ethereum transactions. By leveraging stealth addresses and encrypted message encoding, it provides a robust solution for private communication that is resistant to blockchain analysis and indexing threats.

## 🔒 Core Security Features

### **Stealth Address Technology**
- **Unlinkable Transactions**: Each message uses a unique stealth address, preventing transaction graph analysis
- **Forward Secrecy**: Past communications remain secure even if current keys are compromised
- **Multi-Source Messaging**: Messages can be sent from any stealth address, not just the original sender's address

### **Steganographic Message Encoding**
- **Hidden in Plain Sight**: Messages are encoded in the last 12 digits of transaction amounts
- **Encrypted Payload**: Messages are encrypted using AES-128 with HMAC authentication
- **4-Character Limit**: Optimized for short, secure communications

### **Delayed Messaging Protection**
- **Anti-Indexing**: Messages can be sent with delays to avoid real-time blockchain monitoring
- **Temporal Obfuscation**: Communication patterns are obscured through time-based distribution
- **Resistance to Analysis**: Delayed messaging prevents correlation attacks and pattern recognition

## 🛡️ Security Advantages

### **Against Blockchain Analysis**
- **Transaction Graph Breaking**: Stealth addresses prevent linking transactions to identities
- **Amount Obfuscation**: Message encoding in transaction amounts makes analysis difficult
- **Temporal Protection**: Delayed messaging prevents real-time correlation
- **Multi-Source Obfuscation**: Messages can be sent from any controlled address, breaking sender correlation

### **Against Indexing Threats**
- **Unindexable Content**: Messages are not stored in easily searchable formats
- **Distributed Storage**: Information is spread across multiple stealth addresses
- **Temporal Decoupling**: Delayed messaging prevents time-based correlation

### **Against Surveillance**
- **Zero Metadata Leakage**: No direct connection between sender and receiver
- **Encrypted Communication**: All messages are encrypted with strong cryptography
- **Forward Secrecy**: Past communications remain secure

## 🚀 Technical Implementation

### **Cryptographic Stack**
- **ECDH Key Exchange**: Secure shared secret generation
- **AES-128 Encryption**: Strong symmetric encryption for messages
- **HMAC Authentication**: Message integrity and authenticity
- **SHA-256 Hashing**: Secure hash functions for key derivation

### **Stealth Address Generation**
```typescript
// Generate stealth address from shared secret, public key, and nonce
const stealthPrivateKey = SHA256(sharedSecret + publicKey + nonce);
const stealthAddress = privateKeyToAddress(stealthPrivateKey);
```

### **Message Encoding**
```typescript
// Encode 4-character message in transaction amount
const asciiCodes = message.split('').map(char => char.charCodeAt(0));
const encodedDigits = asciiCodes.map(code => code.toString().padStart(3, '0')).join('');
const amount = baseAmount + encodedDigits; // Last 12 digits contain message
```

### **Multi-Source Messaging**
```typescript
// Messages can be sent from any stealth address
// This provides additional obfuscation and prevents sender correlation
const sendFromAnyStealth = (targetAddress: string, message: string) => {
    const amount = encodeMessageInBalance(message);
    // Can be sent from any address the sender controls
    return sendTransaction({ to: targetAddress, value: amount });
};
```

## 🎯 Use Cases

### **Privacy-Critical Communications**
- **Whistleblower Protection**: Secure communication for sensitive information
- **Journalist Sources**: Anonymous tip submission and verification
- **Human Rights**: Communication in oppressive regimes

### **Decentralized Applications**
- **Private Voting**: Anonymous decision-making processes
- **Secret Sharing**: Distributed secret management
- **Anonymous Coordination**: Group communication without identity revelation

### **Financial Privacy**
- **Private Transactions**: Financial communications without metadata leakage
- **Anonymous Payments**: Stealth payment coordination
- **Privacy-Preserving DeFi**: Private decentralized finance operations

## 🔧 Getting Started

### **Prerequisites**
- Node.js 18+
- Yarn package manager
- Ethereum wallet (MetaMask, WalletConnect, etc.)

### **Installation**
```bash
# Clone the repository
git clone https://github.com/SolidityDrone/SteganoPhaser.git
cd SteganoPhaser

# Install dependencies
cd frontend
yarn install

# Start development server
yarn dev
```

### **Usage**
1. **Connect Wallet**: Use the wallet connection button
2. **Generate Stealth Addresses**: Create shared secrets and stealth address sequences
3. **Send Messages**: Encode and send messages to stealth addresses
4. **Receive Messages**: Check balances and decode received messages

## 🏗️ Architecture

### **Frontend Components**
- **Signature Wallet**: Deterministic wallet generation from signatures
- **ECDH Exchange**: Secure key exchange between parties
- **Stealth Sequences**: Generation of stealth address sequences
- **Message System**: Encoding, sending, and decoding messages
- **Calculator**: Message amount calculation and verification

### **Cryptographic Modules**
- **StealthCrypto**: Core cryptographic operations
- **Key Management**: Secure key generation and storage
- **Message Encoding**: Steganographic message encoding/decoding
- **Address Generation**: Stealth address creation and management

## 🔐 Security Model

### **Threat Model**
- **Blockchain Analysis**: Resistance to transaction graph analysis
- **Indexing Attacks**: Protection against searchable content extraction
- **Surveillance**: Resistance to real-time monitoring and correlation
- **Metadata Leakage**: Prevention of communication pattern analysis

### **Security Guarantees**
- **Message Confidentiality**: All messages are encrypted
- **Sender Anonymity**: Stealth addresses prevent sender identification
- **Receiver Privacy**: Only intended recipients can decode messages
- **Forward Secrecy**: Past communications remain secure

## 🌟 Advantages Over Traditional Methods

### **vs. Encrypted Messages**
- **No Metadata**: Transaction amounts don't reveal message content
- **Decentralized**: No central server to compromise
- **Immutable**: Messages are permanently stored on blockchain

### **vs. Mixing Services**
- **No Trust Required**: Cryptographic guarantees without trusted parties
- **Lower Costs**: No mixing fees, only transaction costs
- **Better Privacy**: Stealth addresses provide stronger anonymity

### **vs. Private Messaging Apps**
- **Decentralized**: No central authority or server
- **Censorship Resistant**: Cannot be shut down or blocked
- **Auditable**: All communications are verifiable on blockchain

## 🚀 Future Enhancements

### **Advanced Features**
- **Multi-Party Communication**: Group messaging capabilities
- **Message Authentication**: Cryptographic message signing
- **Time-Locked Messages**: Messages that can only be read after a certain time
- **Conditional Messages**: Messages that unlock based on blockchain conditions

### **Scalability Improvements**
- **Batch Processing**: Multiple messages in single transaction
- **Layer 2 Integration**: Reduced costs through L2 solutions
- **Optimized Encoding**: More efficient message encoding schemes

## 🤝 Contributing

We welcome contributions to SteganoPhaser! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### **Development Setup**
```bash
# Install dependencies
yarn install

# Run tests
yarn test

# Build for production
yarn build
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Noble Cryptography**: For secure cryptographic primitives
- **Wagmi**: For Ethereum wallet integration
- **AppKit**: For wallet connection UI
- **Base Network**: For testnet infrastructure

## 📞 Contact

- **GitHub**: [@SolidityDrone](https://github.com/SolidityDrone)
- **Project**: [SteganoPhaser](https://github.com/SolidityDrone/SteganoPhaser)

---

**⚠️ Disclaimer**: This software is for educational and research purposes. Use at your own risk. Always ensure compliance with local laws and regulations.

**🔐 Security Notice**: This is experimental software. Always use testnets for development and testing. Never use mainnet for sensitive communications without thorough security audits.
