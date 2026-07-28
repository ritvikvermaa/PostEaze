import { Briefcase, CheckCircle2, Eye, EyeOff, Lock, LogIn, Mail, Moon, Radio, Sun, X as XIcon } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { THEME_STORAGE_KEY } from "./configuration";
import "./login.css";

type Theme = "light" | "dark";

type StandbyChannel = {
  id: string;
  label: string;
  icon: "x" | "instagram" | "facebook" | "linkedin";
};

const STANDBY_CHANNELS: StandbyChannel[] = [
  { id: "x", label: "X/Twitter", icon: "x" },
  { id: "instagram", label: "Instagram", icon: "instagram" },
  { id: "facebook", label: "Facebook", icon: "facebook" },
  { id: "linkedin", label: "LinkedIn", icon: "linkedin" },
];

function readStoredTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") {
    return stored;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

type LoginPageProps = {
  onSignIn?: (email: string) => void;
  onRequestAccount?: () => void;
  onForgotPassword?: () => void;
};

export function LoginPage({ onSignIn, onRequestAccount, onForgotPassword }: LoginPageProps) {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidEmail(email)) {
      setErrorMessage("Enter a valid email address to sign in.");
      return;
    }

    if (password.length === 0) {
      setErrorMessage("Enter your password to sign in.");
      return;
    }

    setErrorMessage(null);
    setStatus("loading");

    window.setTimeout(() => {
      setStatus("success");
      onSignIn?.(email.trim());
    }, 900);
  }

  return (
    <div className="auth-viewport" data-theme={theme}>
      <button
        type="button"
        className="theme-toggle auth-theme-toggle"
        onClick={toggleTheme}
        aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
        aria-pressed={theme === "dark"}
      >
        {theme === "light" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
      </button>

      <section className="auth-atmosphere" aria-hidden="true">
        <div className="brand">
          <span className="brand-icon">
            <Radio aria-hidden="true" />
          </span>
          <span className="brand-name">PostEaze</span>
          <span className="brand-tag">Dispatch desk</span>
        </div>

        <div className="auth-hero">
          <h1>Command your content.</h1>
          <p>Your One Stop to Post Anywhere, and Everywhere.</p>
        </div>

        <div className="hero-stage">
          <div className="hero-orbit" />
          <div className="hero-card hero-card-main">
            <span className="hero-pill">Live dispatch</span>
            <strong>Compose once. Publish everywhere.</strong>
            <p>From captions to creatives, your posts moves in sync.</p>
          </div>

          <div className="hero-card hero-card-mini">
            {STANDBY_CHANNELS.map((channel) => (
              <div className="standby-row" key={channel.id}>
                <span className="standby-led" />
                {channel.icon === "instagram" ? (
                  <span className="instagram-mark" />
                ) : channel.icon === "facebook" ? (
                  <Radio />
                ) : channel.icon === "linkedin" ? (
                  <Briefcase />
                ) : (
                  <XIcon />
                )}
                <span className="standby-name">{channel.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="auth-form-side" aria-label="Sign in">
        <div className="panel auth-panel">
          <div className="auth-panel-header">
            <span className="auth-eyebrow">Sign-in</span>
            <h2>Sign in to your Dashboard</h2>
          </div>

          <form noValidate onSubmit={handleSubmit}>
            <div className="field-group">
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <div className="field-input">
                <Mail className="field-icon" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="field-group" style={{ marginTop: 14 }}>
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <div className="field-input has-trailing">
                <Lock className="field-icon" aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="field-trailing-btn"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="flag-list" role="alert" style={{ marginTop: 14 }}>
                <div className="flag">
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            <div className="auth-row" style={{ marginTop: 16 }}>
              <label className="remember-toggle">
                <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
                <span className="remember-track" aria-hidden="true" />
                Keep me signed in
              </label>

              <button type="button" className="auth-link" onClick={onForgotPassword}>
                Forgot password?
              </button>
            </div>

            {status === "success" ? (
              <div className="auth-success" style={{ marginTop: 18 }}>
                <CheckCircle2 aria-hidden="true" />
                Signed on. Taking you to your desk…
              </div>
            ) : (
              <button className="transmit-btn" type="submit" disabled={status === "loading"} style={{ marginTop: 18 }}>
                {status === "loading" ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    Signing on…
                  </>
                ) : (
                  <>
                    <LogIn aria-hidden="true" />
                    Sign in to the desk
                  </>
                )}
              </button>
            )}
          </form>

          <p className="auth-footer">
            New here?{" "}
            <button type="button" className="link-btn" onClick={onRequestAccount}>
              Create an account
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}
