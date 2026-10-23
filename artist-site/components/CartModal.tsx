"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { useFanAuth } from "@/hooks/useFanAuth";
import toast from "react-hot-toast";
import { HiOutlineCreditCard, HiSearch, HiCheck } from "react-icons/hi";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronDown } from "lucide-react";


// ---------- Searchable Select Component ----------
function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: { id: number; name: string; address?: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const filteredOptions = options.filter(
    (opt) =>
      opt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.address && opt.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedOption = options.find((opt) => opt.name === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full border rounded-lg px-3 py-2 bg-white cursor-pointer focus:ring-2 focus:ring-purple-300 transition"
      >
        <span className={selectedOption ? "text-gray-900" : "text-gray-400"}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-hidden flex flex-col">
          <div className="p-2 border-b">
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search location..."
                className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-purple-300"
              />
            </div>
          </div>

          <div className="overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.name);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer hover:bg-purple-50 transition ${
                    value === opt.name ? "bg-purple-50 text-purple-700" : "text-gray-700"
                  }`}
                >
                  <div>
                    <p className="font-medium">{opt.name}</p>
                    {opt.address && (
                      <p className="text-xs text-gray-500 mt-0.5">{opt.address}</p>
                    )}
                  </div>
                  {value === opt.name && <HiCheck className="w-4 h-4 text-purple-600 shrink-0" />}
                </div>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-gray-500 text-center">
                No locations found.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Checkout Form ----------
function CheckoutForm({
  totalPrice,
  primaryColor,
  fanToken,
  subdomain,
  onSuccess,
  checkoutForm,
  setCheckoutForm,
  pickupLocations,
  items,
}: {
  totalPrice: number;
  primaryColor: string;
  fanToken: string;
  subdomain: string;
  onSuccess: () => void;
  checkoutForm: any;
  setCheckoutForm: (form: any) => void;
  pickupLocations: { id: number; name: string; address?: string }[];
  items: { id: string; title: string; price: number; quantity: number; image?: string }[];
}) {
  const checkoutAttempt = useRef<{ fingerprint: string; requestId: string } | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (processing) return;
    setProcessing(true);
    try {
      const payload = { items: items.map(i => ({ id: i.id, quantity: i.quantity, title: i.title, image: i.image || '/placeholder.png' })), fanInfo: checkoutForm };
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify({ subdomain, payload })));
      const fingerprint = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      if (checkoutAttempt.current?.fingerprint !== fingerprint) {
        // Only an opaque retry ID and content hash are persisted, never credentials or form fields.
        let previous: { fingerprint: string; requestId: string } | null = null;
        try { previous = JSON.parse(sessionStorage.getItem('artistnation-checkout') || 'null'); } catch {}
        checkoutAttempt.current = previous?.fingerprint === fingerprint ? previous : { fingerprint, requestId: crypto.randomUUID() };
        sessionStorage.setItem('artistnation-checkout', JSON.stringify(checkoutAttempt.current));
      }
      const { data } = await axios.post(
        process.env.NEXT_PUBLIC_API_URL + '/api/stripe/' + subdomain + '/checkout',
        { ...payload, requestId: checkoutAttempt.current.requestId },
        { headers: { Authorization: 'Bearer ' + fanToken } }
      );
      const url = new URL(data.url);
      if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw new Error('Invalid checkout URL');
      window.location.assign(url.href);
    } catch (err: any) {
      if (err.response?.data?.code === 'CHECKOUT_EXPIRED') {
        checkoutAttempt.current = null;
        sessionStorage.removeItem('artistnation-checkout');
      }
      toast.error(err.response?.data?.error || err.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">First Name *</label>
          <input
            type="text"
            required
            value={checkoutForm.firstName}
            onChange={(e) => setCheckoutForm({ ...checkoutForm, firstName: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="John"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Last Name *</label>
          <input
            type="text"
            required
            value={checkoutForm.lastName}
            onChange={(e) => setCheckoutForm({ ...checkoutForm, lastName: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Doe"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email *</label>
          <input
            type="email"
            required
            value={checkoutForm.email}
            onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="john@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone *</label>
          <input
            type="tel"
            required
            value={checkoutForm.phone}
            onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="+1 234 567 890"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Street Address *</label>
        <input
          type="text"
          required
          value={checkoutForm.street}
          onChange={(e) => setCheckoutForm({ ...checkoutForm, street: e.target.value })}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="123 Street Name"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">City *</label>
          <input
            type="text"
            required
            value={checkoutForm.city}
            onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="New York"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Postal Code *</label>
          <input
            type="text"
            required
            value={checkoutForm.postalCode}
            onChange={(e) => setCheckoutForm({ ...checkoutForm, postalCode: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="10001"
          />
        </div>
      </div>

      {/* Pickup Location – Searchable Select */}
      <div>
        <label className="block text-sm font-medium mb-1">Pickup Location *</label>
        <SearchableSelect
          options={pickupLocations}
          value={checkoutForm.pickupLocation}
          onChange={(val) => setCheckoutForm({ ...checkoutForm, pickupLocation: val })}
          placeholder="Select a pickup location"
        />
      </div>

      <p className="text-sm text-gray-500">Continue to Stripe to securely enter your payment details and confirm the final total.</p>

      <button
        type="submit"
        disabled={processing}
        className="w-full py-3 rounded-xl text-white font-semibold transition hover:opacity-90 mt-2 disabled:opacity-50"
        style={{ backgroundColor: primaryColor }}
      >
        {processing ? "Processing..." : `Continue to payment (${totalPrice.toFixed(2)})`}
      </button>
    </form>
  );
}

// ---------- Main CartModal ----------
export default function CartModal({
  isOpen,
  onClose,
  primaryColor,
}: {
  isOpen: boolean;
  onClose: () => void;
  primaryColor: string;
}) {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const { isLoggedIn, fanToken } = useFanAuth();
  const [view, setView] = useState<"cart" | "checkout">("cart");
  const [checkoutForm, setCheckoutForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    postalCode: "",
    pickupLocation: "",
  });
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeStatusLoading, setStripeStatusLoading] = useState(false);
  const [subdomain, setSubdomain] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSubdomain(window.location.hostname.split(".")[0]);
    }
  }, []);

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('checkout_session');
    if (!sessionId || !fanToken || !subdomain) return;
    let cancelled = false;
    axios.post(process.env.NEXT_PUBLIC_API_URL + '/api/stripe/' + subdomain + '/checkout/' + encodeURIComponent(sessionId) + '/confirm', {}, {
      headers: { Authorization: 'Bearer ' + fanToken },
    }).then(({ data }) => {
      if (cancelled) return;
      if (data.paid) {
        clearCart();
        sessionStorage.removeItem('artistnation-checkout');
        toast.success('Payment confirmed. Your order has been placed.');
        const url = new URL(window.location.href);
        url.searchParams.delete('checkout_session');
        window.history.replaceState(null, '', url.href);
      } else toast('Payment is not confirmed yet. Check your orders before paying again.');
    }).catch(() => { if (!cancelled) toast.error('Could not confirm payment. Check your orders before paying again.'); });
    return () => { cancelled = true; };
    // Cart updates must not restart payment confirmation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fanToken, subdomain]);

  // Fetch real pickup locations
  const { data: pickupLocations = [] } = useQuery({
    queryKey: ["pickupLocations", subdomain],
    queryFn: async () => {
      if (!subdomain) return [];
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/pickup-locations/${subdomain}`
      );
      return res.data;
    },
    enabled: !!subdomain,
  });

  const checkStripeStatus = async () => {
    setStripeStatusLoading(true);
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/stripe/${subdomain}/stripe-status`
      );
      setStripeConnected(res.data.connected);
    } catch (err) {
      setStripeConnected(false);
      toast.error("Could not verify payment availability.");
    } finally {
      setStripeStatusLoading(false);
    }
  };

  const proceedToCheckout = async () => {
    if (!isLoggedIn) {
      toast.error("Please login first");
      return;
    }
    await checkStripeStatus();
    setView("checkout");
  };

  const backToCart = () => setView("cart");
  const resetAndClose = () => {
    setView("cart");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <AnimatePresence mode="wait">
            {view === "cart" && (
              <motion.div
                key="cart"
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
              >
                <div className="flex items-center justify-between p-5 border-b">
                  <h2 className="text-xl font-semibold">Your Cart</h2>
                  <button onClick={resetAndClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {items.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Your cart is empty.</p>
                  ) : (
                    items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 border-b pb-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                          {item.image ? (
                            <Image src={item.image} alt={item.title} width={64} height={64} unoptimized className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">No img</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{item.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full border">-</button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full border">+</button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                          <button onClick={() => removeItem(item.id)} className="text-xs text-red-500 mt-1">Remove</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {items.length > 0 && (
                  <div className="p-5 border-t">
                    <div className="flex justify-between mb-4">
                      <span>Total</span>
                      <span className="font-bold">${totalPrice.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={proceedToCheckout}
                      className="w-full py-3 rounded-xl text-white font-semibold"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {view === "checkout" && (
              <motion.div
                key="checkout"
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
              >
                <div className="flex items-center justify-between p-5 border-b">
                  <div className="flex items-center gap-2">
                    <button onClick={backToCart} className="text-gray-500 hover:text-gray-700 text-xl">&larr;</button>
                    <h2 className="text-xl font-semibold">Checkout</h2>
                  </div>
                  <button onClick={resetAndClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  {stripeStatusLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                    </div>
                  ) : !stripeConnected ? (
                    <div className="space-y-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800">Payments unavailable</p>
                          <p className="text-sm text-amber-700 mt-1">
                            The artist has not connected their Stripe account yet. You can still fill in
                            your details, but payment cannot be processed right now.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <CheckoutForm
                        totalPrice={totalPrice}
                        primaryColor={primaryColor}
                        fanToken={fanToken!}
                        subdomain={subdomain!}
                        onSuccess={() => {
                          clearCart();
                          resetAndClose();
                        }}
                        checkoutForm={checkoutForm}
                        setCheckoutForm={setCheckoutForm}
                        pickupLocations={pickupLocations}
                        items={items}
                      />
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
