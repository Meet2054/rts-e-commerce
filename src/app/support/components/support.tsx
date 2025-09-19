import { Mail, Phone, MessageCircle } from "lucide-react";
import Image from "next/image";

export default function Support() {
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
            <form className="flex flex-col gap-4 w-full max-w-md">
                <input
                type="text"
                placeholder="Full Name"
                className="border rounded px-4 py-2 bg-white focus:bg-white focus:outline-[#2E318E]"
                required
                />
                <input
                type="text"
                placeholder="Phone No."
                className="border rounded px-4 py-2 bg-white focus:bg-white focus:outline-[#2E318E]"
                />
                <input
                type="email"
                placeholder="Email Address *"
                className="border rounded px-4 py-2 bg-white focus:bg-white focus:outline-[#2E318E]"
                required
                />
                <input
                type="text"
                placeholder="Order ID (if any)"
                className="border rounded px-4 py-2 bg-white focus:bg-white focus:outline-[#2E318E]"
                />
                <textarea
                placeholder="Message"
                rows={4}
                className="border rounded px-4 py-2 bg-white focus:bg-white focus:outline-[#2E318E]"
                required
                />
                <button
                type="submit"
                className="mt-2 bg-[#2E318E] text-white px-4 py-2 rounded font-semibold text-base"
                >
                Submit Request
                </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}