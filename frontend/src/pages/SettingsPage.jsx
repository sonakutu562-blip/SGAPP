import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";
import {
  Settings, User, Lock, Globe, Bell, ShoppingBag,
  AlertTriangle, Save, Eye, EyeOff, ExternalLink,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SettingsPage() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  /* ── Profile state ── */
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [profileSaving, setProfileSaving] = useState(false);

  /* ── Password state ── */
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);

  /* ── Preferences state ── */
  const [language, setLanguage] = useState("en");
  const [emailNotif, setEmailNotif] = useState(true);
  const [constructionReminders, setConstructionReminders] = useState(true);
  const [newContentAlerts, setNewContentAlerts] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);

  /* ── Purchases state ── */
  const [purchases, setPurchases] = useState([]);

  /* ── Delete state ── */
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    try {
      const [prefsRes, purchRes] = await Promise.all([
        axios.get(`${API}/settings/preferences`, { headers }),
        axios.get(`${API}/settings/purchases`, { headers }),
      ]);
      setLanguage(prefsRes.data.language);
      setEmailNotif(prefsRes.data.email_notifications);
      setConstructionReminders(prefsRes.data.construction_reminders);
      setNewContentAlerts(prefsRes.data.new_content_alerts);
      setPurchases(purchRes.data.purchases);
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Profile save ── */
  const saveProfile = async () => {
    if (!name.trim()) { toast.error("Name cannot be empty"); return; }
    setProfileSaving(true);
    try {
      await axios.put(`${API}/settings/profile`, { name: name.trim(), phone: phone.trim() }, { headers });
      toast.success("Profile updated!");
    } catch (e) { toast.error(e.response?.data?.detail || "Failed to save"); }
    finally { setProfileSaving(false); }
  };

  /* ── Password change ── */
  const changePassword = async () => {
    if (!currentPwd) { toast.error("Enter current password"); return; }
    if (newPwd.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    if (newPwd !== confirmPwd) { toast.error("Passwords do not match"); return; }
    setPwdSaving(true);
    try {
      await axios.put(`${API}/settings/password`, { current_password: currentPwd, new_password: newPwd }, { headers });
      toast.success("Password updated!");
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (e) { toast.error(e.response?.data?.detail || "Failed to change password"); }
    finally { setPwdSaving(false); }
  };

  /* ── Preferences save ── */
  const savePrefs = async (overrides = {}) => {
    setPrefsSaving(true);
    try {
      await axios.put(`${API}/settings/preferences`, {
        language: overrides.language ?? language,
        email_notifications: overrides.email_notifications ?? emailNotif,
        construction_reminders: overrides.construction_reminders ?? constructionReminders,
        new_content_alerts: overrides.new_content_alerts ?? newContentAlerts,
      }, { headers });
      toast.success("Preferences saved!");
    } catch { toast.error("Failed to save preferences"); }
    finally { setPrefsSaving(false); }
  };

  /* ── Delete account ── */
  const deleteAccount = async () => {
    if (deleteConfirm !== "DELETE MY ACCOUNT") {
      toast.error("Please type 'DELETE MY ACCOUNT' exactly to confirm");
      return;
    }
    setDeleting(true);
    try {
      await axios.delete(`${API}/settings/account`, { headers, data: { confirmation: deleteConfirm } });
      toast.success("Account deleted");
      logout();
      navigate("/login");
    } catch (e) { toast.error(e.response?.data?.detail || "Failed to delete account"); }
    finally { setDeleting(false); }
  };

  /* ── Password strength ── */
  const pwdStrength = () => {
    if (!newPwd) return { level: 0, text: "", color: "" };
    let score = 0;
    if (newPwd.length >= 8) score++;
    if (newPwd.length >= 12) score++;
    if (/[A-Z]/.test(newPwd)) score++;
    if (/[0-9]/.test(newPwd)) score++;
    if (/[^A-Za-z0-9]/.test(newPwd)) score++;
    if (score <= 2) return { level: score, text: "Weak", color: "bg-red-400" };
    if (score <= 3) return { level: score, text: "Medium", color: "bg-amber-400" };
    return { level: score, text: "Strong", color: "bg-emerald-400" };
  };
  const strength = pwdStrength();

  const initials = (user?.name || "U").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const formatDate = (iso) => {
    try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return ""; }
  };

  const formatINR = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-8" data-testid="settings-page">
      <div className="flex items-center gap-3 mb-2">
        <Settings className="h-6 w-6 text-[#1B3A6B]" />
        <h1 className="text-2xl font-bold text-[#1B3A6B]">Settings</h1>
      </div>

      {/* ── SECTION 1: Profile ── */}
      <Card className="p-5 md:p-6 border-0 shadow-sm" data-testid="settings-profile">
        <div className="flex items-center gap-3 mb-5">
          <User className="h-5 w-5 text-[#1B3A6B]" />
          <h2 className="font-semibold text-[#0F172A]">My Profile</h2>
        </div>

        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-[#1B3A6B] flex items-center justify-center flex-shrink-0" data-testid="profile-avatar">
            <span className="text-xl font-bold text-white">{initials}</span>
          </div>
          <div>
            <p className="font-medium text-[#0F172A]">{user?.name}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Full Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10" data-testid="settings-name-input" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Email Address</label>
            <Input value={user?.email || ""} disabled className="h-10 bg-slate-50 text-slate-400 cursor-not-allowed" data-testid="settings-email-input" />
            <p className="text-[10px] text-slate-400 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Phone Number</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10" data-testid="settings-phone-input" />
          </div>
        </div>

        <Button onClick={saveProfile} disabled={profileSaving} className="mt-4 bg-[#1B3A6B] hover:bg-[#152e56] text-white gap-1" data-testid="settings-save-profile">
          <Save className="h-4 w-4" />
          {profileSaving ? "Saving..." : "Save Changes"}
        </Button>
      </Card>

      {/* ── SECTION 2: Change Password ── */}
      <Card className="p-5 md:p-6 border-0 shadow-sm" data-testid="settings-password">
        <div className="flex items-center gap-3 mb-5">
          <Lock className="h-5 w-5 text-[#1B3A6B]" />
          <h2 className="font-semibold text-[#0F172A]">Change Password</h2>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <label className="text-xs font-medium text-slate-600 mb-1 block">Current Password</label>
            <Input
              type={showCurrent ? "text" : "password"}
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              className="h-10 pr-10"
              data-testid="settings-current-pwd"
            />
            <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-[30px] text-slate-400">
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="relative">
            <label className="text-xs font-medium text-slate-600 mb-1 block">New Password</label>
            <Input
              type={showNew ? "text" : "password"}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className="h-10 pr-10"
              data-testid="settings-new-pwd"
            />
            <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-[30px] text-slate-400">
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            {newPwd && (
              <div className="mt-2" data-testid="pwd-strength">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength.level ? strength.color : "bg-slate-200"}`} />
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Strength: {strength.text}</p>
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Confirm New Password</label>
            <Input
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              className="h-10"
              data-testid="settings-confirm-pwd"
            />
            {confirmPwd && newPwd !== confirmPwd && (
              <p className="text-[10px] text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>
        </div>

        <Button onClick={changePassword} disabled={pwdSaving} className="mt-4 bg-[#1B3A6B] hover:bg-[#152e56] text-white gap-1" data-testid="settings-update-pwd">
          <Lock className="h-4 w-4" />
          {pwdSaving ? "Updating..." : "Update Password"}
        </Button>
      </Card>

      {/* ── SECTION 3: Language ── */}
      <Card className="p-5 md:p-6 border-0 shadow-sm" data-testid="settings-language">
        <div className="flex items-center gap-3 mb-5">
          <Globe className="h-5 w-5 text-[#1B3A6B]" />
          <h2 className="font-semibold text-[#0F172A]">Language / Bhasha</h2>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { setLanguage("en"); savePrefs({ language: "en" }); }}
            className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-colors ${
              language === "en" ? "bg-[#1B3A6B] text-white" : "border-2 border-slate-200 text-slate-600 hover:border-[#1B3A6B]"
            }`}
            data-testid="settings-lang-en"
          >
            English
          </button>
          <button
            onClick={() => { setLanguage("hi"); savePrefs({ language: "hi" }); }}
            className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-colors ${
              language === "hi" ? "bg-[#1B3A6B] text-white" : "border-2 border-slate-200 text-slate-600 hover:border-[#1B3A6B]"
            }`}
            data-testid="settings-lang-hi"
          >
            हिंदी
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2">Full Hindi translation coming soon</p>
      </Card>

      {/* ── SECTION 4: Notifications ── */}
      <Card className="p-5 md:p-6 border-0 shadow-sm" data-testid="settings-notifications">
        <div className="flex items-center gap-3 mb-5">
          <Bell className="h-5 w-5 text-[#1B3A6B]" />
          <h2 className="font-semibold text-[#0F172A]">Notifications</h2>
        </div>

        <div className="space-y-4">
          <ToggleRow label="Email Notifications" desc="Receive emails about updates and tips" checked={emailNotif}
            onChange={(v) => { setEmailNotif(v); savePrefs({ email_notifications: v }); }} testId="notif-email" />
          <ToggleRow label="Construction Reminders" desc="Get reminders for your building stages" checked={constructionReminders}
            onChange={(v) => { setConstructionReminders(v); savePrefs({ construction_reminders: v }); }} testId="notif-construction" />
          <ToggleRow label="New Content Alerts" desc="Know when new chapters or guides are added" checked={newContentAlerts}
            onChange={(v) => { setNewContentAlerts(v); savePrefs({ new_content_alerts: v }); }} testId="notif-content" />
        </div>
      </Card>

      {/* ── SECTION 5: Purchases ── */}
      <Card className="p-5 md:p-6 border-0 shadow-sm" data-testid="settings-purchases">
        <div className="flex items-center gap-3 mb-5">
          <ShoppingBag className="h-5 w-5 text-[#1B3A6B]" />
          <h2 className="font-semibold text-[#0F172A]">My Purchases</h2>
        </div>

        {purchases.length === 0 ? (
          <div className="text-center py-6" data-testid="no-purchases">
            <p className="text-sm text-slate-400 mb-3">No purchases yet. Visit My Library to unlock more content.</p>
            <Button variant="outline" onClick={() => navigate("/dashboard/library")} className="gap-1 text-sm" data-testid="view-library-btn">
              <ExternalLink className="h-3.5 w-3.5" />
              View My Library
            </Button>
          </div>
        ) : (
          <div className="space-y-2" data-testid="purchases-list">
            {purchases.map((p, i) => (
              <div key={i} className={`flex items-center justify-between py-3 px-3 rounded-lg ${i % 2 === 0 ? "bg-slate-50/50" : ""}`} data-testid={`purchase-row-${i}`}>
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">{p.product_name}</p>
                  <p className="text-[10px] text-slate-400">{formatDate(p.created_at)}</p>
                </div>
                <span className="text-sm font-bold text-[#1B3A6B]">{formatINR(p.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── SECTION 6: Danger Zone ── */}
      <Card className="p-5 md:p-6 border-2 border-red-200 shadow-sm" data-testid="settings-danger-zone">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h2 className="font-semibold text-red-600">Danger Zone</h2>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <Input
          placeholder='Type "DELETE MY ACCOUNT" to confirm'
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          className="h-10 mb-3 border-red-200 focus-visible:ring-red-300"
          data-testid="settings-delete-confirm"
        />
        <Button
          onClick={deleteAccount}
          disabled={deleting || deleteConfirm !== "DELETE MY ACCOUNT"}
          variant="destructive"
          className="gap-1"
          data-testid="settings-delete-btn"
        >
          <AlertTriangle className="h-4 w-4" />
          {deleting ? "Deleting..." : "Delete My Account"}
        </Button>
      </Card>
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange, testId }) {
  return (
    <div className="flex items-center justify-between" data-testid={testId}>
      <div>
        <p className="text-sm font-medium text-[#0F172A]">{label}</p>
        <p className="text-[10px] text-slate-400">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-[#1B3A6B]" : "bg-slate-200"}`}
        data-testid={`${testId}-toggle`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}
