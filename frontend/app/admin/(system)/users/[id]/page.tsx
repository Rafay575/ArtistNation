"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Building, Calendar, CheckCircle, XCircle, User, Briefcase, MapPin, Globe, Tag, Star } from "lucide-react";
import { api } from "@/lib/api";

// Types (reuse from the list page or define separately)
interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
  is_verified: boolean;
  is_onboarded: boolean;
  is_admin: boolean;
  artist_name: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  primary_genre: string | null;
  secondary_genres: string | null;
  profile_picture_url: string | null;
  stripe_customer_id: string | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  is_trial_expired: boolean;
  plan: string | null;
  billing_cycle: string | null;
  billing_address: string | null;
  onboarding_step: number;
  signed_status: string | null;
  label_name: string | null;
  management_company: string | null;
  agency_info: string | null;
  goals: string | null;
  socials: string | null;
  website_url: string | null;
  years_active: string | null;
  experience_level: string | null;
}

interface Business {
  id: number;
  name: string;
  subdomain: string;
  is_active: boolean;
  is_onboarded: boolean;
  stripe_account_status: string;
  stripe_account_id: string | null;
  billing_address: string | null;
}

interface Subscription {
  id: number;
  plan: string;
  billing_cycle: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
}

interface ApiUser {
  user: User;
  business: Business | null;
  subscription: Subscription | null;
}

export default function UserDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [userData, setUserData] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<{ success: boolean; data: ApiUser }>(`/api/admin/users/${id}`);
        if (response.data.success) {
          setUserData(response.data.data);
        } else {
          throw new Error("Failed to fetch user details");
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading user details...</div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">{error || "User not found"}</div>
      </div>
    );
  }

  const { user, business, subscription } = userData;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>

        {/* Profile Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
              {user.profile_picture_url ? (
                <img src={user.profile_picture_url} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-purple-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{user.full_name}</h1>
                {user.is_verified ? (
                  <span className="inline-flex items-center gap-1 text-green-700 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-gray-500 text-sm font-medium">
                    <XCircle className="w-4 h-4" />
                    Unverified
                  </span>
                )}
                {user.is_admin && (
                  <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {user.email}</span>
                {user.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {user.phone}</span>}
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Joined {new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats / Quick info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Artist Name</p>
            <p className="text-lg font-semibold text-gray-900">{user.artist_name || "—"}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Plan</p>
            <p className="text-lg font-semibold text-gray-900 capitalize">{subscription?.plan || user.plan || "—"}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Status</p>
            <p className="text-lg font-semibold text-gray-900 capitalize">{subscription?.status || "No subscription"}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Onboarding</p>
            <p className="text-lg font-semibold text-gray-900">{user.is_onboarded ? "Completed" : `Step ${user.onboarding_step}`}</p>
          </div>
        </div>

        {/* Details grid */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase">Full Name</label>
              <p className="text-sm text-gray-800">{user.full_name}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Email</label>
              <p className="text-sm text-gray-800">{user.email}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Phone</label>
              <p className="text-sm text-gray-800">{user.phone || "—"}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Artist Name</label>
              <p className="text-sm text-gray-800">{user.artist_name || "—"}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Primary Genre</label>
              <p className="text-sm text-gray-800">{user.primary_genre || "—"}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Secondary Genres</label>
              <p className="text-sm text-gray-800">{user.secondary_genres || "—"}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Location</label>
              <p className="text-sm text-gray-800">{user.city || "—"}{user.state ? `, ${user.state}` : ""}{user.country ? `, ${user.country}` : ""}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Years Active</label>
              <p className="text-sm text-gray-800">{user.years_active || "—"}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Experience Level</label>
              <p className="text-sm text-gray-800 capitalize">{user.experience_level || "—"}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Signed Status</label>
              <p className="text-sm text-gray-800 capitalize">{user.signed_status || "—"}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Label</label>
              <p className="text-sm text-gray-800">{user.label_name || "—"}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Management</label>
              <p className="text-sm text-gray-800">{user.management_company || "—"}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Agency</label>
              <p className="text-sm text-gray-800">{user.agency_info || "—"}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Website</label>
              <p className="text-sm text-gray-800">
                {user.website_url ? (
                  <a href={user.website_url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                    {user.website_url}
                  </a>
                ) : "—"}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Bio</label>
              <p className="text-sm text-gray-800">{user.bio || "—"}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Billing Address</label>
              <p className="text-sm text-gray-800">{user.billing_address || "—"}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Trial Period</label>
              <p className="text-sm text-gray-800">
                {user.trial_start_date ? `${new Date(user.trial_start_date).toLocaleDateString()} – ${user.trial_end_date ? new Date(user.trial_end_date).toLocaleDateString() : "Ongoing"}` : "—"}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Trial Expired</label>
              <p className="text-sm text-gray-800">{user.is_trial_expired ? "Yes" : "No"}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Stripe Customer ID</label>
              <p className="text-sm text-gray-800">{user.stripe_customer_id || "—"}</p>
            </div>
          </div>
        </div>

        {/* Business Info */}
        {business && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5" />
              Business
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase">Business Name</label>
                <p className="text-sm text-gray-800">{business.name}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Subdomain</label>
                <p className="text-sm text-gray-800">{business.subdomain}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Active</label>
                <p className="text-sm text-gray-800">{business.is_active ? "Yes" : "No"}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Onboarded</label>
                <p className="text-sm text-gray-800">{business.is_onboarded ? "Yes" : "No"}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Stripe Account Status</label>
                <p className="text-sm text-gray-800 capitalize">{business.stripe_account_status}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Stripe Account ID</label>
                <p className="text-sm text-gray-800">{business.stripe_account_id || "—"}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 uppercase">Billing Address</label>
                <p className="text-sm text-gray-800">{business.billing_address || "—"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Info */}
        {subscription && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Subscription
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase">Plan</label>
                <p className="text-sm text-gray-800 capitalize">{subscription.plan}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Billing Cycle</label>
                <p className="text-sm text-gray-800 capitalize">{subscription.billing_cycle}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Status</label>
                <p className="text-sm text-gray-800 capitalize">{subscription.status}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Started</label>
                <p className="text-sm text-gray-800">{new Date(subscription.started_at).toLocaleDateString()}</p>
              </div>
              {subscription.expires_at && (
                <div>
                  <label className="text-xs text-gray-500 uppercase">Expires</label>
                  <p className="text-sm text-gray-800">{new Date(subscription.expires_at).toLocaleDateString()}</p>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 uppercase">Stripe Subscription ID</label>
                <p className="text-sm text-gray-800">{subscription.stripe_subscription_id || "—"}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Stripe Customer ID</label>
                <p className="text-sm text-gray-800">{subscription.stripe_customer_id || "—"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}