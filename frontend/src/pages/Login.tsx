import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import {
  Building2, Lock, Mail, Loader2, Eye, EyeOff,
  ArrowRight, UserCircle2, ShieldCheck, RefreshCw, ChevronLeft,
} from "lucide-react";
import { cn, apiUrl } from "../utils";

// ─── Login Form ───────────────────────────────────────────────────────────────
const LoginForm: React.FC<{ onGoRegister: () => void }> = ({ onGoRegister }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.data?.token) {
        login(data.data.token, data.data.user);
        toast.success(`Welcome back, ${data.data.user.firstName}!`);
        navigate("/");
      } else {
        toast.error(data.error || "Invalid email or password");
      }
    } catch {
      toast.error("An error occurred during sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm">
      <div className="mb-6 flex flex-col items-center">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 border-4 border-white shadow-xl flex items-center justify-center mb-3 ring-4 ring-primary/10">
          <Building2 className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">VendorBridge</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Sign in to your ERP portal</p>
      </div>

      <div className="w-full bg-card border rounded-2xl shadow-lg p-7 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Username or Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" required autoComplete="username" placeholder="admin, officer, manager, vendor..."
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type={showPassword ? "text" : "password"} required autoComplete="current-password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border rounded-xl pl-10 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" />
              <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm shadow-primary/20 disabled:opacity-60 mt-1">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Login</span><ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>

        <div className="border-t pt-4 space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center mb-2">Demo Credentials</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[{ role: "Admin", cred: "admin / 123" }, { role: "Officer", cred: "officer / 123" },
              { role: "Manager", cred: "manager / 123" }, { role: "Vendor", cred: "vendor / 123" }].map(({ role, cred }) => (
              <button key={role} type="button" onClick={() => { setEmail(role.toLowerCase()); setPassword("123"); }}
                className="text-left px-2.5 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-[11px] font-mono">
                <span className="font-semibold text-foreground block">{role}</span>
                <span className="text-muted-foreground">{cred}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Don't have an account?{" "}
          <button type="button" onClick={onGoRegister} className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};

// ─── OTP Step ─────────────────────────────────────────────────────────────────
const OTPStep: React.FC<{
  email: string;
  onBack: () => void;
  onVerified: (otp: string) => void;
  submitting: boolean;
}> = ({ email, onBack, onVerified, submitting }) => {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[i] = val.slice(-1);
    setDigits(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      refs.current[5]?.focus();
    }
  };

  const handleResend = useCallback(async () => {
    setResending(true);
    try {
      const res = await fetch(apiUrl("/api/auth/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("New OTP sent to your email!");
        setCountdown(60);
        setDigits(["", "", "", "", "", ""]);
        refs.current[0]?.focus();
      } else {
        toast.error(data.error || "Failed to resend OTP");
      }
    } catch {
      toast.error("Failed to resend OTP");
    } finally {
      setResending(false);
    }
  }, [email]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length < 6) { toast.error("Please enter the 6-digit OTP"); return; }
    onVerified(otp);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm">
      <div className="mb-6 flex flex-col items-center">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-400/20 to-primary/20 border-4 border-white shadow-xl flex items-center justify-center mb-3 ring-4 ring-primary/10">
          <ShieldCheck className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Verify Email</h1>
        <p className="text-sm text-muted-foreground mt-1 text-center max-w-xs">
          We sent a 6-digit code to<br />
          <span className="font-semibold text-foreground">{email}</span>
        </p>
      </div>

      <div className="w-full bg-card border rounded-2xl shadow-lg p-7">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div onPaste={handlePaste} className="flex gap-2 justify-center">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={cn(
                  "w-11 h-13 text-center text-xl font-bold border-2 rounded-xl bg-background outline-none transition-all",
                  d ? "border-primary text-primary" : "border-border",
                  "focus:border-primary focus:ring-2 focus:ring-primary/20"
                )}
              />
            ))}
          </div>

          <div className="text-center text-xs text-muted-foreground">
            {countdown > 0 ? (
              <span>Resend code in <span className="font-semibold text-foreground">{countdown}s</span></span>
            ) : (
              <button type="button" onClick={handleResend} disabled={resending}
                className="inline-flex items-center gap-1.5 font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-60">
                {resending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Resend OTP
              </button>
            )}
          </div>

          <button type="submit" disabled={submitting || digits.join("").length < 6}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm shadow-primary/20 disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldCheck className="h-4 w-4" /><span>Verify & Register</span></>}
          </button>
        </form>

        <button type="button" onClick={onBack}
          className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-3.5 w-3.5" /> Back to registration
        </button>
      </div>
    </div>
  );
};

