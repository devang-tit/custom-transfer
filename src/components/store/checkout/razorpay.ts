"use client";

/** Minimal typing for Razorpay Checkout (https://checkout.razorpay.com/v1/checkout.js). */
type RazorpayResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void; confirm_close?: boolean };
};
type RazorpayInstance = { open: () => void; on: (event: "payment.failed", cb: (r: { error?: { description?: string } }) => void) => void };
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let loading: Promise<boolean> | null = null;

/** Loads Razorpay's checkout script once. Resolves false if it can't load (offline, blocked). */
export function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  loading ??= new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve(!!window.Razorpay);
    s.onerror = () => {
      loading = null;
      resolve(false);
    };
    document.body.appendChild(s);
  });
  return loading;
}

export type OpenResult = { status: "paid"; response: RazorpayResponse } | { status: "dismissed" };

/**
 * Opens Razorpay Checkout and resolves when the customer pays or closes it. A failed attempt keeps
 * the window open (Razorpay lets them retry another method); `onFailed` reports it.
 */
export function openRazorpay(options: Omit<RazorpayOptions, "handler" | "modal">, onFailed?: (message: string) => void): Promise<OpenResult> {
  return new Promise((resolve) => {
    const rzp = new window.Razorpay!({
      ...options,
      handler: (response) => resolve({ status: "paid", response }),
      modal: { ondismiss: () => resolve({ status: "dismissed" }), confirm_close: true },
    });
    rzp.on("payment.failed", (r) => onFailed?.(r.error?.description ?? "Payment failed. Try another method."));
    rzp.open();
  });
}
