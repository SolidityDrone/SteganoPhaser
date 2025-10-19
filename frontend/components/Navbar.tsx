'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';


export default function Navbar() {
    const pathname = usePathname();
    const { address } = useAccount();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 bg-gray-900/50 backdrop-blur-sm shadow-lg z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">

                        <Link href="/" className="text-xl font-bold text-white hover:text-green-300 transition-colors duration-200">
                            Gazometer
                            <span className="text-xs font-normal text-gray-400 ml-2">Demo</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            <Link
                                href="/initialize"
                                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${pathname === '/initialize'
                                    ? 'bg-green-600/50 text-white'
                                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                                    }`}
                            >
                                Initialize
                            </Link>
                            <Link
                                href="/sign"
                                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${pathname === '/sign'
                                    ? 'bg-green-600/50 text-white'
                                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                                    }`}
                            >
                                Craft receipt
                            </Link>
                            <Link
                                href="/self-service"
                                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${pathname === '/self-service'
                                    ? 'bg-green-600/50 text-white'
                                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                                    }`}
                            >
                                Deposit / Withdraw
                            </Link>

                            <appkit-button />
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            aria-expanded="false"
                        >
                            <span className="sr-only">Open main menu</span>
                            {!isMobileMenuOpen ? (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            ) : (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-900/90 backdrop-blur-sm">
                        <Link
                            href="/initialize"
                            className={`block px-3 py-2 text-base font-medium transition-colors duration-200 ${pathname === '/initialize'
                                ? 'bg-green-600/50 text-white'
                                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                                }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Initialize
                        </Link>
                        <Link
                            href="/sign"
                            className={`block px-3 py-2 text-base font-medium transition-colors duration-200 ${pathname === '/sign'
                                ? 'bg-green-600/50 text-white'
                                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                                }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Craft receipt
                        </Link>
                        <Link
                            href="/self-service"
                            className={`block px-3 py-2 text-base font-medium transition-colors duration-200 ${pathname === '/self-service'
                                ? 'bg-green-600/50 text-white'
                                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                                }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Deposit / Withdraw
                        </Link>




                        <div className="border-t border-gray-700 pt-4 mt-4 px-3">
                            <appkit-button />
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
} 