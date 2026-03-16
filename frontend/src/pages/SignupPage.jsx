import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import { toast } from "sonner";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(name, email, password, phone);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="signup-page">
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
              Join thousands of Indian homeowners who are building their dream homes with confidence.
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

          <Card className="border-0 shadow-lg" data-testid="signup-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold text-[#1B3A6B]">Create Account</CardTitle>
              <CardDescription>Start your home building journey today</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4" data-testid="signup-form">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="name"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-11"
                      required
                      data-testid="signup-name-input"
                    />
                  </div>
                </div>

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
                      data-testid="signup-email-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 h-11"
                      required
                      data-testid="signup-phone-input"
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
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11"
                      required
                      data-testid="signup-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      data-testid="signup-toggle-password"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-[#1B3A6B] hover:bg-[#E8500A] text-white font-medium transition-colors duration-200"
                  disabled={loading}
                  data-testid="signup-submit-button"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                Already have an account?{" "}
                <Link to="/login" className="text-[#1B3A6B] font-semibold hover:underline" data-testid="login-link">
                  Sign In
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
