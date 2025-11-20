'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import LoginModal from '@/components/auth/LoginModal';
import UserDropdown from '@/components/auth/UserDropdown';
import { useAuth } from '@/hooks/useAuth';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Re-render khi user thay đổi
  useEffect(() => {
    if (user) {
      setIsLoginModalOpen(false);
    }
  }, [user]);

  return (
    <nav className="bg-white shadow-md w-full z-100">
      <div className="mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="shrink-0">
            <Link href="/" className="flex items-center">
              <Image src="/logo.png" alt="Smart Travel Logo" width={40} height={40} />
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-blue-900 hover:text-blue-700 font-medium">Trang chủ</Link>
            <Link href="/about" className="text-blue-900 hover:text-blue-700 font-medium">Về chúng tôi</Link>
            <Link href="/contact" className="text-blue-900 hover:text-blue-700 font-medium">Liên hệ</Link>
          </div>
          <div className="flex items-center">
            <div className="hidden md:flex items-center mr-4">
            {isClient && !loading && user ? (
              <UserDropdown user={user} onLogout={logout} />
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="text-blue-900 hover:text-blue-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            )}
          </div>
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsOpen(!isOpen)} className="text-blue-900 hover:text-blue-700 focus:outline-none">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          {isClient && !loading && user && (
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <Image
                  src={user.img}
                  alt={user.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" className="block px-3 py-2 rounded-md text-base font-medium text-blue-900 hover:text-blue-700 hover:bg-gray-50">Trang chủ</Link>
            <Link href="/about" className="block px-3 py-2 rounded-md text-base font-medium text-blue-900 hover:text-blue-700 hover:bg-gray-50">Về chúng tôi</Link>
            <Link href="/contact" className="block px-3 py-2 rounded-md text-base font-medium text-blue-900 hover:text-blue-700 hover:bg-gray-50">Liên hệ</Link>
            {isClient && !loading && user && (
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Đăng xuất
              </button>
            )}
            {isClient && !loading && !user && (
              <button
                onClick={() => {
                  setIsLoginModalOpen(true);
                  setIsOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-blue-900 hover:text-blue-700 hover:bg-gray-50"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </nav>
  );
};

export default Navbar;
