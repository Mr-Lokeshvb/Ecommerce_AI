import json
import random

# Comprehensive conversational responses
responses = {}

# ==========================================
# 1. GREETINGS & BASIC CONVERSATION (500+)
# ==========================================
greetings = {
    "hi": "👋 Hi! Welcome to Fashion Era! How can I help you today?",
    "hello": "👋 Hello! Welcome to Fashion Era! I'm here to assist you with shopping, orders, and more!",
    "hey": "👋 Hey there! Looking for something specific today?",
    "good morning": "🌅 Good morning! Ready to find something amazing?",
    "good afternoon": "☀️ Good afternoon! What can I help you with?",
    "good evening": "🌆 Good evening! How can I assist you?",
    "how are you": "I'm doing great, thanks for asking! I'm here to help you shop. What are you looking for?",
    "what's up": "Not much! Just here to help you find what you need. What can I do for you?",
    "sup": "Hey! What can I help you with today?",
    "yo": "Yo! What's good? Looking for something?",
    "greetings": "Greetings! Welcome to Fashion Era. How may I assist you?",
    "howdy": "Howdy! What brings you here today?",
    "hola": "¡Hola! How can I help you today?",
    "bonjour": "Bonjour! Welcome! What can I help you find?",
    "namaste": "🙏 Namaste! How can I assist you today?",
}

# What/Who/Why/How questions
conversation = {
    "what are you doing": "I'm here helping customers like you! What can I do for you today?",
    "what do you do": "I help customers find products, track orders, and answer questions about our store!",
    "who are you": "I'm your AI shopping assistant for Fashion Era! I can help you with products, orders, and more.",
    "what is this": "This is Fashion Era's AI chatbot! I'm here to help you shop and answer your questions.",
    "what can you do": "I can help you find products, track orders, answer questions about shipping, payments, returns, and much more!",
    "how can you help": "I can assist with product searches, order tracking, shipping info, payment questions, and general support!",
    "why should i shop here": "We offer quality products, fast shipping, great customer service, and competitive prices!",
    "what is your name": "I'm the Fashion Era AI Assistant! You can call me your shopping buddy! 😊",
    "are you a bot": "Yes, I'm an AI assistant designed to help you shop and answer your questions quickly!",
    "are you human": "I'm an AI assistant, but I'm here to help you just like a human would!",
    "can you help me": "Absolutely! That's what I'm here for. What do you need help with?",
    "i need help": "I'm here to help! What can I assist you with today?",
    "help me": "Of course! What do you need help with?",
    "what's your purpose": "My purpose is to make your shopping experience smooth and help you find exactly what you need!",
    "do you understand me": "Yes, I understand! I'm here to help. What would you like to know?",
    "can you understand": "Yes, I can understand your questions! How can I help you?",
    "are you real": "I'm a real AI assistant! I'm here to help you with real answers!",
    "what time is it": "I don't have access to the current time, but I can help you with shopping! What do you need?",
    "what day is it": "I'm not sure of the current date, but I'm always here to help you shop! What can I do for you?",
    "where are you": "I'm in the cloud, ready to help you 24/7! What can I assist with?",
    "where is your store": "We're an online store serving customers worldwide! What would you like to shop for?",
    "do you have a physical store": "We're online-only, which means better prices and worldwide shipping! What can I help you find?",
}

# Politeness & Thanks
politeness = {
    "thank you": "You're welcome! Is there anything else I can help you with?",
    "thanks": "No problem! Happy to help! Anything else you need?",
    "thanks a lot": "You're very welcome! Let me know if you need anything else!",
    "thank you so much": "My pleasure! I'm here if you need anything else!",
    "appreciate it": "Glad I could help! Feel free to ask if you need more assistance!",
    "that's helpful": "Great! I'm glad I could help. Anything else?",
    "perfect": "Awesome! Let me know if you need anything else!",
    "great": "Fantastic! Is there anything else I can help with?",
    "awesome": "Glad you think so! Need help with anything else?",
    "cool": "Great! What else can I do for you?",
    "ok": "Alright! Let me know if you need anything!",
    "okay": "Perfect! I'm here if you need more help!",
    "bye": "Goodbye! Come back anytime you need help! 👋",
    "goodbye": "Goodbye! Happy shopping! 🛍️",
    "see you": "See you later! Come back soon!",
    "later": "Catch you later! Happy shopping!",
    "have a good day": "You too! Thanks for visiting! 😊",
}

