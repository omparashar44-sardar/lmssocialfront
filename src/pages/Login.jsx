
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { loginUser, persistSession } from '../services/auth.js';

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await loginUser({ email, password });
      persistSession(response);
      navigate('/app');
    } catch (loginError) {
      setError(loginError.message || 'Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f0e6] via-white to-[#f5f0e6]">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-6 px-6">

        {/* LEFT SIDE */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#556b2f] rounded-3xl text-white p-10 shadow-2xl"
        >
          <h1 className="text-4xl font-bold mb-4">RelocateLearn</h1>

          <p className="text-sm text-[#f0ead6] leading-7">
            Professional LMS platform designed for relocation businesses.
            Train employees, manage compliance, issue certificates,
            and track operational readiness from one centralized platform.
          </p>

          <div className="mt-10 space-y-4">
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="font-semibold">✔ Employee Training</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-4">
              <p className="font-semibold">✔ Quiz & Certification System</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-4">
              <p className="font-semibold">✔ HR & Compliance Tracking</p>
            </div>
          </div>
        </motion.div>

        {/* RIGHT SIDE */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-3xl p-10 shadow-xl"
        >
          <h2 className="text-3xl font-bold text-[#556b2f] mb-2">
            Login
          </h2>

          <p className="text-sm text-gray-500 mb-8">
            Access your LMS dashboard
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="text-sm text-gray-600">Email</label>

              <input
                type="email"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                placeholder="Enter email"
                className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#556b2f]"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Password</label>

              <input
                type="password"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#556b2f]"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#556b2f] hover:bg-[#6b8e23] text-white py-3 rounded-xl font-semibold transition-all"
            >
              {isSubmitting ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <div className="mt-8 text-xs text-gray-500">
            <div className="bg-[#f5f0e6] rounded-xl p-3">
              <p className="font-semibold text-[#556b2f]">Backend Login</p>
              <p>Use an email and password that exist in the backend database.</p>
            </div>
          </div>

        </motion.div>

      </div>
    </div>
  );
}
