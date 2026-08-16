import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Building2,
  Sliders,
  Save,
  CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";

export default function InstitutionSettings() {
  const { activeInstitution } = useOutletContext() || {};

  const [minScore, setMinScore] = useState("60");
  const [maxMultiplier, setMaxMultiplier] = useState("1.2");
  const [baseInterest, setBaseInterest] = useState("13.5");

  const handleSave = (e) => {
    e.preventDefault();
    toast.success("Lending criteria updated!");
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 font-body text-ink max-w-xl mx-auto">
      <div className="font-heading">
        <h1 className="text-xl font-black text-ink tracking-tight">
          Lending Settings
        </h1>
        <p className="text-xs text-muted">
          {activeInstitution?.name || "Institution"} Underwriting Rules
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4 font-heading">
        {/* Profile Card */}
        <div className="p-4 rounded-2xl border border-line bg-card shadow-card flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-ink">{activeInstitution?.name}</h3>
            <p className="text-[11px] text-muted">{activeInstitution?.bnrCode}</p>
          </div>
          <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded">
            BNR Verified
          </span>
        </div>

        {/* Form Inputs */}
        <div className="p-4 rounded-2xl border border-line bg-card shadow-card space-y-3 font-body">
          <div className="space-y-1 font-heading">
            <label className="text-xs font-bold text-muted uppercase">Min Health Score</label>
            <input
              type="number"
              min="30"
              max="95"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              className="w-full bg-paper border border-line rounded-xl px-3.5 py-2 text-xs font-bold text-ink focus:outline-none focus:border-primary font-heading"
            />
          </div>

          <div className="space-y-1 font-heading">
            <label className="text-xs font-bold text-muted uppercase">Turnover Multiplier (x)</label>
            <input
              type="number"
              step="0.1"
              value={maxMultiplier}
              onChange={(e) => setMaxMultiplier(e.target.value)}
              className="w-full bg-paper border border-line rounded-xl px-3.5 py-2 text-xs font-bold text-ink focus:outline-none focus:border-primary font-heading"
            />
          </div>

          <div className="space-y-1 font-heading">
            <label className="text-xs font-bold text-muted uppercase">Base APR (%)</label>
            <input
              type="number"
              step="0.5"
              value={baseInterest}
              onChange={(e) => setBaseInterest(e.target.value)}
              className="w-full bg-paper border border-line rounded-xl px-3.5 py-2 text-xs font-bold text-ink focus:outline-none focus:border-primary font-heading"
            />
          </div>

          <button
            type="submit"
            className="btn-kinetic w-full py-3 text-xs font-black cursor-pointer shadow-orange-sm flex items-center justify-center gap-2 font-heading mt-2"
          >
            <Save size={14} />
            <span>Save Rules</span>
          </button>
        </div>
      </form>
    </div>
  );
}
