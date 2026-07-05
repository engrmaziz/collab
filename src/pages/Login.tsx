import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) setError(error);
    else navigate("/");
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-base">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm p-6">
        <h1 className="text-lg font-semibold mb-1">Welcome back</h1>
        <p className="text-sm text-muted mb-6">Sign in to CollabMD</p>

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
            placeholder="Password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

        <button type="submit" disabled={busy} className="btn-primary w-full mt-5">
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-xs text-muted mt-4 text-center">
          Don't have an account?{" "}
          <Link to="/signup" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
