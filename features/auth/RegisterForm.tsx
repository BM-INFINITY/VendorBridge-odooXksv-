"use client";

// RegisterForm — placeholder stub to be fully implemented in Phase 1.
// Will use useActionState + registerUser Server Action.
export function RegisterForm() {
  return (
    <div className="w-full max-w-lg rounded-lg border bg-card p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Create Account</h1>
        <p className="text-sm text-muted-foreground mt-1">Register for VendorBridge</p>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">First Name</label>
            <input type="text" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">Last Name</label>
            <input type="text" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input type="email" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <input type="password" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
        </div>
        <button className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Create Account
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
