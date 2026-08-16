import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Building2,
  Sliders,
  ShieldCheck,
  Save,
  CheckCircle2,
  Lock,
  Globe,
  Mail,
  Phone,
  FileText
} from "lucide-react";
import toast from "react-hot-toast";

export default function InstitutionSettings() {
  const { activeInstitution } = useOutletContext() || {};

  const [minScore, setMinScore] = useState("60");
  const [maxMultiplier, setMaxMultiplier] = useState("1.2");
  const [baseInterest, setBaseInterest] = useState("13.5");
  const [requireEbm, setRequireEbm] = useState(true);
  const [requireConsent, setRequireConsent] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    toast.success(`Underwriting criteria for ${activeInstitution?.name || "Institution"} updated!`);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 font-body text-ink">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-heading font-black text-ink tracking-tight">
          Lending Criteria & Institutional Profile
        </h1>
        <p className="text-xs text-muted mt-1">
          Configure automated credit scoring weights, risk thresholds, and BNR compliance settings for {activeInstitution?.name || "Institution"}.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Institution Identity Card */}
        <div className="rounded-3xl border border-line bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center gap-3 font-heading pb-3 border-b border-line">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-ink">{activeInstitution?.name || "Umwalimu SACCO"}</h3>
              <p className="text-[11px] text-muted">{activeInstitution?.type} &bull; BNR Code: {activeInstitution?.bnrCode}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-body">
            <div>
              <span className="text-muted block">Central Bank License Status:</span>
              <span className="font-heading font-bold text-primary flex items-center gap-1 mt-0.5">
                <CheckCircle2 size={13} /> Active & Authorized by BNR Rwanda
              </span>
            </div>
            <div>
              <span className="text-muted block">Maximum Single SME Exposure:</span>
              <span className="font-heading font-bold text-ink mt-0.5">
                {activeInstitution?.maxLoan ? (activeInstitution.maxLoan / 1000000) + "M RWF" : "25M RWF"}
              </span>
            </div>
          </div>
        </div>

        {/* Automated Underwriting Thresholds */}
        <div className="rounded-3xl border border-line bg-card p-6 shadow-card space-y-5 font-heading">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-primary" />
            <h3 className="text-sm font-black text-ink uppercase tracking-wider">
              Automated Credit Decision Rules
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-body">
            <div className="space-y-1 font-heading">
              <label className="text-xs font-bold text-muted uppercase">Minimum Health Score (0–100)</label>
              <input
                type="number"
                min="30"
                max="95"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                className="w-full bg-paper border border-line rounded-xl px-3.5 py-2.5 text-xs font-bold text-ink focus:outline-none focus:border-primary font-heading"
              />
              <span className="text-[10.5px] text-muted font-normal block">Applicants below this score are placed on the Watchlist.</span>
            </div>

            <div className="space-y-1 font-heading">
              <label className="text-xs font-bold text-muted uppercase">Turnover Multiplier Cap (x)</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="3.0"
                value={maxMultiplier}
                onChange={(e) => setMaxMultiplier(e.target.value)}
                className="w-full bg-paper border border-line rounded-xl px-3.5 py-2.5 text-xs font-bold text-ink focus:outline-none focus:border-primary font-heading"
              />
              <span className="text-[10.5px] text-muted font-normal block">Maximum loan limit relative to 30-day till turnover.</span>
            </div>

            <div className="space-y-1 font-heading">
              <label className="text-xs font-bold text-muted uppercase">Standard Interest Rate (% APR)</label>
              <input
                type="number"
                step="0.5"
                value={baseInterest}
                onChange={(e) => setBaseInterest(e.target.value)}
                className="w-full bg-paper border border-line rounded-xl px-3.5 py-2.5 text-xs font-bold text-ink focus:outline-none focus:border-primary font-heading"
              />
            </div>
          </div>

          {/* Compliance Checkbox Toggles */}
          <div className="pt-3 border-t border-line space-y-3 font-body">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-card-hover border border-line cursor-pointer">
              <input
                type="checkbox"
                checked={requireEbm}
                onChange={(e) => setRequireEbm(e.target.checked)}
                className="rounded text-primary focus:ring-primary h-4 w-4 bg-paper border-line"
              />
              <div>
                <span className="font-heading font-black text-xs text-ink block">Mandate RRA EBM Tax Compliance</span>
                <span className="text-[11px] text-muted">Only disburse to merchants with active TIN and verified fiscal receipt records.</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-card-hover border border-line cursor-pointer">
              <input
                type="checkbox"
                checked={requireConsent}
                onChange={(e) => setRequireConsent(e.target.checked)}
                className="rounded text-primary focus:ring-primary h-4 w-4 bg-paper border-line"
              />
              <div>
                <span className="font-heading font-black text-xs text-ink block">Enforce Explicit SACCO Data Consent</span>
                <span className="text-[11px] text-muted">Comply with Rwanda Data Protection Law (Law N° 058/2021).</span>
              </div>
            </label>
          </div>

          <div className="pt-2 font-heading">
            <button
              type="submit"
              className="btn-kinetic flex items-center justify-center gap-2 px-6 py-3 text-xs font-black cursor-pointer shadow-orange-sm"
            >
              <Save size={15} />
              <span>Save Lending Rules & Policies</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
