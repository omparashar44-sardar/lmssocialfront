
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { clearSession } from '../services/auth.js';

export default function DashboardLayout() {

  const navigate = useNavigate();
  const location = useLocation();

  const role = localStorage.getItem('role');
  const userName = localStorage.getItem('userName');

  const adminNav = [
    { to: '/app', label: 'Dashboard' },
    { to: '/app/courses', label: 'Courses' },
    { to: '/app/users', label: 'Users' },
    { to: '/app/certificates', label: 'Certificates' },
    { to: '/app/compliance', label: 'Compliance' },
    { to: '/app/settings', label: 'Settings' },
  ];

  const superAdminNav = [
    { to: '/app', label: 'Super Admin' },
    { to: '/app/settings', label: 'Settings' },
  ];

  const employeeNav = [
    { to: '/app', label: 'Dashboard' },
    { to: '/app/courses', label: 'My Training' },
    { to: '/app/certificates', label: 'Certificates' },
  ];

  const navItems = role === 'super_admin' ? superAdminNav : role === 'admin' ? adminNav : employeeNav;

  const logout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#f5f0e6] via-[#f7f4ed] to-[#ebe3d2] overflow-x-hidden">

      {/* Animated background blobs */}
      <div className="bg-blobs" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <header className="sticky top-0 z-50 px-6 pt-6">

        <div className="max-w-7xl mx-auto">

          <div className="glass-strong rounded-[28px] px-8 py-5 float-in">

            <div className="flex items-center justify-between">

              <div>
                <h1 className="text-2xl font-bold text-[#26331a]">
                  RelocateLearn
                </h1>

                <p className="text-xs text-gray-600 mt-1">
                  Professional Relocation LMS
                </p>
              </div>

              <div className="relative flex items-center gap-2 glass-subtle p-2 rounded-2xl">

                {navItems.map((item) => {

                  const active = location.pathname === item.to;

                  return (

                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/app'}
                      className={`relative px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-500 ease-out ${
                        active
                        ? 'text-[#26331a]'
                        : 'text-[#26331a]/70 hover:text-[#26331a]'
                      }`}
                    >

                      {active && (
                        <div className="absolute inset-0 rounded-2xl glass-pill transition-all duration-500" />
                      )}

                      <span className="relative z-10">
                        {item.label}
                      </span>

                    </NavLink>

                  )
                })}

              </div>

              <div className="flex items-center gap-4">

                <div className="hidden md:block text-right">
                  <p className="text-xs text-gray-500">
                    Logged in as
                  </p>

                  <p className="font-semibold text-[#26331a]">
                    {userName}
                  </p>
                </div>

                <button
                  onClick={logout}
                  className="bg-[#26331a]/90 hover:bg-[#334524] text-white px-5 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg shadow-[#26331a]/20 backdrop-blur"
                >
                  Logout
                </button>

              </div>

            </div>

          </div>

        </div>

      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-8 py-10">
        <Outlet />
      </main>

    </div>
  );
}
