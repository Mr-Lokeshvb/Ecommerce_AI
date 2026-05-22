/**
 * Email System Test Script
 * Tests all email templates and functionality
 */

require('dotenv').config({ path: '.env' });
const { sendEmail } = require('./utils/email');

console.log('🧪 Starting Email System Test...\n');
console.log('📧 Email Configuration:');
console.log('   EMAIL_USER:', process.env.EMAIL_USER);
console.log('   EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('   CLIENT_URL:', process.env.CLIENT_URL);
console.log('');

// Test email address (change this to your email for testing)
const TEST_EMAIL = process.env.EMAIL_USER; // Sending to self for testing

const tests = [
  {
    name: 'OTP Verification Email',
    template: 'otp-verification',
    subject: 'Verify Your Email - Fashion Era',
    data: {
      name: 'Test User',
      otp: '123456',
      expiresIn: 10
    }
  },
  {
    name: 'Welcome Email (Customer)',
    template: 'welcome',
    subject: 'Welcome to Fashion Era!',
    data: {
      name: 'Test Customer',
      role: 'CUSTOMER'
    }
  },
  {
    name: 'Welcome Email (Seller)',
    template: 'welcome',
    subject: 'Welcome to Fashion Era!',
    data: {
      name: 'Test Seller',
      role: 'SELLER'
    }
  },
  {
    name: 'Order Confirmation Email',
    template: 'order-confirmation',
    subject: 'Order Confirmation - ORD-12345',
    data: {
      name: 'Test Customer',
      orderNumber: 'ORD-12345',
      items: [
        {
          title: 'Sample T-Shirt',
          size: 'M',
          color: 'Blue',
          quantity: 2,
          total: 49.98
        },
        {
          title: 'Sample Jeans',
          size: 'L',
          color: 'Black',
          quantity: 1,
          total: 79.99
        }
      ],
      total: 129.97,
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      }
    }
  },
  {
    name: 'Order Shipped Email',
    template: 'order-shipped',
    subject: 'Your Order Has Shipped - ORD-12345',
    data: {
      name: 'Test Customer',
      orderNumber: 'ORD-12345',
      trackingNumber: 'TRACK123456789',
      carrier: 'FEDEX',
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()
    }
  },
  {
    name: 'Order Delivered Email',
    template: 'order-delivered',
    subject: 'Order Delivered - ORD-12345',
    data: {
      name: 'Test Customer',
      orderNumber: 'ORD-12345',
      deliveryDate: new Date().toLocaleDateString(),
      deliveryAddress: '123 Main St, New York'
    }
  },
  {
    name: 'Order Status Update Email',
    template: 'order-status-update',
    subject: 'Order Status Update - ORD-12345',
    data: {
      name: 'Test Customer',
      orderNumber: 'ORD-12345',
      status: 'packing',
      statusMessage: 'Your order is being carefully packed.'
    }
  },
  {
    name: 'New Order Email (Seller)',
    template: 'seller-new-order',
    subject: 'New Order Received - ORD-12345',
    data: {
      sellerName: 'Test Seller',
      orderNumber: 'ORD-12345',
      items: [
        {
          title: 'Sample T-Shirt',
          size: 'M',
          color: 'Blue',
          quantity: 2,
          total: 49.98
        }
      ],
      sellerEarnings: 42.48
    }
  },
  {
    name: 'Return Request Confirmation Email',
    template: 'return-request-confirmation',
    subject: 'Return Request Confirmed - ORD-12345',
    data: {
      customerName: 'Test Customer',
      orderNumber: 'ORD-12345',
      returnReason: 'Item does not fit as expected',
      orderTotal: 129.97
    }
  },
  {
    name: 'Return Approved Email',
    template: 'return-approved',
    subject: 'Return Approved - ORD-12345',
    data: {
      customerName: 'Test Customer',
      orderNumber: 'ORD-12345',
      refundAmount: 129.97,
      returnLabel: null
    }
  },
  {
    name: 'Return Rejected Email',
    template: 'return-rejected',
    subject: 'Return Request Update - ORD-12345',
    data: {
      customerName: 'Test Customer',
      orderNumber: 'ORD-12345',
      rejectionReason: 'Item shows signs of wear and tags have been removed.'
    }
  },
  {
    name: 'Seller Return Notification Email',
    template: 'seller-return-notification',
    subject: 'Return Request Received - ORD-12345',
    data: {
      sellerName: 'Test Seller',
      customerName: 'Test Customer',
      orderNumber: 'ORD-12345',
      returnReason: 'Item does not fit as expected',
      orderTotal: 129.97
    }
  },
  {
    name: 'Password Reset Email',
    template: 'password-reset',
    subject: 'Password Reset Request',
    data: {
      name: 'Test User',
      resetUrl: `${process.env.CLIENT_URL}/reset-password?token=sample-token-12345`
    }
  }
];

async function runTests() {
  console.log(`🚀 Running ${tests.length} email template tests...\n`);
  
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`[${i + 1}/${tests.length}] Testing: ${test.name}`);
    
    try {
      await sendEmail({
        to: TEST_EMAIL,
        subject: test.subject,
        template: test.template,
        data: test.data
      });
      console.log(`   ✅ SUCCESS - Email sent successfully`);
      passed++;
      
      // Wait 2 seconds between emails to avoid rate limiting
      if (i < tests.length - 1) {
        console.log('   ⏳ Waiting 2 seconds before next test...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.log(`   ❌ FAILED - ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results:');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}/${tests.length}`);
  console.log(`❌ Failed: ${failed}/${tests.length}`);
  console.log(`📈 Success Rate: ${((passed / tests.length) * 100).toFixed(2)}%`);
  console.log('='.repeat(60));
  console.log('\n💡 Tips:');
  console.log('   - Check your email inbox at:', TEST_EMAIL);
  console.log('   - Check spam folder if emails are missing');
  console.log('   - Gmail may take a few seconds to receive emails');
  console.log('\n✨ Email system test complete!\n');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
