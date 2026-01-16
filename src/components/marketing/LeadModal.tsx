"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import { submitGodrejLead } from "@/app/actions/campaignLeads";

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LeadModal({ isOpen, onClose }: LeadModalProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [isOpen]);

  const isSuccess = useMemo(() => !!successMessage, [successMessage]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const phone = String(formData.get("phone") || "");
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setIsSubmitting(false);
      setErrorMessage("Please enter a valid 10-digit phone number.");
      return;
    }

    const result = await submitGodrejLead(formData);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage("We will call you soon!");
      form.reset();
      return;
    }

    setErrorMessage(result.message || "Something went wrong. Please try again.");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 py-10">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-500 hover:bg-gray-100"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-2xl font-semibold text-gray-900">
          Check Your Eligibility
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Get the 5% Down Payment Plan details for Godrej Regal Pavilion.
        </p>

        {isSuccess ? (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <p className="text-sm font-semibold text-green-700">
              We will call you soon!
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="hidden"
              name="source_page"
              value={`${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`}
            />
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <input
                name="name"
                type="text"
                required
                placeholder="Your full name"
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                name="phone"
                type="tel"
                required
                placeholder="10-digit mobile number"
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Employment Type
              </label>
              <div className="mt-2 flex flex-wrap gap-3">
                {[
                  { label: "Salaried", value: "Salaried" },
                  { label: "Self-Employed", value: "Self-Employed" },
                  { label: "NRI", value: "NRI" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-700"
                  >
                    <input
                      type="radio"
                      name="user_type"
                      value={option.value}
                      className="text-[#D4AF37] focus:ring-[#D4AF37]"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            {errorMessage && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-[#0A192F] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Submitting..." : "Get Offer Details"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
