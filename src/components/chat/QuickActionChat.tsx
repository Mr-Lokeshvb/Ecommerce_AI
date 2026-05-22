import React, { useState, useRef, useEffect } from 'react';
import { 
  Package, 
  RotateCcw, 
  HelpCircle, 
  MapPin, 
  CreditCard, 
  MessageSquare,
  Send,
  X,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

// Generate unique ID for messages
let messageCounter = 0;
const generateUniqueId = () => {
  messageCounter++;
  return `msg-${Date.now()}-${messageCounter}`;
};

interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  actions?: QuickAction[];
  data?: any;
}

interface QuickAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface Order {
  _id: string;
  orderNumber: string;
  items: Array<{
    product: {
      _id: string;
      name: string;
      images: string[];
    };
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: string;
  createdAt: string;
  canReturn?: boolean;
}

export const QuickActionChat: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user } = useAuthStore();
  const { orders, fetchOrders } = useOrderStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Welcome message with quick actions
    addMessage({
      id: generateUniqueId(),
      type: 'bot',
      content: `👋 Hi ${user?.name || 'there'}! I'm your AI assistant. How can I help you today?`,
      timestamp: new Date(),
      actions: getMainActions()
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const getMainActions = (): QuickAction[] => {
    return [
      {
        id: 'return',
        label: 'Return Product',
        icon: <RotateCcw className="h-4 w-4" />,
        action: () => handleReturnFlow()
      },
      {
        id: 'track',
        label: 'Track Order',
        icon: <MapPin className="h-4 w-4" />,
        action: () => handleTrackOrderFlow()
      },
      {
        id: 'query',
        label: 'Raise Query',
        icon: <HelpCircle className="h-4 w-4" />,
        action: () => handleRaiseQueryFlow()
      },
      {
        id: 'payment',
        label: 'Payment Issue',
        icon: <CreditCard className="h-4 w-4" />,
        action: () => handlePaymentFlow()
      }
    ];
  };

  const handleReturnFlow = async () => {
    setCurrentFlow('return');
    addMessage({
      id: generateUniqueId(),
      type: 'user',
      content: 'I want to return a product',
      timestamp: new Date()
    });

    setIsLoading(true);
    try {
      // Fetch recent delivered orders
      const response = await api.getOrders();
      const deliveredOrders = response.data.orders?.filter((order: Order) => 
        order.status === 'delivered' && 
        isWithinReturnWindow(order.createdAt)
      ) || [];

      if (deliveredOrders.length === 0) {
        addMessage({
          id: generateUniqueId(),
          type: 'bot',
          content: '😔 You don\'t have any delivered orders eligible for return at the moment.\n\n**Return Policy:**\n• Items must be returned within 30 days of delivery\n• Products must be in original condition\n• Refund processed within 5-7 business days',
          timestamp: new Date(),
          actions: getMainActions()
        });
      } else {
        addMessage({
          id: generateUniqueId(),
          type: 'bot',
          content: `📦 Here are your recent orders eligible for return. Please select the order you'd like to return:`,
          timestamp: new Date(),
          actions: deliveredOrders.map((order: Order) => ({
            id: order._id,
            label: `Order #${order.orderNumber.slice(-6)} - $${order.totalAmount?.toFixed(2) || '0.00'} - ${order.items?.length || 0} item(s)`,
            action: () => handleOrderSelection(order)
          }))
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      addMessage({
        id: generateUniqueId(),
        type: 'bot',
        content: '❌ Sorry, I couldn\'t fetch your orders. Please try again later.',
        timestamp: new Date(),
        actions: getMainActions()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isWithinReturnWindow = (orderDate: string): boolean => {
    const deliveryDate = new Date(orderDate);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  const handleOrderSelection = (order: Order) => {
    console.log('📦 Order selected:', order);
    setSelectedOrder(order);
    
    addMessage({
      id: generateUniqueId(),
      type: 'system',
      content: `Selected: Order #${order.orderNumber.slice(-6)}`,
      timestamp: new Date()
    });

    // Show products in the order - handle different data structures
    const productActions: QuickAction[] = order.items.map((item, index) => {
      const productName = item.product?.name || item.product?.title || item.title || 'Product';
      const quantity = item.quantity || 1;
      const price = item.price || item.total || 0;
      
      return {
        id: `product-${index}`,
        label: `${productName} (${quantity}x - $${price.toFixed(2)})`,
        action: () => handleProductSelection(order, item)
      };
    });

    addMessage({
      id: generateUniqueId(),
      type: 'bot',
      content: `📦 **Order #${order.orderNumber}**\n\nSelect the product you want to return:`,
      timestamp: new Date(),
      actions: [
        ...productActions,
        {
          id: 'back',
          label: '← Back to orders',
          action: () => handleReturnFlow(),
          variant: 'secondary'
        }
      ]
    });
  };

  const handleProductSelection = (order: Order, item: any) => {
    const productName = item.product?.name || item.product?.title || item.title || 'Product';
    
    console.log('📦 Product selected:', productName);
    
    addMessage({
      id: generateUniqueId(),
      type: 'system',
      content: `Selected: ${productName}`,
      timestamp: new Date()
    });

    addMessage({
      id: generateUniqueId(),
      type: 'bot',
      content: `📝 Please tell me why you'd like to return **${productName}**?\n\nCommon reasons:\n• Wrong size/fit\n• Damaged or defective\n• Not as described\n• Changed my mind\n• Other\n\nType your reason below:`,
      timestamp: new Date()
    });

    // Set flag to accept return reason input
    setCurrentFlow('awaiting-return-reason');
  };

  const handleReturnReasonSubmit = async () => {
    if (!returnReason.trim() || !selectedOrder) {
      console.error('❌ Missing return reason or selected order');
      return;
    }

    console.log('📤 Submitting return request...', {
      orderId: selectedOrder._id,
      reason: returnReason
    });

    addMessage({
      id: generateUniqueId(),
      type: 'user',
      content: returnReason,
      timestamp: new Date()
    });

    setIsLoading(true);
    try {
      // Submit return request
      const response = await api.put(`/api/orders/${selectedOrder._id}/return`, {
        reason: returnReason
      });

      console.log('✅ Return request response:', response);

      addMessage({
        id: generateUniqueId(),
        type: 'bot',
        content: `✅ **Return Request Submitted Successfully!**\n\n📋 **Return Details:**\n• Order: #${selectedOrder.orderNumber}\n• Reason: ${returnReason}\n\n📦 **Next Steps:**\n1. Seller will review your request within 24 hours\n2. You'll receive a return shipping label via email\n3. Pack the item securely\n4. Ship using the provided label\n5. Refund processed within 5-7 days after we receive the item\n\n💰 **Refund Amount:** $${selectedOrder.totalAmount?.toFixed(2) || '0.00'}\n\n📧 Check your email for updates!`,
        timestamp: new Date(),
        actions: [
          {
            id: 'track-return',
            label: 'Track Return Status',
            icon: <Package className="h-4 w-4" />,
            action: () => handleTrackOrderFlow()
          },
          {
            id: 'new-action',
            label: 'New Request',
            icon: <MessageSquare className="h-4 w-4" />,
            action: () => resetChat()
          }
        ]
      });

      toast.success('Return request submitted successfully!');
      setReturnReason('');
      setCurrentFlow(null);
      setSelectedOrder(null);
    } catch (error: any) {
      console.error('❌ Error submitting return:', error);
      addMessage({
        id: generateUniqueId(),
        type: 'bot',
        content: `❌ Sorry, there was an error submitting your return request: ${error.response?.data?.message || error.message || 'Please try again later.'}`,
        timestamp: new Date(),
        actions: getMainActions()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackOrderFlow = async () => {
    setCurrentFlow('track');
    addMessage({
      id: generateUniqueId(),
      type: 'user',
      content: 'I want to track my order',
      timestamp: new Date()
    });

    setIsLoading(true);
    try {
      const response = await api.getOrders();
      const activeOrders = response.data.orders?.filter((order: Order) => 
        ['pending', 'confirmed', 'packing', 'shipping'].includes(order.status)
      ) || [];

      if (activeOrders.length === 0) {
        addMessage({
          id: generateUniqueId(),
          type: 'bot',
          content: '📦 You don\'t have any active orders to track at the moment.',
          timestamp: new Date(),
          actions: getMainActions()
        });
      } else {
        const orderInfo = activeOrders.map((order: Order) => 
          `📦 **Order #${order.orderNumber}**\n• Status: ${order.status.toUpperCase()}\n• Total: $${order.totalAmount}\n• Date: ${new Date(order.createdAt).toLocaleDateString()}`
        ).join('\n\n');

        addMessage({
          id: generateUniqueId(),
          type: 'bot',
          content: `🚚 **Your Active Orders:**\n\n${orderInfo}\n\n💡 You can view detailed tracking in your dashboard.`,
          timestamp: new Date(),
          actions: getMainActions()
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      addMessage({
        id: generateUniqueId(),
        type: 'bot',
        content: '❌ Sorry, I couldn\'t fetch your orders. Please try again.',
        timestamp: new Date(),
        actions: getMainActions()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRaiseQueryFlow = () => {
    setCurrentFlow('query');
    addMessage({
      id: generateUniqueId(),
      type: 'user',
      content: 'I want to raise a query',
      timestamp: new Date()
    });

    addMessage({
      id: generateUniqueId(),
      type: 'bot',
      content: '❓ **I\'m here to help!** Please select a topic or type your question:',
      timestamp: new Date(),
      actions: [
        {
          id: 'product-query',
          label: 'Product Question',
          action: () => handleQueryType('product')
        },
        {
          id: 'shipping-query',
          label: 'Shipping & Delivery',
          action: () => handleQueryType('shipping')
        },
        {
          id: 'payment-query',
          label: 'Payment Issue',
          action: () => handleQueryType('payment')
        },
        {
          id: 'account-query',
          label: 'Account & Profile',
          action: () => handleQueryType('account')
        },
        {
          id: 'other-query',
          label: 'Other',
          action: () => handleQueryType('other')
        }
      ]
    });
  };

  const handleQueryType = (type: string) => {
    const queryResponses: Record<string, string> = {
      product: '🛍️ **Product Questions:**\n\nI can help with:\n• Product availability\n• Size and fit information\n• Material and care instructions\n• Product recommendations\n\nPlease type your specific question below!',
      shipping: '📦 **Shipping & Delivery:**\n\n• Standard shipping: 5-7 business days\n• Express shipping: 2-3 business days\n• Free shipping on orders over $50\n• International shipping available\n\nWhat would you like to know?',
      payment: '💳 **Payment Help:**\n\nWe accept:\n• Credit/Debit cards (Visa, Mastercard, Amex)\n• PayPal\n• Apple Pay\n• Google Pay\n\nWhat payment issue are you experiencing?',
      account: '👤 **Account & Profile:**\n\nI can help with:\n• Update profile information\n• Change password\n• Email preferences\n• Account security\n\nWhat do you need help with?',
      other: '💬 **General Support:**\n\nPlease describe your question or issue, and I\'ll do my best to help!'
    };

    addMessage({
      id: generateUniqueId(),
      type: 'system',
      content: `Query Type: ${type}`,
      timestamp: new Date()
    });

    addMessage({
      id: generateUniqueId(),
      type: 'bot',
      content: queryResponses[type] || queryResponses.other,
      timestamp: new Date(),
      actions: getMainActions()
    });

    setCurrentFlow('awaiting-query-message');
  };

  const handlePaymentFlow = () => {
    setCurrentFlow('payment');
    addMessage({
      id: generateUniqueId(),
      type: 'user',
      content: 'I have a payment issue',
      timestamp: new Date()
    });

    addMessage({
      id: generateUniqueId(),
      type: 'bot',
      content: '💳 **Payment Support:**\n\nI can help with:\n• Payment method issues\n• Refund status\n• Failed transactions\n• Payment confirmation\n\nPlease describe your payment issue below.',
      timestamp: new Date(),
      actions: getMainActions()
    });

    setCurrentFlow('awaiting-payment-message');
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    console.log('💬 User message:', userMessage, 'Current flow:', currentFlow);

    // Handle special flows
    if (currentFlow === 'awaiting-return-reason') {
      setReturnReason(userMessage);
      // Call submit after state is set
      setTimeout(() => {
        handleReturnReasonSubmit();
      }, 100);
      return;
    }

    addMessage({
      id: generateUniqueId(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    });

    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      let response = generateAIResponse(userMessage);
      addMessage({
        id: generateUniqueId(),
        type: 'bot',
        content: response,
        timestamp: new Date(),
        actions: getMainActions()
      });
      setIsLoading(false);
      setCurrentFlow(null);
    }, 1000);
  };

  const generateAIResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return '😊 You\'re welcome! Is there anything else I can help you with?';
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return '👋 Hello! How can I assist you today?';
    }

    // Default helpful response
    return '✅ Thank you for your message! Our support team will review your query and get back to you within 24 hours.\n\nIn the meantime, you can:\n• Check our FAQ section\n• Track your orders\n• Browse our help center\n\nIs there anything else I can help you with?';
  };

  const resetChat = () => {
    setMessages([{
      id: generateUniqueId(),
      type: 'bot',
      content: `👋 How else can I help you today?`,
      timestamp: new Date(),
      actions: getMainActions()
    }]);
    setCurrentFlow(null);
    setSelectedOrder(null);
    setReturnReason('');
  };

  const getActionButtonClass = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-500 text-white hover:bg-blue-600';
      case 'danger':
        return 'bg-red-500 text-white hover:bg-red-600';
      case 'secondary':
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MessageSquare className="h-6 w-6" />
          <div>
            <h3 className="font-semibold">AI Quick Support</h3>
            <p className="text-xs text-blue-100">We're here to help!</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            {/* Message bubble */}
            <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.type === 'system'
                    ? 'bg-gray-100 text-gray-600 text-sm italic'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="whitespace-pre-line">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Quick actions */}
            {message.actions && message.actions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {message.actions.map((action) => (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${getActionButtonClass(action.variant)}`}
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
