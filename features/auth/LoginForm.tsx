"use client";

// LoginForm — placeholder stub to be fully implemented in Phase 1.
// Will use useActionState + loginUser Server Action.
export function LoginForm() {
  return (
    <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">VendorBridge</h1>
        <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            placeholder="you@company.com"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <button className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Sign In
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-primary hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
