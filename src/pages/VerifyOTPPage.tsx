import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const VerifyOTPPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOTP, verifySellerOTP, resendOTP, resendSellerOTP } = useAuthStore();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  
  const email = location.state?.email;
  const userType = location.state?.userType || 'customer';

  useEffect(() => {
    if (!email) {
      navigate('/register');
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [email, navigate]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      if (i < 6) {
        newOtp[i] = pastedData[i];
      }
    }
    setOtp(newOtp);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const result = userType === 'seller' 
        ? await verifySellerOTP(email, otpCode)
        : await verifyOTP(email, otpCode);

      if (result.success) {
        toast.success('Email verified successfully!');
        // Redirect based on user type
        navigate(userType === 'seller' ? '/seller/dashboard' : '/');
      } else {
        toast.error(result.message || 'Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']); // Clear OTP
        document.getElementById('otp-0')?.focus();
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);

    try {
      const result = userType === 'seller'
        ? await resendSellerOTP(email)
        : await resendOTP(email);

      if (result.success) {
        toast.success('OTP resent successfully! Check your email.');
        setTimer(600); // Reset timer
        setOtp(['', '', '', '', '', '']); // Clear OTP
      } else {
        toast.error(result.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
              <Mail className="h-10 w-10 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Verify Your Email</h2>
          <p className="mt-3 text-gray-600">
            We've sent a 6-digit verification code to
          </p>
          <p className="mt-1 text-purple-600 font-semibold">{email}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Enter Verification Code
            </label>
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          <div className="text-center">
            {timer > 0 ? (
              <p className="text-sm text-gray-600">
                Code expires in{' '}
                <span className="font-semibold text-purple-600">
                  {formatTime(timer)}
                </span>
              </p>
            ) : (
              <p className="text-sm text-red-600 font-semibold">
                OTP has expired. Please request a new one.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || timer === 0 || otp.join('').length !== 6}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Verifying...
              </div>
            ) : (
              'Verify Email'
            )}
          </button>

          <div className="flex flex-col space-y-3">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resendLoading || timer === 0}
              className="flex items-center justify-center text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${resendLoading ? 'animate-spin' : ''}`} />
              {resendLoading ? 'Sending...' : 'Resend Code'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/register')}
              className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-700 font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Registration
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800 text-center">
            💡 Tip: Check your spam folder if you don't see the email
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTPPage;
