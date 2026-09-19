import { useState, useEffect } from "react";
import axios from "../api";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams, Link } from "react-router";
import { Eye, EyeOff } from 'lucide-react'
import GoogleAuthButton from '../components/GoogleAuthButton'

const Auth = ({ setUser }) => {
  const [auth, setAuth] = useState(getFromStorage() || "signup");
  const [signupInfo, setSignUpInfo] = useState({});
  const [loginInfo, setloginInfo] = useState({});
  const [inputType, setInputType] = useState('password')
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [searchParams] = useSearchParams()
  const googleErrors = {
    google_failed: 'Google sign-in could not be completed. Please try again.',
    google_cancelled: 'Google sign-in was cancelled or expired. Please try again.',
    google_email_missing: 'Google did not provide an email address. Try another account.',
    account_exists: 'This email already has an account. Please sign in using your existing login method.',
  }
  const googleError = googleErrors[searchParams.get('error')]
  const googleSection = (
    <div className="mt-6">
      <div className="mb-5 flex items-center gap-4 text-xs text-muted"><span className="h-px flex-1 bg-border/30" />or<span className="h-px flex-1 bg-border/30" /></div>
      {googleError && <p role="alert" className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{googleError}</p>}
      <GoogleAuthButton signup={auth === 'signup'} disabled={pending} />
    </div>
  )


  useEffect(() => {
    localStorage.setItem("auth", JSON.stringify(auth));
  }, [auth]);

  function getFromStorage() {
    try {
      return JSON.parse(localStorage.getItem('auth')) === 'login' ? 'login' : 'signup'
    } catch { return 'signup' }
  }

  async function handleSignup(e) {
    e.preventDefault();
    if (pending) return
    setPending(true)
    try {
      if (signupInfo.password === signupInfo.confirmPassword && signupInfo) {
        const res = await axios.post("/signup", {
          name: signupInfo.name,
          email: signupInfo.email,
          password: signupInfo.password,
          confirmPassword: signupInfo.confirmPassword,
        });
        

        if (res.status === 201) {
          toast.success("Signed up successfully");
          setUser(res.data.user)
          setAuth('login')
        }
      } else {
        return toast.error('Error, passwords do not match')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to sign up. Check your connection and try again.');
    } finally {
      setPending(false)
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (pending) return
    setPending(true)
    try {
      const res = await axios.post("/login", {
        email: loginInfo.email,
        password: loginInfo.password,
      });
      if (res.status === 200) {
        setUser(res.data.user)
        toast.success("Logged in successfully");
        window.location.href = '/'
      }
    } catch (error) {
        toast.error(error.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setPending(false)
    }
  }

  if (auth === "signup")
    return (
      <div className="h-screen">
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md bg-card border border-border/20 rounded-2xl p-8 shadow-xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-text">Create Account</h1>

              <p className="text-muted mt-2">
                Start tracking your workouts and progress.
              </p>
            </div>

            <form className="space-y-5 text-black" onSubmit={handleSignup}>
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-text mb-2"
                >
                  Name
                </label>

                <input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  name="name"
                  className="w-full bg-background border border-border/30 rounded-xl px-4 py-3 text-white placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  onChange={(e) =>
                    setSignUpInfo({ ...signupInfo, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-text mb-2"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  name="email"
                  className="w-full bg-background border border-border/30 rounded-xl px-4 py-3 text-white placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  onChange={(e) =>
                    setSignUpInfo({ ...signupInfo, email: e.target.value })
                  }
                />
              </div>

              <div className="relative">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-text mb-2"
                >
                  Password
                </label>

                <input
                  id="password"
                  type={inputType}
                  placeholder="Create a password"
                  name="password"
                  className="w-full bg-background border border-border/30 rounded-xl px-4 py-3 text-white placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  onChange={(e) =>
                    setSignUpInfo({ ...signupInfo, password: e.target.value })
                  }
                />
                { inputType === 'text' ? <Eye className="absolute size-5 text-white top-11 right-2 pointer" onClick={() => setInputType('password')} /> : <EyeOff className="absolute size-5 text-white top-11 right-2 pointer" onClick={() => setInputType('text')} />}
              </div>

              <div className="relative">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-text mb-2"
                >
                  Confirm Password
                </label>

                <input
                  id="confirmPassword"
                  type={inputType}
                  placeholder="Repeat your password"
                  name="confirmPassword"
                  className="w-full bg-background border border-border/30 rounded-xl px-4 py-3 text-white placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  onChange={(e) =>
                    setSignUpInfo({
                      ...signupInfo,
                      confirmPassword: e.target.value,
                    })
                  }
                />
                { inputType === 'text' ? <Eye className="absolute size-5 text-white top-11 right-2 pointer" onClick={() => setInputType('password')} /> : <EyeOff className="absolute size-5 text-white top-11 right-2 pointer" onClick={() => setInputType('text')} />}
              </div>

              <button
                type="submit" disabled={pending}
                className="w-full bg-primary hover:bg-primaryHover text-white font-semibold py-3 rounded-xl transition duration-200"
              >
                {pending ? 'Creating account…' : 'Sign Up'}
              </button>
            </form>
            {googleSection}

            <p className="text-center text-muted mt-6 text-sm">
              Already have an account?{' '}
              <a
                onClick={() => {
                  setAuth("login");
                }}
                className="text-primary hover:text-primaryHover font-medium cursor-pointer"
              >
                Log in
              </a>
            </p>
          </div>
        </div>
      </div>
    );

  if (auth === "login") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-card border border-border/20 rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text">Welcome Back</h1>

            <p className="text-muted mt-2">
              Log in to continue tracking your progress.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text mb-2"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                name="email"
                className="w-full bg-background border border-border/30 rounded-xl px-4 py-3 text-white placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                onChange={(e) =>
                  setloginInfo({ ...loginInfo, email: e.target.value })
                }
              />
            </div>

            <div className="relative">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text mb-2"
              >
                Password
              </label>

              <input
                id="password"
                type={inputType}
                placeholder="Enter your password"
                name="password"
                className="w-full bg-background border border-border/30 rounded-xl px-4 py-3 text-white placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                onChange={(e) =>
                  setloginInfo({ ...loginInfo, password: e.target.value })
                }
              />
              { inputType === 'text' ? <Eye className="absolute size-5 text-white top-11 right-2 pointer" onClick={() => setInputType('password')} /> : <EyeOff className="absolute size-5 text-white top-11 right-2 pointer" onClick={() => setInputType('text')} />}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted">
                <input type="checkbox" className="accent-primary" />
                Remember me
              </label>

              <Link
                to="/forgot-password"
                className="text-primary hover:text-primaryHover"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit" disabled={pending}
              className="w-full bg-primary hover:bg-primaryHover text-white font-semibold py-3 rounded-xl transition duration-200"
            >
              {pending ? 'Signing in…' : 'Log In'}
            </button>
          </form>
          {googleSection}

          <div className="text-center text-muted mt-6 text-sm">
            Don't have an account?{' '}
            <a
              onClick={() => setAuth("signup")}
              className="text-primary hover:text-primaryHover font-medium cursor-pointer"
            >
              Sign up
            </a>
          </div>
        </div>
      </div>
    );
  }
};

export default Auth;
