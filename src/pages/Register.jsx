import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function validateRegistration(formData) {
  if (!formData.full_name.trim()) {
    return 'Full name is required.'
  }

  if (formData.full_name.trim().length < 2) {
    return 'Full name must be at least 2 characters long.'
  }

  if (!formData.email.trim()) {
    return 'Email is required.'
  }

  if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
    return 'Please enter a valid email address.'
  }

  if (formData.phone && !/^\d{9,11}$/.test(formData.phone.trim())) {
    return 'Phone number must contain 9 to 11 digits only.'
  }

  if (formData.dob && Number.isNaN(Date.parse(formData.dob))) {
    return 'Date of birth is invalid.'
  }

  if (!formData.username.trim()) {
    return 'Username is required.'
  }

  if (!/^[a-zA-Z0-9_]{4,20}$/.test(formData.username.trim())) {
    return 'Username must be 4-20 characters and contain only letters, numbers, or underscore.'
  }

  if (!formData.password) {
    return 'Password is required.'
  }

  if (formData.password.length < 8) {
    return 'Password must be at least 8 characters long.'
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(formData.password)) {
    return 'Password must include uppercase, lowercase, number, and symbol.'
  }

  if (formData.password !== formData.confirmPassword) {
    return 'Passwords do not match.'
  }

  return ''
}

function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    dob: '',
    gender: 'male',
    username: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const validationError = validateRegistration(formData)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      await register({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        dob: formData.dob,
        gender: formData.gender,
        username: formData.username,
        password: formData.password,
      })
      navigate('/')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again!')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-white">TicketRush</h1>
            <p className="text-sm text-slate-400">Create a new account</p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="full_name" className="mb-1 block text-sm font-medium text-slate-300">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Nguyen Van A"
                minLength={2}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/50"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="a@mail.com"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/50"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-slate-300">
                Phone Number (optional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0901234567"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="dob" className="mb-1 block text-sm font-medium text-slate-300">
                  Date of Birth
                </label>
                <input
                  id="dob"
                  name="dob"
                  type="date"
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/50"
                />
              </div>
              <div>
                <label htmlFor="gender" className="mb-1 block text-sm font-medium text-slate-300">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/50"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="username" className="mb-1 block text-sm font-medium text-slate-300">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="nguyenvana"
                minLength={4}
                maxLength={20}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/50"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-300">
                Password (min 8 characters)
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                minLength={8}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/50"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-slate-300">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/50"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-linear-to-r from-cyan-400 to-blue-400 py-2.5 font-semibold text-slate-950 transition hover:shadow-lg hover:shadow-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing up...' : 'SIGN UP'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-cyan-400 transition hover:text-cyan-300">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          By signing up, you agree to our Terms of Service
        </p>
      </div>
    </div>
  )
}

export default Register
