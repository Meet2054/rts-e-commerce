// src/app/page.tsx (Updated home page)
import Navigation from '@/components/coustom-ui/navigation';
import Link from 'next/link';
import { Package, Users, Headphones, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              B2B E-commerce Platform
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
              Professional wholesale platform with custom pricing, dedicated support, 
              and streamlined ordering for your business needs.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/products"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
              >
                Browse Products
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/sign-up"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
              >
                Get Started
                <Package className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built specifically for B2B relationships and bulk ordering with advanced features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">Custom Pricing</h3>
              <p className="text-gray-600 leading-relaxed">
                Personalized pricing based on your business relationship and order volume. 
                Upload Excel files to instantly update prices for specific customers.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">Dedicated Support</h3>
              <p className="text-gray-600 leading-relaxed">
                Personal account managers and responsive customer support. 
                Direct communication for order coordination and business growth.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Headphones className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">Smart Chat Assistant</h3>
              <p className="text-gray-600 leading-relaxed">
                AI-powered chat support with automatic escalation to human agents 
                when needed. Get instant help with orders and pricing.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">Streamlined Orders</h3>
              <p className="text-gray-600 leading-relaxed">
                Quick B2B ordering process with flexible payment terms and delivery options. 
                No immediate payment required - well contact you to finalize.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to get started with our B2B platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Sign Up</h3>
              <p className="text-gray-600 leading-relaxed">
                Create your business account with company details. 
                Our team will review and set up custom pricing based on your needs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Browse & Order</h3>
              <p className="text-gray-600 leading-relaxed">
                Browse our product catalog with your personalized pricing. 
                Add items to cart and place orders with your business details.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold mb-4">We Contact You</h3>
              <p className="text-gray-600 leading-relaxed">
                Our team contacts you within 24 hours to confirm order details, 
                arrange payment terms, and schedule delivery.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Built for Business Success
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Our platform is designed specifically for B2B relationships, 
                offering the flexibility and features your business needs to grow.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Volume-based pricing tiers</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Flexible payment terms</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Bulk ordering capabilities</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Dedicated account management</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Real-time inventory updates</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Custom reporting and analytics</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-4">Ready to Get Started?</h3>
                <p className="text-gray-600 mb-6">
                  Join thousands of businesses already using our platform to streamline 
                  their procurement and get better pricing.
                </p>
                <div className="space-y-3">
                  <Link
                    href="/sign-up"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    Create Account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/products"
                    className="w-full border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    Browse Products
                    <Package className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Questions? Were Here to Help!
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Our support team is available to help you get started and answer any questions 
            about pricing, orders, or platform features.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2">
              <Headphones className="h-5 w-5" />
              Live Chat Support
            </button>
            <Link
              href="mailto:support@example.com"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
            >
              Email Us
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          
          {/* Chat CTA */}
          <div className="mt-12 p-6 bg-blue-700 bg-opacity-50 rounded-xl inline-block">
            <p className="text-blue-100">
              💬 <strong>Pro Tip:</strong> Click the chat icon in the bottom-right corner for instant help!
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B2B</span>
                </div>
                <span className="font-bold text-xl">Store</span>
              </div>
              <p className="text-gray-400">
                Professional B2B e-commerce platform for businesses of all sizes.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/products" className="hover:text-white">Products</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 B2B Store. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
