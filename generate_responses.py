import json

# Base categories
greetings = ["hi", "hello", "hey", "greetings", "sup", "what's up", "yo", "morning", "evening", "afternoon", "hi there", "hello there", "hey there", "good morning", "good evening", "good afternoon", "hola", "bonjour", "ciao", "namaste"]

products = ["shirt", "t-shirt", "pants", "trousers", "jeans", "shorts", "skirt", "dress", "jacket", "coat", "sweater", "hoodie", "blazer", "suit", "vest", "socks", "shoes", "sneakers", "boots", "sandals", "heels", "hat", "cap", "beanie", "scarf", "gloves", "belt", "tie", "watch", "necklace", "ring", "earrings", "bracelet", "bag", "backpack", "purse", "wallet", "sunglasses", "glasses", "perfume", "cologne", "makeup", "lipstick", "foundation", "mascara", "eyeliner", "blush", "bronzer", "highlighter", "shampoo", "conditioner", "soap", "body wash", "lotion", "cream", "moisturizer", "sunscreen", "deodorant", "toothpaste", "toothbrush", "razor", "shaving cream", "laptop", "phone", "tablet", "monitor", "keyboard", "mouse", "printer", "scanner", "camera", "lens", "tripod", "headphones", "earbuds", "speaker", "microphone", "charger", "cable", "battery", "power bank", "case", "router", "modem", "switch", "server", "console", "game", "controller", "tv", "projector", "remote", "dvd", "bluray", "fridge", "freezer", "stove", "oven", "microwave", "dishwasher", "washer", "dryer", "vacuum", "iron", "fan", "heater", "ac", "blender", "mixer", "toaster", "kettle", "coffee maker", "grill", "fryer", "pot", "pan", "knife", "fork", "spoon", "plate", "bowl", "cup", "mug", "glass", "bottle", "couch", "sofa", "chair", "table", "desk", "bed", "mattress", "pillow", "blanket", "sheet", "towel", "curtain", "rug", "lamp", "mirror", "clock", "vase", "frame", "toy", "doll", "action figure", "lego", "puzzle", "board game", "card game", "ball", "bat", "racket", "bike", "helmet", "skates", "skateboard", "scooter", "tent", "sleeping bag", "backpack", "compass", "book", "ebook", "magazine", "newspaper", "notebook", "pen", "pencil", "marker", "paint", "brush", "canvas", "easel", "guitar", "piano", "drum", "violin", "flute", "trumpet", "saxophone"]

colors = ["red", "blue", "green", "yellow", "orange", "purple", "pink", "brown", "black", "white", "gray", "gold", "silver", "beige", "maroon", "navy", "teal", "olive", "lime", "cyan", "magenta", "violet", "indigo", "turquoise", "coral", "salmon", "khaki", "ivory", "lavender", "peach", "mint", "cream", "tan", "bronze", "charcoal", "ruby", "emerald", "sapphire", "amber"]

actions = ["buy", "purchase", "order", "get", "shop", "browse", "view", "see", "show", "find", "search", "look for", "want", "need", "like", "love", "hate", "dislike", "return", "refund", "exchange", "cancel", "track", "ship", "deliver", "pay", "checkout", "login", "register", "signup", "sign in", "sign up", "logout", "log out", "reset", "change", "update", "edit", "delete", "remove", "add", "save", "wishlist", "cart", "basket", "bag", "confirm", "verify", "contact", "call", "email", "chat", "message", "text", "ask", "help", "support", "question", "query", "complaint", "feedback", "review", "rate", "comment", "share"]

adjectives = ["cheap", "expensive", "affordable", "premium", "luxury", "budget", "best", "top", "new", "latest", "old", "used", "refurbished", "second hand", "vintage", "retro", "modern", "classic", "style", "stylish", "fashion", "fashionable", "trendy", "cool", "hot", "warm", "cold", "summer", "winter", "spring", "autumn", "fall", "men", "women", "kids", "boys", "girls", "baby", "toddler", "teen", "adult", "senior", "large", "small", "medium", "xl", "xs", "loose", "tight", "fitted", "slim", "wide", "short", "long", "high", "low", "good", "bad", "great", "awful", "nice", "ugly", "beautiful", "pretty", "cute", "formal", "casual", "smart", "sport", "active", "outdoor", "indoor"]

