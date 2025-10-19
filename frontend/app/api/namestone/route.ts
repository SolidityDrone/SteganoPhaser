import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, namehash } from 'viem';
import { sepolia } from 'viem/chains';

// Sepolia ENS Contract Addresses
const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';

// ENS Registry ABI - only the functions we need
const ENS_REGISTRY_ABI = [
    {
        inputs: [{ name: 'node', type: 'bytes32' }],
        name: 'resolver',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function'
    }
] as const;

// Public Resolver ABI - for text records
const RESOLVER_ABI = [
    {
        inputs: [
            { name: 'node', type: 'bytes32' },
            { name: 'key', type: 'string' }
        ],
        name: 'text',
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function'
    }
] as const;

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const domain = searchParams.get('domain');

        if (!domain) {
            return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
        }

        console.log('Resolving ENS name:', domain);

        // Create public client for Sepolia
        const client = createPublicClient({
            chain: sepolia,
            transport: http('https://1rpc.io/sepolia')
        });

        // Compute the namehash for the domain
        const node = namehash(domain);
        console.log('Namehash:', node);

        // Get the resolver address from the registry
        let resolverAddress: `0x${string}`;
        try {
            resolverAddress = await client.readContract({
                address: ENS_REGISTRY_ADDRESS,
                abi: ENS_REGISTRY_ABI,
                functionName: 'resolver',
                args: [node]
            });
            console.log('Resolver address:', resolverAddress);
        } catch (error) {
            console.error('Failed to get resolver address:', error);
            return NextResponse.json({
                error: 'Failed to get resolver address. Domain may not be registered on Sepolia.'
            }, { status: 404 });
        }

        // Check if resolver is set (zero address means no resolver)
        if (resolverAddress === '0x0000000000000000000000000000000000000000') {
            return NextResponse.json({
                error: 'No resolver set for this domain on Sepolia testnet'
            }, { status: 404 });
        }

        // Get the text record from the resolver
        let description: string;
        try {
            description = await client.readContract({
                address: resolverAddress,
                abi: RESOLVER_ABI,
                functionName: 'text',
                args: [node, 'description']
            });
            console.log('Description:', description);
        } catch (error) {
            console.error('Failed to get text record:', error);
            return NextResponse.json({
                error: 'Failed to retrieve description text record'
            }, { status: 500 });
        }

        // Check if description is empty
        if (!description || description === '') {
            return NextResponse.json({
                error: 'No description text record found for this domain'
            }, { status: 404 });
        }

        return NextResponse.json([{
            domain: domain,
            text_records: {
                description: description
            }
        }]);

    } catch (error) {
        console.error('ENS resolution error:', error);
        return NextResponse.json(
            { error: `Failed to resolve ENS name: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
        );
    }
}