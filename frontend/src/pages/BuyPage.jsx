import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";
import {
  BookOpen, Shield, ShieldCheck, Lock, CheckCircle,
  CreditCard, ArrowRight, ArrowLeft, BadgeCheck,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const FEATURES = [
  "22-chapter comprehensive construction guide",
  "Budget tracker & cost calculator access",
  "Pre-construction, material & legal checklists",
  "Progress tracker for every construction stage",
  "Expert tips to save lakhs on your project",
  "Lifetime access — learn at your own pace",
];

export default function BuyPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);

  const handlePayment = async () => {
    if (!user) {
      if (!name.trim()) { toast.error("Please enter your name"); return; }
      if (!email.trim() || !email.includes("@")) { toast.error("Please enter a valid email"); return; }
      if (!phone.trim() || phone.length < 10) { toast.error("Please enter a valid phone number"); return; }
    }

    setPaying(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Failed to load payment gateway. Please try again.");
        setPaying(false);
        return;
      }

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const orderRes = await axios.post(`${API}/payments/create-order`, {
        product_key: "main_guide",
        user_email: user ? user.email : email,
        user_name: user ? user.name : name,
        user_phone: user ? (user.phone || "") : phone,
      }, { headers });

      const { order_id, amount, key_id, product_name } = orderRes.data;

      const options = {
        key: key_id,
        amount,
        currency: "INR",
        name: "Sundar Ghar Saathi",
        description: product_name,
        order_id,
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(`${API}/payments/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              product_key: "main_guide",
              user_email: user ? user.email : email,
              user_name: user ? user.name : name,
              user_phone: user ? (user.phone || "") : phone,
            }, { headers });

            if (verifyRes.data.success) {
              toast.success("Payment successful! Welcome to Sundar Ghar Saathi!");
              if (verifyRes.data.token) {
                localStorage.setItem("sgs_token", verifyRes.data.token);
                window.location.href = "/dashboard";
              } else {
                navigate("/dashboard");
              }
            }
          } catch {
            toast.error("Payment verification failed. Contact support@sundarghar.in");
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          name: user ? user.name : name,
          email: user ? user.email : email,
          contact: user ? (user.phone || "") : phone,
        },
        theme: { color: "#1B3A6B" },
        modal: {
          ondismiss: () => setPaying(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        toast.error("Payment failed. Please try again or contact support@sundarghar.in");
        setPaying(false);
      });
      rzp.open();
    } catch {
      toast.error("Something went wrong. Please try again.");
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] to-white" data-testid="buy-page">
      <div className="bg-[#1B3A6B] text-white py-3 px-4 text-center text-sm font-medium tracking-wide">
        Limited Offer: Get the Complete Home Construction Guide for just <span className="font-bold">₹499</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#1B3A6B] transition-colors"
            data-testid="buy-back-button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <Link to="/login" className="text-sm text-[#1B3A6B] font-medium hover:underline" data-testid="buy-login-link">
            Already have an account? Log in
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Left - Product Details */}
          <div data-testid="buy-product-details">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-[#1B3A6B]/10 rounded-xl flex items-center justify-center">
                <BookOpen className="h-7 w-7 text-[#1B3A6B]" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1B3A6B]" style={{ fontFamily: "Poppins, sans-serif" }}>
                Sundar Ghar Construction Guide
              </h1>
            </div>

            <p className="text-slate-600 text-base mb-6 leading-relaxed">
              Your complete companion for building a beautiful home in India. From choosing
              the right builder to final handover — everything you need to know.
            </p>

            <div className="space-y-3 mb-8">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{f}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-emerald-500" />
                <span>256-bit Encryption</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-emerald-500" />
                <span>Razorpay Verified</span>
              </div>
            </div>
          </div>

          {/* Right - Payment Card */}
          <div data-testid="buy-payment-card">
            <Card className="border-2 border-[#1B3A6B]/10 shadow-lg p-6 md:p-8 sticky top-8">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-sm text-slate-400 line-through">₹1,999</span>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">75% OFF</span>
                </div>
                <div className="text-4xl font-bold text-[#1B3A6B]" style={{ fontFamily: "Poppins, sans-serif" }}>₹499</div>
                <p className="text-xs text-slate-500 mt-1">One-time payment · Lifetime access</p>
              </div>

              {!user && (
                <div className="space-y-3 mb-6">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Full Name</label>
                    <Input
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11"
                      data-testid="buy-name-input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Email Address</label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11"
                      data-testid="buy-email-input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Phone Number</label>
                    <Input
                      placeholder="10-digit phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11"
                      data-testid="buy-phone-input"
                    />
                  </div>
                </div>
              )}

              {user && (
                <div className="bg-slate-50 rounded-lg p-4 mb-6 text-sm text-slate-600">
                  <p>Purchasing as <strong>{user.name}</strong> ({user.email})</p>
                </div>
              )}

              <Button
                onClick={handlePayment}
                disabled={paying}
                className="w-full h-12 bg-[#E8500A] hover:bg-[#c94408] text-white font-semibold text-base rounded-lg shadow-md"
                data-testid="buy-pay-button"
              >
                {paying ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Pay ₹499 Securely
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>

              <p className="mt-3 text-center text-xs text-slate-400">
                Powered by <span className="font-semibold text-[#1B3A6B]">Razorpay</span> · UPI, Cards, Net Banking
              </p>

              <div className="mt-6 pt-4 border-t border-dashed border-slate-200 text-center">
                <Shield className="h-5 w-5 text-[#1B3A6B] mx-auto mb-2" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  <strong>7-Day Money Back Guarantee</strong><br />
                  Not satisfied? Get a full refund within 7 days, no questions asked.
                  Email us at support@sundarghar.in
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