# ==========================================
# 2. PRODUCT QUERIES (5000+)
# ==========================================
product_categories = {
    "clothing": ["shirt", "t-shirt", "pants", "jeans", "dress", "skirt", "shorts", "jacket", "coat", "sweater", "hoodie", "blazer", "suit", "top", "blouse", "cardigan", "vest", "polo"],
    "footwear": ["shoes", "sneakers", "boots", "sandals", "heels", "flats", "loafers", "slippers", "running shoes", "dress shoes", "casual shoes"],
    "accessories": ["bag", "purse", "wallet", "belt", "hat", "cap", "scarf", "gloves", "sunglasses", "watch", "jewelry", "necklace", "bracelet", "earrings", "ring"],
    "electronics": ["phone", "laptop", "tablet", "headphones", "earbuds", "speaker", "charger", "camera", "smartwatch", "keyboard", "mouse"],
}

colors = ["red", "blue", "green", "yellow", "orange", "purple", "pink", "brown", "black", "white", "gray", "grey", "navy", "beige", "maroon", "teal", "olive", "gold", "silver", "bronze"]

# Generate product responses
for category, items in product_categories.items():
    for item in items:
        # Singular and Plural forms
        forms = [item]
        if not item.endswith('s'):
            forms.append(item + 's')
        elif item.endswith('sh') or item.endswith('ch'):
            forms.append(item + 'es')
            
        for form in forms:
            responses[form] = f"🛍️ Looking for {item}s? We have a great selection! What style or color are you interested in?"
            responses[f"show me {form}"] = f"Here are our {item}s! We have various styles and colors. Any specific preference?"
            responses[f"do you have {form}"] = f"Yes! We have {item}s in stock. What color or style would you like?"
            responses[f"i want {form}"] = f"Great choice! We have {item}s available. What's your preferred color or size?"
            responses[f"looking for {form}"] = f"Perfect! We have {item}s. Let me help you find the right one!"
            responses[f"need {form}"] = f"We've got {item}s! What specifications are you looking for?"
            
            # Color combinations
            for color in colors:
                key = f"{color} {form}"
                responses[key] = f"🎨 {color.capitalize()} {item}? Great choice! We have those in stock. What size do you need?"
                responses[f"do you have {color} {form}"] = f"Yes! We have {color} {item}s available. Would you like to see them?"
                responses[f"show me {color} {form}"] = f"Here are our {color} {item}s! They're very popular. Interested?"

# Size queries
sizes = ["small", "medium", "large", "xl", "xxl", "xs"]
for size in sizes:
    responses[f"{size} size"] = f"We have {size.upper()} sizes available! What item are you looking for?"
    responses[f"do you have {size}"] = f"Yes, we carry {size.upper()} sizes! What product are you interested in?"

# ==========================================
# 3. SHOPPING & ORDERING (1000+)
# ==========================================
shopping_queries = {
    "how do i order": "To order: 1) Browse products 2) Add to cart 3) Go to checkout 4) Enter shipping info 5) Complete payment!",
    "how to buy": "Simply add items to your cart and proceed to checkout! Need help with a specific product?",
    "how to purchase": "Add items to cart, then click checkout to complete your purchase!",
    "can i order": "Yes! You can order anytime. Just add items to cart and checkout!",
    "how to add to cart": "Click the 'Add to Cart' button on any product page!",
    "where is my cart": "Your cart icon is at the top right of the page. Click it to view items!",
    "view cart": "Click the cart icon at the top right to see your items!",
    "checkout": "Ready to checkout? Go to your cart and click 'Proceed to Checkout'!",
    "how to checkout": "Go to cart → Review items → Click 'Checkout' → Enter details → Complete payment!",
    "place order": "To place an order, add items to cart and proceed to checkout!",
    "buy now": "Click 'Buy Now' on the product page for quick checkout!",
    "quick buy": "Use the 'Buy Now' button for instant checkout!",
    "add to wishlist": "Click the heart icon on any product to add to your wishlist!",
    "save for later": "Use the 'Add to Wishlist' feature to save items for later!",
    "compare products": "You can compare products by viewing them side-by-side in separate tabs!",
    "product details": "Click on any product to see full details, specifications, and reviews!",
    "product specifications": "Full specs are available on each product page. Which product interests you?",
    "is this in stock": "Most displayed products are in stock! Which item are you asking about?",
    "stock availability": "We update stock in real-time. What product are you checking?",
    "out of stock": "If an item is out of stock, you can sign up for restock notifications!",
    "when will it be back": "We restock popular items regularly! Want me to notify you?",
    "pre order": "Some items are available for pre-order! Check the product page for details.",
}

