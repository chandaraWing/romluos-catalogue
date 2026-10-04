'use client';

import React, { useState } from 'react';
import { X, Zap, Phone, Calculator, CheckCircle2, Send } from 'lucide-react';
import { BankerInfo, BranchInfo } from './CatalogTypes';
import { Button } from '@/components/ui/button';

interface BankerFinancingModalProps {
  isOpen: boolean;
  onClose: () => void;
  banker: BankerInfo;
  branch: BranchInfo;
  cartAmount?: number;
  totalItemsCount?: number;
  onSubmitInquiry?: (data: { name: string; phone: string; tenure: number }) => void;
}

export const BankerFinancingModal: React.FC<BankerFinancingModalProps> = ({
  isOpen,
  onClose,
  banker,
  branch,
  cartAmount = 0,
  totalItemsCount = 0,
  onSubmitInquiry,
}) => {
  if (!isOpen) return null;

  const [selectedTenure, setSelectedTenure] = useState<number>(12);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [inquirySubmitting, setInquirySubmitting] = useState<boolean>(false);
  const [inquirySuccess, setInquirySuccess] = useState<boolean>(false);

  const loanBase = cartAmount > 0 ? cartAmount : 1299;
  const estimatedMonthly = loanBase / selectedTenure;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPhone.trim()) return;

    setInquirySubmitting(true);
    if (onSubmitInquiry) {
      onSubmitInquiry({ name: customerName, phone: customerPhone, tenure: selectedTenure });
    }
    setTimeout(() => {
      setInquirySubmitting(false);
      setInquirySuccess(true);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-accent-gradient text-white flex items-center justify-center shadow-lg shadow-brand/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                District Banker Financing
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instant Installment Approval for {branch?.name || 'Local Branch'}
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => {
              onClose();
              setInquirySuccess(false);
            }}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Assigned District Banker Card */}
        {banker && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-slate-500/5 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-base shadow-md">
                {banker.fullName?.charAt(0) || 'B'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {banker.fullName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Verified Banker
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {branch?.name} • {banker.email}
                </p>
              </div>
            </div>

            {banker.phone && (
              <a
                href={`tel:${banker.phone}`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all shrink-0"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call {banker.phone}</span>
              </a>
            )}
          </div>
        )}

        {/* Installment Calculator */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-brand" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Instant Loan Estimator
              </span>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              0% Interest Promotional Plan
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold">Financing Amount</span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                ${loanBase.toFixed(2)}
              </p>
              <span className="text-[10px] text-slate-400">
                {cartAmount > 0
                  ? `Based on ${totalItemsCount} cart item(s)`
                  : 'Estimated standard device cart'}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-semibold">Estimated Monthly</span>
              <p className="text-2xl font-black text-brand mt-0.5">
                ${estimatedMonthly.toFixed(2)}
                <span className="text-xs text-slate-400 font-normal"> /mo</span>
              </p>
              <span className="text-[10px] text-slate-400">For {selectedTenure} months tenure</span>
            </div>
          </div>

          {/* Tenure Selector */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Select Repayment Period:
            </span>
            <div className="grid grid-cols-4 gap-2">
              {[6, 12, 18, 24].map((tenure) => (
                <button
                  key={tenure}
                  type="button"
                  onClick={() => setSelectedTenure(tenure)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    selectedTenure === tenure
                      ? 'bg-brand text-slate-950 border-brand font-black shadow-md shadow-brand/25'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                  }`}
                >
                  {tenure} Mos
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Callback Request Form */}
        {inquirySuccess ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2 animate-in zoom-in-95">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              Inquiry Sent Successfully!
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {banker?.fullName || 'Your banker'} has been notified and will contact you at{' '}
              <strong>{customerPhone}</strong> shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Request Immediate Banker Callback
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Your Full Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
              <input
                type="tel"
                required
                placeholder="Your Phone Number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              size="lg"
              disabled={inquirySubmitting}
              isLoading={inquirySubmitting}
              className="w-full text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{inquirySubmitting ? 'Submitting Inquiry...' : 'Submit Financing Inquiry'}</span>
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
