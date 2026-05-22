import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, Truck, Lock } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useCurrencyStore } from '../store/currencyStore';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const { formatPrice, currency } = useCurrencyStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Shipping Address
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    
    // Payment
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    
    // Billing same as shipping
    billingAddressSame: true,
  });

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.address || !formData.city || !formData.zipCode) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Create order data
      const orderData = {
        items: items.map(item => {
          // Validate that each item has a seller ID
          if (!item.sellerId) {
            console.error('❌ Cart item missing sellerId:', item);
            throw new Error(`Item "${item.name}" is missing seller information. Please remove it from cart and add it again.`);
          }
          return {
            productId: item.productId,
            seller: item.sellerId,
            title: item.name || item.title,  // Cart items use 'name' field
            image: item.image,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity
          };
        }),
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state || 'N/A',  // Provide default if empty
          zipCode: formData.zipCode,
          country: formData.country
        },
        billingAddress: formData.billingAddressSame ? {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state || 'N/A',  // Provide default if empty
          zipCode: formData.zipCode,
          country: formData.country
        } : null,
        paymentMethod: paymentMethod === 'cod' ? 'cod' : 'paypal',  // Use selected payment method
        subtotal: total,
        tax: total * 0.1,
        shipping: 0,
        total: total + (total * 0.1)
      };

      console.log('📦 Creating order:', orderData);

      // Create order via API
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      console.log('📥 Server response:', result);

      if (result.success) {
        console.log('✅ Order created:', result.data);
        // Clear cart after successful order
        clearCart();
        toast.success('Order placed successfully! 🎉');
        
        // Redirect to customer dashboard orders tab
        setTimeout(() => {
          navigate('/customer-dashboard?tab=orders');
        }, 1500);
      } else {
        console.error('❌ Order creation failed:', result);
        console.error('Error details:', result.error);
        toast.error(result.error || result.message || 'Failed to create order');
      }
    } catch (error: any) {
      console.error('Order creation error:', error);
      toast.error(error.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tax = total * 0.08;
  const finalTotal = total + tax;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Shipping Address */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-6">
                <MapPin className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">Shipping Address</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    required
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-6">
                <CreditCard className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">Payment Information</h2>
              </div>

              <div className="space-y-4">
                {/* Payment Method Selection */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">💰</div>
                      <div className="font-semibold text-gray-900">Cash on Delivery</div>
                      <div className="text-xs text-gray-600 mt-1">Pay when you receive</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('online')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === 'online'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">💳</div>
                      <div className="font-semibold text-gray-900">Online Payment</div>
                      <div className="text-xs text-gray-600 mt-1">PayPal / GPay</div>
                    </div>
                  </button>
                </div>

                {/* COD Info */}
                {paymentMethod === 'cod' && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-green-600 text-xl">✓</div>
                      <div>
                        <p className="text-green-800 font-medium">Cash on Delivery Selected</p>
                        <p className="text-green-600 text-sm">Pay when your order is delivered</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Online Payment (Coming Soon) */}
                {paymentMethod === 'online' && (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-yellow-600 text-xl">⚠️</div>
                      <div>
                        <p className="text-yellow-800 font-medium">Coming Soon</p>
                        <p className="text-yellow-600 text-sm">Online payment integration will be available soon. Please use COD for now.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Place Order Button */}
            <button
              type="submit"
              disabled={loading || paymentMethod === 'online'}
              className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center space-x-2 ${
                paymentMethod === 'cod'
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" />
                  <span>
                    {paymentMethod === 'cod'
                      ? `Place Order (COD) - $${finalTotal.toFixed(2)}`
                      : `Pay Now - $${finalTotal.toFixed(2)}`
                    }
                  </span>
                </>
              )}
            </button>
            
            {paymentMethod === 'online' && (
              <p className="text-center text-sm text-yellow-600 mt-2">
                ⚠️ Online payment will be enabled soon. Please use COD for now.
              </p>
            )}
          </form>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-6 h-fit">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
          
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-600">
                    {item.size} • {item.color} • Qty: {item.quantity}
                  </p>
                  <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-6 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className="font-semibold text-green-600">Free</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax (8%)</span>
              <span className="font-semibold">{formatPrice(tax)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <div className="text-right">
                <span className="text-lg font-semibold text-gray-900 block">{formatPrice(finalTotal)}</span>
                {currency === 'INR' && (
                  <span className="text-sm text-gray-500">${finalTotal.toFixed(2)} USD</span>
                )}
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
              <Lock className="h-4 w-4" />
              <span>SSL Encrypted Checkout</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Truck className="h-4 w-4" />
              <span>Free shipping & 30-day returns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;