# ==========================================
# 4. SHIPPING & DELIVERY (800+)
# ==========================================
shipping_queries = {
    "shipping": "🚚 We offer Standard (3-5 days), Express (1-2 days), and Free shipping on orders over $50!",
    "delivery": "📦 Delivery times: Standard 3-5 days, Express 1-2 days. Track your order anytime!",
    "how long shipping": "Standard shipping takes 3-5 business days, Express takes 1-2 days!",
    "when will it arrive": "Delivery depends on shipping method: Standard (3-5 days) or Express (1-2 days)!",
    "shipping cost": "Standard shipping is $5.99, Express is $12.99, FREE on orders over $50!",
    "free shipping": "Yes! Free shipping on all orders over $50! 🎉",
    "do you ship internationally": "Yes! We ship worldwide. International shipping takes 7-14 business days.",
    "international shipping": "We ship globally! International delivery: 7-14 business days.",
    "shipping countries": "We ship to most countries worldwide! Where are you located?",
    "track order": "Track your order in 'My Orders' section using your order number!",
    "tracking number": "You'll receive a tracking number via email once your order ships!",
    "where is my order": "Check 'My Orders' for real-time tracking! Need your order number?",
    "order status": "View order status in 'My Orders' section or check your email for updates!",
    "order tracking": "Track your order anytime in the 'My Orders' section!",
    "delivery time": "Standard: 3-5 days, Express: 1-2 days, International: 7-14 days!",
    "fast shipping": "Choose Express shipping for 1-2 day delivery!",
    "express delivery": "Express delivery available! Get your order in 1-2 business days!",
    "same day delivery": "Same-day delivery is available in select cities! Check at checkout.",
    "next day delivery": "Next-day delivery available with Express shipping!",
    "shipping options": "We offer Standard, Express, and International shipping!",
    "change shipping address": "Contact us immediately if you need to change your shipping address!",
    "wrong address": "Contact support ASAP to update your shipping address!",
    "delivery address": "You can update your delivery address in account settings before ordering!",
}

# ==========================================
# 5. PAYMENT & PRICING (600+)
# ==========================================
payment_queries = {
    "payment": "💳 We accept all major credit cards, PayPal, Apple Pay, and Google Pay!",
    "payment methods": "We accept Visa, Mastercard, Amex, PayPal, Apple Pay, and Google Pay!",
    "how to pay": "Choose your payment method at checkout: Card, PayPal, or digital wallets!",
    "credit card": "Yes! We accept all major credit cards (Visa, Mastercard, Amex, Discover)!",
    "debit card": "Yes, we accept debit cards!",
    "paypal": "Yes! PayPal is accepted at checkout!",
    "apple pay": "Yes! Apple Pay is available at checkout!",
    "google pay": "Yes! Google Pay is accepted!",
    "cash on delivery": "COD is available in select regions! Check at checkout.",
    "cod": "Cash on Delivery available in select areas!",
    "payment failed": "If payment fails, try a different card or payment method. Contact support if issues persist!",
    "payment declined": "Check your card details or try another payment method. Contact your bank if needed!",
    "secure payment": "Yes! All payments are encrypted and secure with SSL protection!",
    "is it safe": "Absolutely! We use industry-standard encryption for all transactions!",
    "price": "Prices vary by product! Which item are you interested in?",
    "how much": "Prices are listed on each product page! What are you looking for?",
    "cost": "Check the product page for current pricing! Looking for something specific?",
    "discount": "🎉 Check our Deals section for current discounts and promotions!",
    "sale": "We have ongoing sales! Check the 'Sale' section for great deals!",
    "promo code": "Enter promo codes at checkout for discounts!",
    "coupon": "Have a coupon code? Enter it at checkout!",
    "deals": "Check our 'Deals' section for the best offers!",
    "offers": "Current offers are in the 'Promotions' section!",
    "cheap": "Looking for budget-friendly options? Check our 'Under $50' section!",
    "affordable": "We have great affordable options! What's your budget?",
    "expensive": "We have premium products too! What are you looking for?",
    "price range": "What's your budget? I can help you find products in your price range!",
}

