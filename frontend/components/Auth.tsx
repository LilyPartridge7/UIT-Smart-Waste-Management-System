import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { apiLogin } from '../services/mockApi';
import { User as UserIcon, Lock, Key, Briefcase, GraduationCap, School } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const user = await apiLogin(username, password);
        onLogin(user);
      } else {
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters.");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        if (!identifier) {
            throw new Error(role === UserRole.STUDENT ? "Roll Number is required" : role === UserRole.TEACHER ? "Faculty ID is required" : "Staff ID is required");
        }
        await new Promise(r => setTimeout(r, 1000));
        onLogin({ username, role, identifier });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-uit-card w-full max-w-md p-8 rounded-2xl shadow-xl border-t-4 border-uit-neon transition-colors duration-300">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">UIT Waste<span className="text-uit-neon">.sys</span></h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {isLogin ? "Welcome back, eco-warrior!" : "Join the Green Campus Initiative"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-500 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium animate-pulse flex items-center gap-2">
               <span>⚠️</span> {error}
            </div>
          )}

          {!isLogin && (
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Role</label>
                <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-uit-neon dark:text-white"
                >
                    <option value={UserRole.STUDENT}>Student</option>
                    <option value={UserRole.TEACHER}>Teacher</option>
                    <option value={UserRole.COLLECTOR}>Collector (Staff)</option>
                </select>
            </div>
          )}

          <div className="relative">
            <UserIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-uit-neon focus:border-transparent outline-none dark:text-white transition-all"
              required
            />
          </div>

          {!isLogin && (
            <div className="relative animate-fade-in">
              {role === UserRole.STUDENT && <GraduationCap className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />}
              {role === UserRole.TEACHER && <School className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />}
              {role === UserRole.COLLECTOR && <Briefcase className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />}
              <input
                type="text"
                placeholder={
                  role === UserRole.STUDENT ? "Roll Number (e.g., 5CS-123)" :
                  role === UserRole.TEACHER ? "Faculty ID" : "Staff ID"
                }
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-uit-neon focus:border-transparent outline-none dark:text-white transition-all"
                required
              />
            </div>
          )}

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-uit-neon focus:border-transparent outline-none dark:text-white transition-all ${
                !isLogin && password.length > 0 && password.length < 8 ? 'border-uit-danger' : 'border-gray-200 dark:border-gray-700'
              }`}
              required
            />
             {!isLogin && password.length > 0 && password.length < 8 && (
              <span className="text-xs text-uit-danger mt-1 block">Min 8 characters required</span>
            )}
          </div>

          {!isLogin && (
            <div className="relative">
              <Key className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="password"
                placeholder="Rewrite Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-uit-neon focus:border-transparent outline-none dark:text-white transition-all ${
                  confirmPassword && password !== confirmPassword ? 'border-uit-danger' : 'border-gray-200 dark:border-gray-700'
                }`}
                required
              />
               {confirmPassword && password !== confirmPassword && (
                 <span className="text-xs text-uit-danger mt-1 block">Passwords do not match</span>
               )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-uit-accent to-uit-neon text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-uit-neon/50 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : (isLogin ? "Login" : "Register")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(null); setIdentifier(''); setPassword(''); setConfirmPassword(''); }}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-uit-neon dark:hover:text-uit-neon font-medium"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;