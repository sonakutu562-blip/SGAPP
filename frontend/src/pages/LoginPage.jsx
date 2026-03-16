import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left side - branding (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1B3A6B] relative overflow-hidden items-center justify-center">
        <div className="relative z-10 text-center px-12">
          <div className="w-24 h-24 rounded-full border-4 border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
            <span className="text-white font-bold text-2xl tracking-tight">SGS</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Sundar Ghar Saathi</h1>
          <p className="text-white/60 text-lg font-light">Aapka Nirmaan Saathi</p>
          <div className="mt-12 bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/10">
            <p className="text-white/80 text-sm leading-relaxed">
              Build your dream home with expert guidance, checklists, budget tools, and step-by-step construction support.
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#E8500A]/15 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#F8FAFC]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#1B3A6B] flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="text-white font-bold text-lg">SGS</span>
            </div>
            <h1 className="text-xl font-bold text-[#1B3A6B]">Sundar Ghar Saathi</h1>
            <p className="text-xs text-slate-400 mt-0.5">Aapka Nirmaan Saathi</p>
          </div>

          <Card className="border-0 shadow-lg" data-testid="login-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold text-[#1B3A6B]">Welcome Back</CardTitle>
              <CardDescription>Sign in to continue your home building journey</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11"
                      required
                      data-testid="login-email-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11"
                      required
                      data-testid="login-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      data-testid="login-toggle-password"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-[#E8500A] hover:underline font-medium"
                    data-testid="forgot-password-link"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-[#1B3A6B] hover:bg-[#E8500A] text-white font-medium transition-colors duration-200"
                  disabled={loading}
                  data-testid="login-submit-button"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                Don't have an account?{" "}
                <Link to="/signup" className="text-[#1B3A6B] font-semibold hover:underline" data-testid="signup-link">
                  Create Account
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