# ==========================================
# 6. RETURNS & REFUNDS (500+)
# ==========================================
returns_queries = {
    "return": "🔄 30-day return policy! Go to 'My Orders' → Select item → Request Return.",
    "refund": "💰 Refunds processed within 5-7 business days after we receive your return!",
    "return policy": "30-day returns on most items! Items must be unused with tags attached.",
    "how to return": "Go to 'My Orders' → Select order → Click 'Return Item' → Follow instructions!",
    "return item": "To return: Go to My Orders → Select item → Request return → Ship it back!",
    "refund policy": "Refunds issued within 5-7 days after we receive and inspect the return!",
    "money back": "Yes! Full refund if you return within 30 days in original condition!",
    "exchange": "Exchanges available! Return the item and place a new order for the exchange.",
    "wrong item": "Received wrong item? Contact support immediately for free return and replacement!",
    "damaged item": "Damaged item? Contact us for free return and full refund or replacement!",
    "defective": "Defective products get free returns and full refunds! Contact support!",
    "broken": "Broken item? We'll provide a free return label and full refund!",
    "not as described": "Item not as described? Return it for a full refund within 30 days!",
    "return shipping": "Return shipping is FREE for defective/wrong items! Otherwise, customer pays return shipping.",
    "return label": "We'll email you a return label after you request a return!",
    "return address": "Return address will be provided with your return label!",
    "how long for refund": "Refunds take 5-7 business days after we receive your return!",
    "refund status": "Check refund status in 'My Orders' or contact support!",
    "cancel order": "Cancel before shipping in 'My Orders'! After shipping, you'll need to return it.",
    "can i cancel": "Yes! Cancel anytime before shipping in your order details!",
}

# ==========================================
# 7. ACCOUNT & PROFILE (400+)
# ==========================================
account_queries = {
    "account": "👤 Manage your account in 'Profile Settings' - update info, addresses, and preferences!",
    "profile": "Access your profile by clicking your name at the top right!",
    "sign up": "Click 'Sign Up' to create an account and start shopping!",
    "register": "Register for an account to track orders and save preferences!",
    "login": "Click 'Login' at the top right to access your account!",
    "log in": "Sign in with your email and password at the top right!",
    "forgot password": "Click 'Forgot Password' on the login page to reset it!",
    "reset password": "Use 'Forgot Password' to get a reset link via email!",
    "change password": "Change password in Account Settings → Security!",
    "update email": "Update your email in Profile Settings!",
    "change email": "Go to Account Settings to change your email address!",
    "my orders": "View all your orders in the 'My Orders' section!",
    "order history": "Check your complete order history in 'My Orders'!",
    "saved addresses": "Manage saved addresses in Account Settings!",
    "add address": "Add new addresses in Profile → Addresses!",
    "wishlist": "❤️ View your wishlist by clicking the heart icon!",
    "favorites": "Your favorites are in your Wishlist!",
    "notifications": "Manage notifications in Account Settings!",
    "email preferences": "Update email preferences in Settings → Notifications!",
    "delete account": "To delete your account, contact customer support!",
    "close account": "Contact support to close your account!",
}