shipping_terms = ["shipping", "delivery", "postage", "courier", "mail", "ups", "fedex", "dhl", "usps", "fast", "express", "overnight", "next day", "same day", "standard", "economy", "free shipping", "international", "domestic", "tracking", "track order", "where is my order", "when will it arrive", "late", "delayed", "lost", "stolen", "damaged", "broken"]

payment_terms = ["payment", "pay", "credit card", "debit card", "visa", "mastercard", "amex", "discover", "paypal", "apple pay", "google pay", "bitcoin", "crypto", "cash", "cod", "invoice", "bill", "receipt", "refund", "chargeback", "discount", "coupon", "promo code", "voucher", "gift card", "price", "cost", "total", "tax", "vat", "fees"]

responses = {}

# Generate Greeting Responses
for w in greetings:
    responses[w] = f"👋 {w.capitalize()}! Welcome to our store. How can I help you today?"

# Generate Product Responses
for p in products:
    responses[p] = f"🛍️ We have a great selection of {p}s! You can check our '{p.capitalize()}' category for the latest styles."
    
    # Generate Product + Color combinations
    for c in colors:
        key = f"{c} {p}"
        responses[key] = f"🎨 Looking for a {c} {p}? We have those in stock! Check out our collection."

# Generate Action Responses
for a in actions:
    responses[a] = f"👍 You want to {a}? Sure, I can help with that. Please provide more details."

# Generate Adjective + Product Responses (Sample)
for adj in adjectives:
    responses[adj] = f"You are interested in {adj} items? We have plenty of options that match that description!"
    for p in products[:10]: # Limit combos to avoid too many
         key = f"{adj} {p}"
         responses[key] = f"Searching for {adj} {p}? We've got you covered with our top-rated selection."

# Shipping Responses
for s in shipping_terms:
    responses[s] = f"🚚 Regarding {s}: We offer fast and reliable shipping. Standard shipping takes 3-5 days. Check 'My Orders' for specific details."

# Payment Responses
for pay in payment_terms:
    responses[pay] = f"💳 For {pay}: We accept all major credit cards, PayPal, and more. Transactions are secure."

# Specific overrides/additions to ensure count and quality
responses["help"] = "❓ I'm here to help! specific topics: shipping, returns, products, payment."
responses["menu"] = "📋 Main Menu: 1. Shop 2. Track Order 3. Support 4. FAQ"
responses["contact"] = "📞 Support Hours: Mon-Fri 9am-5pm EST. Email us at support@example.com"
responses["location"] = "📍 We are an online-only store, serving customers worldwide!"
responses["size guide"] = "📏 You can find the size guide on every product page next to the size selection."
responses["account"] = "👤 You can manage your account settings, address, and orders from the 'My Account' page."
responses["password"] = "🔐 Forgot your password? Click 'Forgot Password' on the login screen to reset it."
responses["wishlist"] = "❤️ Saved to wishlist! You can view your favorite items anytime."

# Ensure we have at least 500
count = len(responses)
print(f"Generated {count} responses.")

# Write to JS file
js_content = "const quickResponses = {\n"
for k, v in responses.items():
    # Escape single quotes in keys/values
    k_clean = k.replace("'", "\\'")
    v_clean = v.replace("'", "\\'")
    js_content += f"  '{k_clean}': '{v_clean}',\n"
js_content += "};\n\nmodule.exports = quickResponses;"

with open('c:/Users/DELL/Downloads/project-E 1 (1)/project-E/project-bolt-sb1-rusndc9kBackendconnected/project-bolt-sb1-rusndc9k (1)/project/server/data/quickResponses.js', 'w', encoding='utf-8') as f:
    f.write(js_content)
