import { KeyRound, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "../api";
import toast from "react-hot-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");

  async function sendResetLink() {
    try {
      const res = await axios.post("/reset-password", {
        email,
      });
      if (res.status !== 200) throw new Error('Please insert a valid email')
      if (res.status === 200) {
        toast.success('An email has been sent to you to reset your password')
      };
    } catch (error) {
      if (error.status === 422) return toast.error('Please insert a valid email');
      console.log(error);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-text">
      <section
        aria-labelledby="forgot-password-title"
        className="w-full max-w-md rounded-2xl border border-border/20 bg-card p-6 shadow-xl sm:p-8"
      >
        <div className="mb-7">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <KeyRound size={24} aria-hidden="true" />
          </div>
          <h1
            id="forgot-password-title"
            className="text-3xl font-bold tracking-tight"
          >
            Forgot password?
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            No worries. Enter the email address associated with your Liftit
            account to get started.
          </p>
        </div>

        <label htmlFor="reset-email" className="mb-2 block text-sm font-medium">
          Email address
        </label>
        <div className="relative">
          <Mail
            size={20}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-describedby="reset-email-hint"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border/30 bg-background py-3.5 pl-12 pr-4 text-base text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <p
          id="reset-email-hint"
          className="mt-3 text-xs leading-relaxed text-muted"
        >
          Use the same email you signed up with.
        </p>
        <button
          type="submit"
          className="mt-6 w-full rounded-xl bg-primary px-4 py-3.5 font-semibold text-white transition hover:bg-primaryHover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card active:opacity-80"
          onClick={async() => await sendResetLink()}
          >
          Send reset link
        </button>
      </section>
    </main>
  );
};

export default ForgotPassword;