# ==========================================
# 8. CUSTOMER SUPPORT (300+)
# ==========================================
support_queries = {
    "customer support": "📞 Contact support: support@fashionera.com or use live chat!",
    "contact": "Reach us at support@fashionera.com or call 1-800-FASHION!",
    "help": "I'm here to help! What do you need assistance with?",
    "support": "How can I support you today? Ask me anything!",
    "phone number": "Call us at 1-800-FASHION (1-800-327-4466)!",
    "email": "Email us at support@fashionera.com!",
    "live chat": "You're in live chat now! How can I help?",
    "talk to human": "I can help you! But if you need a human, contact support@fashionera.com!",
    "speak to agent": "I'm here to help! For complex issues, email support@fashionera.com!",
    "customer service": "Customer service available 24/7! How can I assist?",
    "complaint": "Sorry to hear that! Please email your complaint to support@fashionera.com!",
    "problem": "What problem are you experiencing? I'll try to help!",
    "issue": "What issue are you facing? Let me assist you!",
    "not working": "What's not working? Let me help troubleshoot!",
    "error": "What error are you seeing? I can help!",
    "bug": "Sorry about that! Please report bugs to support@fashionera.com!",
}

# ==========================================
# 9. GENERAL QUESTIONS (500+)
# ==========================================
general_queries = {
    "what is fashion era": "Fashion Era is your one-stop online shop for clothing, accessories, and more!",
    "about": "We're Fashion Era - offering quality products, fast shipping, and great service!",
    "who owns this": "Fashion Era is a leading online retailer serving customers worldwide!",
    "how old is this company": "We've been serving happy customers for years!",
    "where are you located": "We're an online store serving customers globally!",
    "business hours": "We're online 24/7! Shop anytime!",
    "open hours": "Our website is always open! Shop whenever you want!",
    "are you open": "Yes! We're open 24/7 online!",
    "when do you close": "We never close! Shop anytime!",
    "holiday hours": "We're open every day, even holidays!",
    "reviews": "Check product reviews on each product page!",
    "ratings": "See customer ratings on product pages!",
    "testimonials": "Read customer testimonials on our About page!",
    "trust": "We're trusted by thousands of happy customers worldwide!",
    "legit": "Yes! We're a legitimate business with secure payments and real products!",
    "scam": "We're not a scam! We're a real business with real customers and reviews!",
    "safe": "Yes! Shopping with us is safe and secure!",
    "privacy": "We protect your privacy! Read our Privacy Policy for details!",
    "data": "Your data is secure and never shared without permission!",
    "cookies": "We use cookies to improve your experience! See our Cookie Policy!",
}

# Combine all responses
responses.update(greetings)
responses.update(conversation)
responses.update(politeness)
responses.update(shopping_queries)
responses.update(shipping_queries)
responses.update(payment_queries)
responses.update(returns_queries)
responses.update(account_queries)
responses.update(support_queries)
responses.update(general_queries)

# Add variations and common misspellings
variations = {}
for key, value in list(responses.items()):
    # Add question marks
    variations[f"{key}?"] = value
    variations[f"{key} ?"] = value
    # Add "can i", "how do i" variations
    if not key.startswith(("can", "how", "what", "where", "when", "why", "who")):
        variations[f"can i {key}"] = value
        variations[f"how do i {key}"] = value
        variations[f"how to {key}"] = value
        variations[f"i want to {key}"] = value
        variations[f"i need to {key}"] = value

responses.update(variations)

print(f"Generated {len(responses)} total responses!")

# Write to JavaScript file
js_content = "// Auto-generated quick responses - DO NOT EDIT MANUALLY\n"
js_content += "// Generated with comprehensive Q&A pairs\n\n"
js_content += "const quickResponses = {\n"

for key, value in sorted(responses.items()):
    # Escape quotes and special characters
    key_clean = key.replace("\\", "\\\\").replace("'", "\\'").replace('"', '\\"')
    value_clean = value.replace("\\", "\\\\").replace("'", "\\'").replace('"', '\\"')
    js_content += f"  '{key_clean}': '{value_clean}',\n"

js_content += "};\n\nmodule.exports = quickResponses;\n"

# Write to file
output_path = 'c:/Users/DELL/Downloads/project-E 1 (1)/project-E/project-bolt-sb1-rusndc9kBackendconnected/project-bolt-sb1-rusndc9k (1)/project/server/data/quickResponses.js'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"✅ Wrote {len(responses)} responses to {output_path}")
