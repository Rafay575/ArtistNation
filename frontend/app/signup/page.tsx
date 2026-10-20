"use client"

// app/signup/page.tsx
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import SignUpPage from '@/components/SignUpPage'; // your existing component

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function SignUp() {
  return (
    <Elements stripe={stripePromise}>
      <SignUpPage />
    </Elements>
  );
}