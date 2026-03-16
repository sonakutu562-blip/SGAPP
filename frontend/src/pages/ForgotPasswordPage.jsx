import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    toast.info("Password reset functionality coming soon");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC]" data-testid="forgot-password-page">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#1B3A6B] flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-white font-bold text-lg">SGS</span>
          </div>
          <h1 className="text-xl font-bold text-[#1B3A6B]">Sundar Ghar Saathi</h1>
          <p className="text-xs text-slate-400 mt-0.5">Aapka Nirmaan Saathi</p>
        </div>

        <Card className="border-0 shadow-lg" data-testid="forgot-password-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-[#1B3A6B]">
              {submitted ? "Check Your Email" : "Forgot Password"}
            </CardTitle>
            <CardDescription>
              {submitted
                ? "We've sent you a password reset link"
                : "Enter your email and we'll send you a reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4" data-testid="forgot-password-form">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
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
                      data-testid="forgot-email-input"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-[#1B3A6B] hover:bg-[#E8500A] text-white font-medium transition-colors duration-200"
                  data-testid="forgot-submit-button"
                >
                  Send Reset Link
                </Button>
              </form>
            ) : (
              <div className="text-center py-4" data-testid="forgot-success-message">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-emerald-600" />
                </div>
                <p className="text-sm text-slate-600">
                  If an account exists with <strong>{email}</strong>, you'll receive a password reset email shortly.
                </p>
              </div>
            )}

            <div className="mt-6">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-[#1B3A6B] font-medium hover:underline"
                data-testid="back-to-login-link"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
