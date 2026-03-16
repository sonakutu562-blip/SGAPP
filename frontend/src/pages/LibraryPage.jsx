import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Calculator, Home, Wrench, Sparkles, Palette,
  Lock, ExternalLink, FileText, Check, Library, CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ICON_MAP = {
  book: BookOpen,
  calculator: Calculator,
  home: Home,
  wrench: Wrench,
  sparkles: Sparkles,
  palette: Palette,
};

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

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

export default function LibraryPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(null);

  const fetchLibrary = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/library`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch {
      toast.error("Failed to load library");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const handleAction = (product) => {
    if (product.action_unlocked === "read_guide") {
      navigate("/dashboard/guide");
    } else if (product.action_unlocked === "external_link") {
      toast.info("Calculator link coming soon!");
    } else {
      toast.info("PDF viewer coming soon!");
    }
  };

  const handleUnlock = async (product) => {
    setUnlocking(product.product_key);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Failed to load payment gateway.");
        setUnlocking(null);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const orderRes = await axios.post(`${API}/payments/create-order`, {
        product_key: product.product_key,
        user_email: user?.email || "",
        user_name: user?.name || "",
        user_phone: user?.phone || "",
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
              product_key: product.product_key,
              user_email: user?.email || "",
              user_name: user?.name || "",
              user_phone: user?.phone || "",
            }, { headers });

            if (verifyRes.data.success) {
              toast.success(`${product.name} unlocked successfully!`);
              await fetchLibrary();
            }
          } catch {
            toast.error("Payment verification failed. Contact support@sundarghar.in");
          } finally {
            setUnlocking(null);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: { color: "#1B3A6B" },
        modal: {
          ondismiss: () => setUnlocking(null),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        toast.error("Payment failed. Please try again or contact support@sundarghar.in");
        setUnlocking(null);
      });
      rzp.open();
    } catch {
      toast.error("Something went wrong. Please try again.");
      setUnlocking(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6" data-testid="library-page">
      <div data-testid="library-header">
        <div className="flex items-center gap-3 mb-1">
          <Library className="h-6 w-6 text-[#1B3A6B]" />
          <h1 className="text-2xl md:text-3xl font-bold text-[#1B3A6B]">My Library</h1>
        </div>
        <p className="text-sm text-slate-500">
          All your purchased resources in one place
          <span className="ml-2 text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-400">
            {data?.unlocked_count ?? 0}/{data?.total_count ?? 6} unlocked
          </span>
        </p>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
        data-testid="library-products-grid"
      >
        {data?.products?.map((product) => (
          <ProductCard
            key={product.product_key}
            product={product}
            onAction={() => handleAction(product)}
            onUnlock={() => handleUnlock(product)}
            isUnlocking={unlocking === product.product_key}
          />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product, onAction, onUnlock, isUnlocking }) {
  const Icon = ICON_MAP[product.icon] || FileText;
  const isUnlocked = product.is_unlocked;

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-200 ${
        isUnlocked
          ? "border border-slate-100 shadow-sm hover:shadow-md"
          : "border border-slate-200 bg-slate-50"
      }`}
      data-testid={`product-card-${product.product_key}`}
    >
      {isUnlocked && (
        <div
          className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          data-testid={`product-unlocked-badge-${product.product_key}`}
        >
          <Check className="h-3 w-3" />
          Unlocked
        </div>
      )}

      {!isUnlocked && (
        <div
          className="absolute top-3 right-3 flex items-center gap-1 bg-slate-200 text-slate-500 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          data-testid={`product-locked-badge-${product.product_key}`}
        >
          <Lock className="h-3 w-3" />
          Locked
        </div>
      )}

      <div className="p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isUnlocked ? "bg-[#1B3A6B]/10" : "bg-slate-200"
            }`}
          >
            <Icon className={`h-6 w-6 ${isUnlocked ? "text-[#1B3A6B]" : "text-slate-400"}`} />
          </div>
          <div className="flex-1 min-w-0 pr-16">
            <h3
              className={`font-semibold text-sm md:text-base ${
                isUnlocked ? "text-[#1A1A1A]" : "text-slate-500"
              }`}
            >
              {product.name}
            </h3>
            <p className={`text-xs md:text-sm mt-1 ${isUnlocked ? "text-slate-500" : "text-slate-400"}`}>
              {product.description}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          {isUnlocked ? (
            <Button
              onClick={onAction}
              className="bg-[#1B3A6B] hover:bg-[#152e56] text-white text-sm h-9 px-5"
              data-testid={`product-action-${product.product_key}`}
            >
              {product.action_unlocked === "read_guide" && <BookOpen className="h-4 w-4 mr-2" />}
              {product.action_unlocked === "external_link" && <ExternalLink className="h-4 w-4 mr-2" />}
              {product.action_unlocked === "view_pdf" && <FileText className="h-4 w-4 mr-2" />}
              {product.action_label}
            </Button>
          ) : (
            <>
              <span className="text-lg font-bold text-[#E8500A]" data-testid={`product-price-${product.product_key}`}>
                {formatINR(product.price)}
              </span>
              <Button
                onClick={onUnlock}
                disabled={isUnlocking}
                className="bg-[#E8500A] hover:bg-[#c94408] text-white text-sm h-9 px-5"
                data-testid={`product-unlock-${product.product_key}`}
              >
                {isUnlocking ? (
                  <span className="flex items-center gap-1.5">
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" />
                    Unlock for {formatINR(product.price)}
                  </span>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
