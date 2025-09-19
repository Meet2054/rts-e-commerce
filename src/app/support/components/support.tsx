'use client';
import { Mail, Phone, MessageCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function Support() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.message) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // In a real application, you would submit to your support API
      console.log('Support form submitted:', formData);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      setFormData({ fullName: '', phone: '', email: '', message: '' });
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting support form:', error);
      alert('Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  return (
    <section className="py-10 bg-[#F1F2F4]">
      <div className="max-w-[1550px] mx-auto px-4 sm:px-16">
        <div className="flex flex-col md:flex-row gap-10">
          {/* Left: Info */}
          <div className="flex flex-col gap-6 w-full md:w-1/2">
             <Image 
                src="/logo.svg" 
                alt="RTS Imaging" 
                width={200} 
                height={100} 
            />
            <div className="font-bold text-xl mb-2">Customer Care</div>
            <div className="text-gray-700 mb-4">
              We're here to help you with your orders, products, and support
              questions.
              <br />
              Our team is just a call or message away.
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 bg-white rounded px-4 py-2">
                <Phone className="text-[#2E318E]" size={20} />
                <span className="font-medium">Phone Support:</span>
                <span className="font-semibold text-black">+91 98765 43210</span>
                <span className="text-xs text-gray-500">
                  (Mon–Sat, 10 AM – 7 PM)
                </span>
              </div>
              <div className="flex items-center gap-3 bg-white rounded px-4 py-2">
                <Mail className="text-[#2E318E]" size={20} />
                <span className="font-medium">Email Support:</span>
                <span className="font-semibold text-black">
                  support@yourshop.com
                </span>
              </div>
              <div className="flex items-center gap-3 bg-white rounded px-4 py-2">
                <MessageCircle className="text-[#2E318E]" size={20} />
                <span className="font-medium">WhatsApp:</span>
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2E318E] underline font-semibold"
                >
                  Chat with us
                </a>
              </div>
            </div>
          </div>
          {/* Right: Form */}
          <div className="flex justify-end w-full md:w-1/2">
            {success ? (
              <div className="w-full max-w-md bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="text-green-600 text-lg font-semibold mb-2">Thank You!</div>
                <p className="text-green-700">Your support request has been submitted successfully. We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form className="flex flex-col gap-4 w-full max-w-md" onSubmit={handleSubmit}>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Full Name *"
                  className="border rounded px-4 py-2 bg-white focus:bg-white focus:outline-[#2E318E]"
                  required
                />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone No."
                  className="border rounded px-4 py-2 bg-white focus:bg-white focus:outline-[#2E318E]"
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email Address *"
                  className="border rounded px-4 py-2 bg-white focus:bg-white focus:outline-[#2E318E]"
                  required
                />
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Your Message *"
                  rows={4}
                  className="border rounded px-4 py-2 bg-white focus:bg-white focus:outline-[#2E318E] resize-none"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={`bg-[#2E318E] text-white px-6 py-2 rounded font-medium transition-colors ${
                    loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Submitting...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}