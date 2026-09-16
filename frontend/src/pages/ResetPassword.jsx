import { Eye, EyeOff, KeyRound, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import axios from "../api";
import { toast } from 'react-hot-toast'

const ResetPassword = () => {
  const [inputType, setInputType] = useState("password");
  const [searchParams, setSearchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const token = useParams().token;
  const userId = searchParams.get("userId"); 
  const navigate = useNavigate()


  async function resetPassword() {
    try {
      const res = await axios.post(`/reset-password/${token}?userId=${userId}`, {
        newPassword,
        confirmNewPassword
      })
      if (res.status === 201) {
        toast.success(res.data.message)
        navigate('/auth')
      }
    } catch (error) {
      if (error.status === 429) toast.error('Passwords do not match')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-text">
      <section
        aria-labelledby="reset-password-title"
        className="w-full max-w-md rounded-2xl border border-border/20 bg-card p-6 shadow-xl sm:p-8"
      >
        <div className="mb-7">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <KeyRound size={24} aria-hidden="true" />
          </div>
          <h1
            id="reset-password-title"
            className="text-3xl font-bold tracking-tight"
          >
            Reset your password
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Choose a new password to get back to tracking your progress with
            Liftit.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label
              htmlFor="new-password"
              className="mb-2 block text-sm font-medium"
            >
              New password
            </label>
            <div className="relative">
              <button
              type="button"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 text-muted"
              aria-label={inputType === 'password' ? 'Show password': 'Hide password'}
              onClick={() => setInputType(prev => prev === 'password' ? 'text' : 'password')}
              >
                {inputType === 'password' ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              <input
                id="new-password"
                name="newPassword"
                type={inputType}
                autoComplete="new-password"
                placeholder="Enter your new password"
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-border/30 bg-background py-3.5 pl-12 pr-4 text-base text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="confirm-new-password"
              className="mb-2 block text-sm font-medium"
            >
              Confirm new password
            </label>
            <div className="relative">
              <button
                type="button"
                aria-label={
                  inputType === "password" ? "Show password" : "Hide password"
                }
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 text-muted"
                onClick={() =>
                  setInputType((previous) =>
                    previous === "password" ? "text" : "password",
                  )
                }
              >
                {inputType === "password" ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
              <input
                id="confirm-new-password"
                name="confirmNewPassword"
                type={inputType}
                autoComplete="new-password"
                placeholder="Repeat your new password"
                aria-describedby="confirm-password-hint"
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full rounded-xl border border-border/30 bg-background py-3.5 pl-12 pr-4 text-base text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <p
              id="confirm-password-hint"
              className="mt-3 text-xs leading-relaxed text-muted"
            >
              Enter the same password again to confirm it.
            </p>
          </div>
        </div>
        <button
          type="submit"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-semibold text-white transition hover:bg-primaryHover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card active:opacity-80"
          onClick={async() => await resetPassword()}
        >
          <LockKeyhole size={18} aria-hidden="true" />
          Reset password
        </button>
      </section>
    </main>
  );
};

export default ResetPassword;