// ─── Register Form (Step 1) ────────────────────────────────────────────────────
const RegisterForm: React.FC<{ onGoLogin: () => void }> = ({ onGoLogin }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    companyName: "", firstName: "", lastName: "",
    email: "", phone: "", country: "",
    password: "", confirmPassword: "", additionalInfo: "",
  });

  const inputClass = "w-full bg-background border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all";

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName || !form.firstName || !form.lastName || !form.email || !form.password) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(apiUrl("/api/auth/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("OTP sent! Check your email.");
        setOtpStep(true);
      } else {
        toast.error(data.error || "Failed to send OTP");
      }
    } catch {
      toast.error("Failed to send OTP");
    } finally {
      setSending(false);
    }
  };

  const handleRegister = async (otpCode: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || undefined,
          country: form.country || undefined,
          password: form.password,
          otpCode,
          additionalInfo: form.additionalInfo || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Account created! Awaiting admin approval. Please sign in once approved.");
        onGoLogin();
      } else {
        toast.error(data.error || "Registration failed");
        if (data.error?.toLowerCase().includes("otp") || data.error?.toLowerCase().includes("expired")) {
          setOtpStep(false);
        }
      }
    } catch {
      toast.error("An error occurred during registration");
    } finally {
      setSubmitting(false);
    }
  };

  if (otpStep) {
    return (
      <OTPStep
        email={form.email}
        onBack={() => setOtpStep(false)}
        onVerified={handleRegister}
        submitting={submitting}
      />
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-xl">
      <div className="mb-6 flex flex-col items-center">
        <button type="button" onClick={() => fileInputRef.current?.click()}
          className="h-24 w-24 rounded-full border-4 border-white shadow-xl ring-4 ring-primary/10 bg-muted hover:bg-muted/80 transition-all flex items-center justify-center overflow-hidden group">
          {photoPreview ? (
            <img src={photoPreview} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
              <UserCircle2 className="h-10 w-10" />
              <span className="text-[10px] font-semibold">Photo</span>
            </div>
          )}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        <p className="text-xs text-muted-foreground mt-2">Click to upload profile photo</p>
      </div>

      <div className="w-full bg-card border rounded-2xl shadow-lg p-7">
        <div className="mb-5">
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Register for VendorBridge ERP access</p>
        </div>

        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Company Name <span className="text-destructive">*</span>
            </label>
            <input type="text" required placeholder="Tech Supplies Pvt Ltd" value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })} className={cn(inputClass, "mt-1.5")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                First Name <span className="text-destructive">*</span>
              </label>
              <input type="text" required placeholder="First Name" value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={cn(inputClass, "mt-1.5")} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Last Name <span className="text-destructive">*</span>
              </label>
              <input type="text" required placeholder="Last Name" value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={cn(inputClass, "mt-1.5")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Email <span className="text-destructive">*</span>
              </label>
              <input type="email" required placeholder="you@company.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} className={cn(inputClass, "mt-1.5")} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</label>
              <input type="tel" placeholder="Phone Number" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} className={cn(inputClass, "mt-1.5")} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country</label>
            <input type="text" placeholder="Country" value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })} className={cn(inputClass, "mt-1.5")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Password <span className="text-destructive">*</span>
              </label>
              <input type="password" required placeholder="Min 8 chars, 1 uppercase, 1 number" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} className={cn(inputClass, "mt-1.5")} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Confirm Password <span className="text-destructive">*</span>
              </label>
              <input type="password" required placeholder="••••••••" value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className={cn(inputClass, "mt-1.5",
                  form.confirmPassword && form.password !== form.confirmPassword
                    ? "border-destructive focus:ring-destructive/30" : "")} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Additional Information</label>
            <textarea rows={2} placeholder="Tell us about your business…" value={form.additionalInfo}
              onChange={(e) => setForm({ ...form, additionalInfo: e.target.value })}
              className={cn(inputClass, "resize-none mt-1.5")} />
          </div>

          <button type="submit" disabled={sending}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm shadow-primary/20 disabled:opacity-60 mt-1">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="h-4 w-4" /><span>Send Verification OTP</span></>}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Already have an account?{" "}
          <button type="button" onClick={onGoLogin} className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
export const Login: React.FC = () => {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20 px-4 py-12 overflow-hidden">
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/8 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-violet-400/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-blue-300/5 blur-[100px] pointer-events-none" />
      <div className="relative z-10 w-full flex flex-col items-center">
        {mode === "login" ? (
          <LoginForm onGoRegister={() => setMode("register")} />
        ) : (
          <RegisterForm onGoLogin={() => setMode("login")} />
        )}
      </div>
    </div>
  );
};
