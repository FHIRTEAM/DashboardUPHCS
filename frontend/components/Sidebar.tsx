'use client';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react'; // 

export default function Sidebar() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  const links = [
    { name: 'Dashboard', path: '/' },
    { name: 'Conditions & Visits', path: '/conditions' },
    { name: 'Patient Metrics', path: '/metrics' }
  ];

  return (
    <aside
      className={`min-h-screen ${
        collapsed ? 'w-20' : 'w-64'
      } bg-white px-6 py-8 shadow-xl flex flex-col justify-between sticky top-0 transition-all duration-300`}
    >
      {/* Top section: Toggle + Title + Navigation */}
      <div>
        <div className="flex justify-between items-center mb-6">
          {!collapsed && (
            <h2 className="text-2xl font-extrabold tracking-tight text-rose-900">
              FHIR Dashboard
            </h2>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-rose-700 p-1 rounded hover:bg-rose-100 transition"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          {links.map((link) => (
            <Link key={link.path} href={link.path}>
              <span
                className={`block px-4 py-2 rounded-lg cursor-pointer text-sm font-medium transition-all duration-200 ${
                  router.pathname === link.path
                    ? 'bg-rose-100 text-rose-800 font-semibold shadow'
                    : 'text-stone-700 hover:bg-rose-200 hover:text-rose-900'
                }`}
                title={collapsed ? link.name : ''}
              >
                {collapsed ? (
                  <div className="w-2 h-2 bg-rose-400 rounded-full mx-auto" />
                ) : (
                  link.name
                )}
              </span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Bottom section: Footer */}
      <div
        className={`text-xs text-stone-400 ${
          collapsed ? 'text-center px-0' : 'px-4'
        } pt-10 border-t border-rose-200`}
      >
        {!collapsed && '© 2025 CoCM Platform'}
      </div>
    </aside>
  );
}
