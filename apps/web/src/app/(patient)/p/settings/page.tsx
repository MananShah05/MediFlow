"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mediflowToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Sliders,
  ShieldAlert,
  Copy,
  Check,
  QrCode,
  Save,
  RefreshCw,
  Lock,
  Loader2,
  Info
} from "lucide-react";

type TabType = "profile" | "preferences" | "security";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  // Fetch patient profile and user settings
  const { data: responseData, isLoading, isError, error, refetch } = useQuery<{
    data: {
      patient: {
        id: string;
        uhid: string;
        profile: {
          id: string;
          fullName: string;
          dateOfBirth: string;
          gender: string;
          bloodGroup: string | null;
          mobileNumber: string | null;
          email: string | null;
          city: string | null;
          state: string | null;
          pincode: string | null;
          emergencyContactName: string | null;
          emergencyContactRelation: string | null;
          emergencyContactPhone: string | null;
          insuranceProvider: string | null;
          insurancePolicyNumber: string | null;
          insuranceValidity: string | null;
          preferredLanguage: string;
          preferredContact: "sms" | "email" | "whatsapp";
          version: number;
        };
      };
      user: {
        id: string;
        email: string;
        phone: string | null;
        timezone: string;
        language: string;
        mfaEnabled: boolean;
        mfaMethod: string | null;
        totpSecret: string | null;
      };
    };
  }>({
    queryKey: ["patient", "profile"],
    queryFn: () => apiClient.get("/patients/me/profile"),
  });

  const profile = responseData?.data?.patient?.profile;
  const user = responseData?.data?.user;

  // ── Form States ──
  // Profile Form
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("prefer_not_to_say");
  const [bloodGroup, setBloodGroup] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [insProvider, setInsProvider] = useState("");
  const [insPolicy, setInsPolicy] = useState("");
  const [insValidity, setInsValidity] = useState("");

  // Preferences Form
  const [preferredContact, setPreferredContact] = useState<"sms" | "email" | "whatsapp">("sms");
  const [preferredLanguage, setPreferredLanguage] = useState("en");

  // Security Form
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [langCode, setLangCode] = useState("en");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Initialize form state when data loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setDateOfBirth(profile.dateOfBirth ? profile.dateOfBirth.split("T")[0] : "");
      setGender(profile.gender || "prefer_not_to_say");
      setBloodGroup(profile.bloodGroup || "");
      setMobileNumber(profile.mobileNumber || "");
      setEmail(profile.email || "");
      setCity(profile.city || "");
      setState(profile.state || "");
      setPincode(profile.pincode || "");
      setEmergencyName(profile.emergencyContactName || "");
      setEmergencyRelation(profile.emergencyContactRelation || "");
      setEmergencyPhone(profile.emergencyContactPhone || "");
      setInsProvider(profile.insuranceProvider || "");
      setInsPolicy(profile.insurancePolicyNumber || "");
      setInsValidity(profile.insuranceValidity ? profile.insuranceValidity.split("T")[0] : "");
      setPreferredContact(profile.preferredContact || "sms");
      setPreferredLanguage(profile.preferredLanguage || "en");
    }
    if (user) {
      setTimezone(user.timezone || "Asia/Kolkata");
      setLangCode(user.language || "en");
      setMfaEnabled(user.mfaEnabled || false);
      setTotpSecret(user.totpSecret || null);
    }
  }, [profile, user]);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (body: any) => apiClient.put<any>("/patients/me/profile", body),
    onSuccess: () => {
      mediflowToast.success("Profile updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["patient", "profile"] });
    },
    onError: (err: any) => {
      if (err.statusCode === 409) {
        mediflowToast.error("Save Conflict", "The profile was modified by another process. Please reload and try again.");
      } else {
        mediflowToast.error("Failed to update profile", err.message);
      }
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (body: any) => apiClient.put<any>("/patients/me/profile", body),
    onSuccess: () => {
      mediflowToast.success("Notification preferences saved.");
      queryClient.invalidateQueries({ queryKey: ["patient", "profile"] });
    },
    onError: (err: any) => {
      mediflowToast.error("Failed to save preferences", err.message);
    },
  });

  const updateSecurityMutation = useMutation({
    mutationFn: (body: any) => apiClient.put<any>("/patients/me/security", body),
    onSuccess: (res: any) => {
      mediflowToast.success("Security settings updated.");
      if (res?.data?.totpSecret) {
        setTotpSecret(res.data.totpSecret);
      }
      // Clear password fields on success
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      queryClient.invalidateQueries({ queryKey: ["patient", "profile"] });
    },
    onError: (err: any) => {
      mediflowToast.error("Failed to update security settings", err.message);
    },
  });

  const handleCopySecret = () => {
    if (totpSecret) {
      navigator.clipboard.writeText(totpSecret);
      setCopied(true);
      mediflowToast.info("Secret key copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    updateProfileMutation.mutate({
      fullName,
      dateOfBirth: dateOfBirth || undefined,
      gender,
      bloodGroup: bloodGroup || null,
      mobileNumber: mobileNumber || null,
      email: email || null,
      city: city || null,
      state: state || null,
      pincode: pincode || null,
      emergencyContactName: emergencyName || null,
      emergencyContactRelation: emergencyRelation || null,
      emergencyContactPhone: emergencyPhone || null,
      insuranceProvider: insProvider || null,
      insurancePolicyNumber: insPolicy || null,
      insuranceValidity: insValidity || null,
      version: profile.version, // Send current version for optimistic locking check
    });
  };

  const handlePreferencesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    updatePreferencesMutation.mutate({
      preferredContact,
      preferredLanguage,
      version: profile.version,
    });
  };

  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      mediflowToast.warning("New passwords do not match.");
      return;
    }
    updateSecurityMutation.mutate({
      currentPassword: currentPassword || undefined,
      newPassword: newPassword || undefined,
      timezone,
      language: langCode,
      mfaEnabled,
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-12 w-48 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="md:col-span-3 h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center border border-dashed border-critical rounded-xl bg-critical-muted">
        <h3 className="text-lg font-bold text-critical-text">Unable to load settings</h3>
        <p className="text-text-secondary mt-1">{(error as any)?.message || "Internal Server Error"}</p>
        <Button onClick={() => refetch()} className="mt-4" variant="secondary">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Title & UHID Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage your personal medical profile, notifications, and login settings.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-bg-surface px-3 py-1.5 rounded-lg border border-border">
          <Info className="w-4 h-4 text-role-patient" />
          <span className="text-xs text-text-secondary font-medium">UHID:</span>
          <span className="text-xs font-mono font-bold text-text-primary">{responseData?.data?.patient?.uhid}</span>
          {profile && (
            <span className="text-xs px-2 py-0.5 rounded bg-bg-subtle text-role-patient border border-role-patient/20">
              V{profile.version}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left Side Tab Selector */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-fast text-left ${
              activeTab === "profile"
                ? "bg-role-patient text-text-inverse shadow-md"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-subtle/50"
            }`}
          >
            <User className="w-[18px] h-[18px]" />
            Personal Profile
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-fast text-left ${
              activeTab === "preferences"
                ? "bg-role-patient text-text-inverse shadow-md"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-subtle/50"
            }`}
          >
            <Sliders className="w-[18px] h-[18px]" />
            Preferences
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-fast text-left ${
              activeTab === "security"
                ? "bg-role-patient text-text-inverse shadow-md"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-subtle/50"
            }`}
          >
            <ShieldAlert className="w-[18px] h-[18px]" />
            Account Security
          </button>
        </div>

        {/* Right Side Tab Form Container */}
        <div className="md:col-span-3">
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6">
              {/* Personal Info Card */}
              <Card className="p-6 bg-bg-surface border-border flex flex-col gap-6">
                <div>
                  <h3 className="text-base font-semibold text-text-primary">Personal Details</h3>
                  <p className="text-xs text-text-secondary mt-1">General identity and contact details used for registrations.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name *"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  <Input
                    label="Date of Birth *"
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                  <div className="flex flex-col gap-[6px]">
                    <label className="text-sm font-medium text-text-secondary">Gender *</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="h-10 px-3 rounded-md bg-bg-muted text-text-primary border border-border text-base outline-none focus:border-role-patient focus:ring-2 focus:ring-role-patient/20"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer Not To Say</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-[6px]">
                    <label className="text-sm font-medium text-text-secondary">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="h-10 px-3 rounded-md bg-bg-muted text-text-primary border border-border text-base outline-none focus:border-role-patient focus:ring-2 focus:ring-role-patient/20"
                    >
                      <option value="">Unknown / Choose...</option>
                      <option value="A_positive">A+ (A Positive)</option>
                      <option value="A_negative">A- (A Negative)</option>
                      <option value="B_positive">B+ (B Positive)</option>
                      <option value="B_negative">B- (B Negative)</option>
                      <option value="AB_positive">AB+ (AB Positive)</option>
                      <option value="AB_negative">AB- (AB Negative)</option>
                      <option value="O_positive">O+ (O Positive)</option>
                      <option value="O_negative">O- (O Negative)</option>
                    </select>
                  </div>
                  <Input
                    label="Mobile Number"
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </Card>

              {/* Address details */}
              <Card className="p-6 bg-bg-surface border-border flex flex-col gap-6">
                <div>
                  <h3 className="text-base font-semibold text-text-primary">Address Information</h3>
                  <p className="text-xs text-text-secondary mt-1">Current location coordinates for communication.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                  <Input
                    label="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                  <Input
                    label="Pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                  />
                </div>
              </Card>

              {/* Emergency Contact */}
              <Card className="p-6 bg-bg-surface border-border flex flex-col gap-6">
                <div>
                  <h3 className="text-base font-semibold text-text-primary">Emergency Contact</h3>
                  <p className="text-xs text-text-secondary mt-1">Designated relative or contact person in case of medical crisis.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Contact Name"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                  />
                  <Input
                    label="Relationship"
                    value={emergencyRelation}
                    onChange={(e) => setEmergencyRelation(e.target.value)}
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                  />
                </div>
              </Card>

              {/* Insurance */}
              <Card className="p-6 bg-bg-surface border-border flex flex-col gap-6">
                <div>
                  <h3 className="text-base font-semibold text-text-primary">Insurance Details</h3>
                  <p className="text-xs text-text-secondary mt-1">Corporate or private medical claim policy metrics.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Insurance Provider"
                    value={insProvider}
                    onChange={(e) => setInsProvider(e.target.value)}
                  />
                  <Input
                    label="Policy Number"
                    value={insPolicy}
                    onChange={(e) => setInsPolicy(e.target.value)}
                  />
                  <Input
                    label="Validity Date"
                    type="date"
                    value={insValidity}
                    onChange={(e) => setInsValidity(e.target.value)}
                  />
                </div>
              </Card>

              <div className="flex justify-end gap-3">
                <Button
                  type="submit"
                  loading={updateProfileMutation.isPending}
                  className="bg-role-patient text-text-inverse hover:bg-role-patient/90 px-6"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </form>
          )}

          {activeTab === "preferences" && (
            <form onSubmit={handlePreferencesSubmit} className="flex flex-col gap-6">
              <Card className="p-6 bg-bg-surface border-border flex flex-col gap-6">
                <div>
                  <h3 className="text-base font-semibold text-text-primary">Notification Settings</h3>
                  <p className="text-xs text-text-secondary mt-1">Choose how and in what language you prefer to receive notifications.</p>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-text-primary">Preferred Communication Channel</label>
                    <p className="text-xs text-text-secondary">Standard channel for prescriptions, billing, and alerts.</p>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                        <input
                          type="radio"
                          name="prefContact"
                          value="sms"
                          checked={preferredContact === "sms"}
                          onChange={() => setPreferredContact("sms")}
                          className="accent-role-patient"
                        />
                        SMS Messages
                      </label>
                      <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                        <input
                          type="radio"
                          name="prefContact"
                          value="email"
                          checked={preferredContact === "email"}
                          onChange={() => setPreferredContact("email")}
                          className="accent-role-patient"
                        />
                        Email
                      </label>
                      <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                        <input
                          type="radio"
                          name="prefContact"
                          value="whatsapp"
                          checked={preferredContact === "whatsapp"}
                          onChange={() => setPreferredContact("whatsapp")}
                          className="accent-role-patient"
                        />
                        WhatsApp
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 max-w-sm">
                    <label className="text-sm font-semibold text-text-primary">Preferred Language</label>
                    <p className="text-xs text-text-secondary">Language used in system notifications and clinical documents.</p>
                    <select
                      value={preferredLanguage}
                      onChange={(e) => setPreferredLanguage(e.target.value)}
                      className="h-10 px-3 mt-2 rounded-md bg-bg-muted text-text-primary border border-border text-base outline-none focus:border-role-patient focus:ring-2 focus:ring-role-patient/20"
                    >
                      <option value="en">English (US/UK)</option>
                      <option value="hi">Hindi (हिन्दी)</option>
                      <option value="es">Spanish (Español)</option>
                      <option value="fr">French (Français)</option>
                    </select>
                  </div>
                </div>
              </Card>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={updatePreferencesMutation.isPending}
                  className="bg-role-patient text-text-inverse hover:bg-role-patient/90 px-6"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </form>
          )}

          {activeTab === "security" && (
            <form onSubmit={handleSecuritySubmit} className="flex flex-col gap-6">
              {/* Account Settings */}
              <Card className="p-6 bg-bg-surface border-border flex flex-col gap-6">
                <div>
                  <h3 className="text-base font-semibold text-text-primary">Regional Settings</h3>
                  <p className="text-xs text-text-secondary mt-1">Locale context parameters used for session rendering.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-[6px]">
                    <label className="text-sm font-medium text-text-secondary">Timezone</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="h-10 px-3 rounded-md bg-bg-muted text-text-primary border border-border text-base outline-none focus:border-role-patient focus:ring-2 focus:ring-role-patient/20"
                    >
                      <option value="Asia/Kolkata">India Standard Time (GMT+5:30)</option>
                      <option value="UTC">UTC (GMT+0)</option>
                      <option value="America/New_York">Eastern Time (EST/EDT)</option>
                      <option value="Europe/London">London Time (GMT/BST)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-[6px]">
                    <label className="text-sm font-medium text-text-secondary">Portal Interface Language</label>
                    <select
                      value={langCode}
                      onChange={(e) => setLangCode(e.target.value)}
                      className="h-10 px-3 rounded-md bg-bg-muted text-text-primary border border-border text-base outline-none focus:border-role-patient focus:ring-2 focus:ring-role-patient/20"
                    >
                      <option value="en">English</option>
                      <option value="hi">हिन्दी</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Password Change */}
              <Card className="p-6 bg-bg-surface border-border flex flex-col gap-6">
                <div>
                  <h3 className="text-base font-semibold text-text-primary">Change Password</h3>
                  <p className="text-xs text-text-secondary mt-1">Reset account password keys regularly to keep it secure.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required={!!newPassword}
                  />
                  <Input
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    helperText="Minimum 8 characters"
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={
                      newPassword && confirmPassword && newPassword !== confirmPassword
                        ? "Passwords do not match"
                        : undefined
                    }
                  />
                </div>
              </Card>

              {/* Multi-Factor Authentication */}
              <Card className="p-6 bg-bg-surface border-border flex flex-col gap-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-text-primary">Multi-Factor Authentication (MFA)</h3>
                    <p className="text-xs text-text-secondary mt-1">Add an extra layer of protection to your clinical login credentials.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={mfaEnabled}
                      onChange={(e) => {
                        setMfaEnabled(e.target.checked);
                        if (!e.target.checked) setTotpSecret(null);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-bg-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-secondary after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-role-patient peer-checked:after:bg-text-inverse"></div>
                  </label>
                </div>

                {/* MFA Details Panel (Visible when enabling MFA) */}
                {mfaEnabled && (
                  <div className="p-4 rounded-lg border border-border bg-bg-muted/30 flex flex-col md:flex-row gap-6 animate-fade-in">
                    {/* Mock QR Code representation */}
                    <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center p-2 shrink-0 shadow-md">
                      <QrCode className="w-full h-full text-bg-base" />
                    </div>

                    <div className="flex-1 flex flex-col gap-3">
                      <h4 className="text-sm font-semibold text-text-primary">Register in Authenticator App</h4>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Scan the QR Code with Google Authenticator or Microsoft Authenticator. If you cannot scan it, copy the secret registration key below.
                      </p>
                      {totpSecret ? (
                        <div className="flex flex-col gap-1.5 max-w-sm mt-1">
                          <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Secret Key</label>
                          <div className="flex h-9 rounded bg-bg-surface border border-border items-center overflow-hidden">
                            <span className="flex-1 px-3 text-xs font-mono text-text-primary select-all truncate">{totpSecret}</span>
                            <button
                              type="button"
                              onClick={handleCopySecret}
                              className="h-full px-3 border-l border-border bg-bg-subtle hover:bg-bg-subtle/80 text-text-secondary transition-colors"
                            >
                              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-role-patient" />
                          <span>Generating secret key on save...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={updateSecurityMutation.isPending}
                  className="bg-role-patient text-text-inverse hover:bg-role-patient/90 px-6"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Security Settings
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
