import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGoogleSignInEnabled } from "../lib/googleAuth";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardBody } from "../components/ui/Card";
import { ThemeToggle } from "../components/ThemeToggle";

const GOOGLE_ERROR_MESSAGES = {
  google_failed: "Google sign-in didn't work. Please try again, or use your email and password.",
  account_locked: "This account is temporarily locked. Try again later.",
};

export default function Login() {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const googleEnabled = useGoogleSignInEnabled();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Google sign-in is a full-page redirect round trip (see
  // timeline-backend's routes/auth.js /google and /google/callback), not a
  // fetch call — a failure lands back here as a query param instead of a
  // thrown error, so it needs its own display path alongside useAuth's own
  // `error` state.
  const googleError = searchParams.get("error");

  useEffect(() => {
    if (!googleError) return;
    setSearchParams((params) => {
      params.delete("error");
      return params;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleError]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const ok = await login(email, password);
    setSubmitting(false);
    if (ok) navigate("/", { replace: true });
  }

  return (
    <div className="flex h-screen items-center justify-center bg-bg px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="mb-1 text-lg font-semibold text-text">Timeline Admin</h1>
          <p className="mb-6 text-sm text-text-muted">Sign in with your admin account.</p>

          {googleEnabled && (
            <>
              {/* Full page navigation, not a click handler calling fetch —
                  the browser has to actually leave for Google's consent
                  screen and come back. ?app=admin is what tells the backend
                  callback to require an existing admin/superadmin account
                  and land back on this app instead of the main site. */}
              <a
                href="/api/auth/google?app=admin"
                className="mb-4 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface text-sm font-medium text-text transition-colors hover:bg-surface-hover"
              >
                <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                  <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" />
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                </svg>
                Continue with Google
              </a>
              <div className="mb-4 flex items-center gap-3 text-xs text-text-muted">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {(error || googleError) && (
              <p className="text-sm text-danger">{error || GOOGLE_ERROR_MESSAGES[googleError] || "Something went wrong signing in with Google."}</p>
            )}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
