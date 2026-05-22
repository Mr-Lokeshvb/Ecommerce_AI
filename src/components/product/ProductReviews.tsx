import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import axios from 'axios';

interface Review {
  _id: string;
  userId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  rating: number;
  title: string;
  comment: string;
  helpful: number;
  verifiedPurchase: boolean;
  createdAt: string;
}

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [eligibleOrders, setEligibleOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  // Fetch reviews
  useEffect(() => {
    fetchReviews();
    if (isAuthenticated) {
      checkReviewEligibility();
    }
  }, [productId, isAuthenticated]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/reviews/product/${productId}`);
      if (response.data.success) {
        setReviews(response.data.data.reviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkReviewEligibility = async () => {
    try {
      setCheckingEligibility(true);
      const token = localStorage.getItem('token');
      
      // Fetch user's delivered orders
      const response = await axios.get('http://localhost:5000/api/orders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        // Get orders array from response
        const ordersArray = Array.isArray(response.data.data.orders) 
          ? response.data.data.orders 
          : (Array.isArray(response.data.data) ? response.data.data : []);
        
        // Filter orders that contain this product and are delivered
        const eligible = ordersArray.filter((order: any) => 
          order.status === 'delivered' && 
          order.items.some((item: any) => item.productId === productId || item.productId._id === productId)
        );
        
        console.log('✅ Eligible orders for review:', eligible.length);
        setEligibleOrders(eligible);
        if (eligible.length > 0) {
          setSelectedOrderId(eligible[0]._id);
        }
      }
    } catch (error) {
      console.error('Error checking review eligibility:', error);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to submit a review');
      return;
    }

    if (!title.trim() || !comment.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!selectedOrderId) {
      toast.error('Please select an order');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/reviews',
        {
          productId,
          orderId: selectedOrderId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success('Review submitted successfully!');
        setShowReviewForm(false);
        setTitle('');
        setComment('');
        setRating(5);
        fetchReviews();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to submit review';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    if (!isAuthenticated) {
      toast.error('Please login to vote');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/reviews/${reviewId}/helpful`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success('Vote recorded!');
        fetchReviews();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to record vote';
      toast.error(message);
    }
  };

  const renderStars = (rating: number, interactive: boolean = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRate && onRate(star)}
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : ''} transition-transform`}
          >
            <Star
              className={`h-5 w-5 ${
                star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reviews Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Customer Reviews ({reviews.length})
        </h2>
        {isAuthenticated && eligibleOrders.length > 0 && (
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            {showReviewForm ? 'Cancel' : 'Write a Review'}
          </button>
        )}
        {isAuthenticated && eligibleOrders.length === 0 && !checkingEligibility && (
          <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
            <p>📦 Purchase this product to leave a review</p>
          </div>
        )}
        {!isAuthenticated && (
          <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
            <p>Please login to write a review</p>
          </div>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Write Your Review</h3>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Order Selection - if multiple eligible orders */}
            {eligibleOrders.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Your Order
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  {eligibleOrders.map((order) => (
                    <option key={order._id} value={order._id}>
                      Order #{order._id.slice(-8)} - {new Date(order.createdAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Show verified purchase badge */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center space-x-2">
              <span className="text-green-600 font-semibold">✓</span>
              <span className="text-green-700 text-sm">Verified Purchase Review</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              {renderStars(rating, true, setRating)}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sum up your experience"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                maxLength={100}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about this product"
                rows={5}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                maxLength={1000}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {comment.length}/1000 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-lg">No reviews yet</p>
            <p className="text-gray-500 mt-2">Be the first to review this product!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review._id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    {review.userId?.avatar ? (
                      <img
                        src={review.userId.avatar}
                        alt={review.userId.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <User className="h-6 w-6 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {review.userId?.name || 'Anonymous'}
                    </p>
                    {review.verifiedPurchase && (
                      <p className="text-xs text-green-600">✓ Verified Purchase</p>
                    )}
                  </div>
                </div>
                {renderStars(review.rating)}
              </div>

              <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
              <p className="text-gray-700 mb-3">{review.comment}</p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <button
                  onClick={() => handleHelpful(review._id)}
                  className="flex items-center space-x-1 hover:text-purple-600 transition-colors"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>Helpful ({review.helpful})</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
