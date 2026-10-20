"use client";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useWebsiteConfig } from "@/hooks/useWebsiteConfig";
import { api } from "@/lib/api"; // ✅ Import your axios instance

function ContactSkeleton() {
  return (
    <section className="w-full py-[120px] bg-gray-900">
      <div className="container mx-auto max-w-[1220px] px-[15px] md:px-[30px]">
        <div className="flex flex-col md:flex-row pb-[30px] gap-8">
          <div className="w-full md:w-1/2 space-y-4">
            <div className="h-10 w-2/3 animate-pulse rounded bg-white/10" />
            <div className="h-20 w-full animate-pulse rounded bg-white/10" />
          </div>
          <div className="w-full md:w-1/2 space-y-6 pt-[70px]">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 w-full animate-pulse rounded bg-white/10" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const Contact = () => {
  const { data: config, isLoading } = useWebsiteConfig();

  const [loading, setLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formResponse, setFormResponse] = useState("");
  const [formHasError, setFormHasError] = useState(false);

  const emptyFormData = {
    firstName: "",
    lastName: "",
    phone_cf: "",
    email_cf: "",
    subject: "",
    message: "",
  };
  const [formData, setFormData] = useState(emptyFormData);

  const inputHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { value, id } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setFormSubmitted(false);
    setFormHasError(false);

    try {
      // ✅ Use axios instance from /lib/api.ts
      const response = await api.post("/api/site-contact", {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email_cf,
        phone: formData.phone_cf,
        subject: formData.subject,
        message: formData.message,
      });

      if (response.data.success) {
        setFormHasError(false);
        setFormResponse("✅ Message sent successfully! We'll get back to you soon.");
        setFormSubmitted(true);
        toast.success("Message sent successfully!");
        setFormData(emptyFormData);
        (e.target as HTMLFormElement).reset();
      } else {
        throw new Error(response.data.error || "Failed to send message");
      }
    } catch (error: any) {
      console.error("Contact form error:", error);
      setFormHasError(true);
      const errorMsg = error.response?.data?.error || error.message || "Failed to send message. Please try again.";
      setFormResponse(`❌ ${errorMsg}`);
      setFormSubmitted(true);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <ContactSkeleton />;

  const contact = config?.contact;

  if (!contact) return null;

  const { backgroundImage, heading, description } = contact;

  return (
    <section
      id="contact"
      className="w-full py-[120px] bg-center bg-cover"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="container mx-auto max-w-[1220px] px-[15px] md:px-[30px]">
        <div className="flex flex-col md:flex-row pb-[30px]">
          {/* Left: Info */}
          <div className="w-full md:w-1/2 flex mb-8 md:mb-0">
            <div className="text-center md:text-left">
              <h1 className="font-extrabold text-[2.5rem] mb-4">{heading}</h1>
              <p className="font-['Inter'] text-base font-normal leading-[25.2px] text-left">
                {description}
              </p>
            </div>
          </div>

          {/* Right: Form */}
          <div className="w-full md:w-1/2">
            <form
              className="pt-[70px] pb-[30px] max-md:py-[30px]"
              onSubmit={handleSubmit}
            >
              {/* Row 1: First name & Last name */}
              <div className="flex flex-wrap -mx-2 mb-[5px]">
                <div className="w-full md:w-1/2 px-2 mb-[30px]">
                  <label className="font-unbounded" htmlFor="firstName">First name:</label>
                  <input
                    type="text"
                    id="firstName"
                    required
                    onChange={inputHandler}
                    value={formData.firstName}
                    className="w-full bg-transparent border-0 border-b border-[#707070] outline-none shadow-none mb-0"
                  />
                </div>
                <div className="w-full md:w-1/2 px-2 mb-[30px]">
                  <label className="font-unbounded" htmlFor="lastName">Last name:</label>
                  <input
                    type="text"
                    id="lastName"
                    required
                    onChange={inputHandler}
                    value={formData.lastName}
                    className="w-full bg-transparent border-0 border-b border-[#707070] outline-none shadow-none mb-0"
                  />
                </div>
              </div>

              {/* Row 2: Phone & Email */}
              <div className="flex flex-wrap -mx-2 mb-[5px]">
                <div className="w-full md:w-1/2 px-2 mb-[30px]">
                  <label className="font-unbounded" htmlFor="phone_cf">Phone:</label>
                  <input
                    type="text"
                    id="phone_cf"
                    required
                    onChange={inputHandler}
                    value={formData.phone_cf}
                    className="w-full bg-transparent border-0 border-b border-[#707070] outline-none shadow-none mb-0"
                  />
                </div>
                <div className="w-full md:w-1/2 px-2 mb-[30px]">
                  <label className="font-unbounded" htmlFor="email_cf">Email:</label>
                  <input
                    type="email"
                    id="email_cf"
                    required
                    onChange={inputHandler}
                    value={formData.email_cf}
                    className="w-full bg-transparent border-0 border-b border-[#707070] outline-none shadow-none mb-0"
                  />
                </div>
              </div>

              {/* Row 3: Subject */}
              <div className="flex flex-wrap -mx-2 mb-[5px]">
                <div className="w-full px-2 mb-[30px]">
                  <label className="font-unbounded" htmlFor="subject">Subject:</label>
                  <input
                    type="text"
                    id="subject"
                    onChange={inputHandler}
                    value={formData.subject}
                    className="w-full bg-transparent border-0 border-b border-[#707070] outline-none shadow-none mb-0"
                  />
                </div>
              </div>

              {/* Row 4: Message */}
              <div className="flex flex-wrap -mx-2 mb-[-30px]">
                <div className="w-full px-2 mb-[30px]">
                  <label className="font-unbounded" htmlFor="message">Message:</label>
                  <textarea
                    rows={4}
                    cols={50}
                    id="message"
                    required
                    onChange={inputHandler}
                    value={formData.message}
                    className="w-full bg-transparent border-0 border-b border-[#707070] outline-none shadow-none min-h-[100px] text-xl"
                  />
                </div>
              </div>

              {/* Submit wrapper */}
              <div className="flex justify-end max-[991px]:w-full max-[991px]:mb-[50px] max-[991px]:mx-auto">
                <button
                  type="submit"
                  disabled={loading}
                  className="pointer border border-[#7620ff] rounded-lg w-full max-w-[200px] py-[14px] px-4 text-white outline-none
                    bg-[linear-gradient(97.93deg,#050455_2.58%,#4f057c_100%)] hover:opacity-80 transition-opacity
                    max-[991px]:mx-auto disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {!loading && <span>Send Message</span>}
                  {loading && (
                    <div className="w-full text-center flex items-center justify-center gap-2">
                      <span>Sending...</span>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              </div>
            </form>

            {formSubmitted && (
              <div
                className={`text-center font-bold p-3 rounded-lg ${
                  formHasError
                    ? "text-red-600 bg-red-50 border border-red-200"
                    : "text-green-600 bg-green-50 border border-green-200"
                }`}
              >
                {formResponse}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;