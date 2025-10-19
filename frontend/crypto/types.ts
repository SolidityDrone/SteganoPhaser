export interface StealthKeyPair {
    privateKey: Uint8Array;
    publicKey: Uint8Array;
    address: string;
}

export interface SharedSecret {
    secret: Uint8Array;
    seed: string; // hex string of the hashed shared secret
}

export interface StealthAddress {
    address: string;
    nonce: number;
    seed: string;
}

export interface EncryptedMessage {
    encrypted: Uint8Array;
    amount: bigint; // The amount to send to make the message discoverable
}

export interface StealthConfig {
    rpcUrl: string;
    factoryContractAddress: string;
    privateKey: string;
    namestoneApiKey?: string;
    namestoneDomain?: string;
}
