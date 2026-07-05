import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await signUp(email, password);
    setBusy(false);
    if (error) setError(error);
    else setDone(true);
  };

  if (done) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-base">
        <div className="card w-full max-w-sm p-6 text-center">
          <h1 className="text-lg font-semibold mb-2">Check your inbox</h1>
          <p className="text-sm text-muted mb-4">
            We sent a confirmation link to {email}. Confirm your email, then sign in.
          </p>
          <button className="btn-primary w-full" onClick={() => navigate("/login")}>
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-base">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm p-6">
        <h1 className="text-lg font-semibold mb-1">Create an account</h1>
        <p className="text-sm text-muted mb-6">Start collaborating in seconds</p>

        <div className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password (min 6 characters)"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

        <button type="submit" disabled={busy} className="btn-primary w-full mt-5">
          {busy ? "Creating account…" : "Sign up"}
        </button>

        <p className="text-xs text-muted mt-4 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
