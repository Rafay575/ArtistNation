'use client';

import { useState } from 'react';
import { useArtist } from '@/contexts/ArtistContext';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';
import axios from 'axios';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export default function ContactSection({ content }: { content: any }) {
  const { settings } = useArtist();
  const primaryColor = settings?.primary_color || '#5D2FDB';

  const {
    subtitle = 'Get in Touch',
    title = 'Let\'s Connect',
    description = 'We\'d love to hear from you! Drop us a message and we\'ll get back to you as soon as possible.',
    image = '/contact-fallback.png',
    buttonText = 'Send Message',
  } = content;

  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsSubmitting(true);
  try {
    const subdomain = window.location.hostname.split('.')[0]; // extract subdomain
    await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/public/${subdomain}/contact`, formData);
    toast.success('Message sent!');
    setFormData({ name: '', email: '', phone: '', message: '' });
  } catch (err: any) {
    toast.error(err.response?.data?.error || 'Failed to send message.');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50" id="contact">
      <div className="container mx-auto grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: primaryColor }}>
            {subtitle}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: primaryColor }}>
            {title}
          </h2>
          <p className="text-gray-600 mb-8 md:w-[80%]">{description}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your Name"
                className="w-full rounded-lg bg-white px-4 py-3 text-base"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
                className="w-full rounded-lg bg-white px-4 py-3 text-base"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                className="w-full rounded-lg bg-white px-4 py-3 text-base"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Your message"
                rows={4}
                className="w-full rounded-lg bg-white px-4 py-3 text-base resize-y min-h-[100px]"
                required
                disabled={isSubmitting}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-sm px-6 py-2.5 text-white font-medium transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: primaryColor }}
            >
              {isSubmitting ? 'Submitting...' : buttonText}
            </button>
          </form>
        </div>

        <div className="relative">
          <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden bg-gray-200">
            <Image
              src={image}
              alt="Contact"
              width={600}
              height={450}
              className="w-full h-full object-cover"
              unoptimized={image.startsWith('http') || image.startsWith('data:')}
            />
          </div>
        </div>
      </div>
    </section>
  );
}