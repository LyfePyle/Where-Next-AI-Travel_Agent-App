# 🛒 **CART & PURCHASING SYSTEM IMPLEMENTATION PLAN**

## 🚨 **CURRENT STATUS: NOT READY FOR PURCHASES**

### **❌ What's Missing:**

1. **Shopping Cart System**
   - Add to cart functionality
   - Cart state management
   - Item quantity/modification
   - Cart persistence

2. **Booking Integration**
   - Real Amadeus API booking calls
   - Hotel reservation system
   - Activity booking partners
   - Inventory management

3. **Payment Processing**
   - Stripe checkout integration
   - Payment confirmation
   - Receipt generation
   - Refund handling

4. **Order Management**
   - Booking confirmations
   - Itinerary generation
   - Email notifications
   - Booking modifications/cancellations

---

## 🛠️ **IMPLEMENTATION ROADMAP**

### **Phase 1: Cart System (1-2 weeks)**

#### **1.1 Cart State Management**
```typescript
// Create cart context
interface CartItem {
  id: string;
  type: 'flight' | 'hotel' | 'activity';
  details: any;
  price: number;
  currency: string;
  dates: {
    start: Date;
    end?: Date;
  };
}

interface CartState {
  items: CartItem[];
  total: number;
  currency: string;
}
```

#### **1.2 Add to Cart Components**
```jsx
// Add these buttons throughout the app
<button 
  onClick={() => addToCart(item)}
  className="bg-blue-600 text-white px-4 py-2 rounded"
>
  Add to Cart - ${item.price}
</button>
```

#### **1.3 Cart Page/Sidebar**
- Cart summary
- Item management (edit/remove)
- Price calculations
- Checkout button

### **Phase 2: Real Booking Integration (2-3 weeks)**

#### **2.1 Amadeus Booking API**
```javascript
// Real flight booking
const bookFlight = async (flightOffer, passengers) => {
  const booking = await amadeus.booking.flightOrders.post(
    JSON.stringify({
      data: {
        type: 'flight-order',
        flightOffers: [flightOffer],
        travelers: passengers
      }
    })
  );
  return booking.data;
};
```

#### **2.2 Hotel Booking Partners**
- Booking.com API integration
- Expedia Partner API
- Direct hotel APIs
- Availability checking

#### **2.3 Activity Booking**
- Viator API integration
- GetYourGuide API
- Local tour operators
- Experience providers

### **Phase 3: Payment Processing (1 week)**

#### **3.1 Stripe Integration**
```javascript
// Complete checkout flow
const handleCheckout = async (cartItems) => {
  const stripe = await stripePromise;
  
  const { error } = await stripe.redirectToCheckout({
    lineItems: cartItems.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: item.description,
        },
        unit_amount: item.price * 100,
      },
      quantity: 1,
    })),
    mode: 'payment',
    successUrl: `${window.location.origin}/booking-success`,
    cancelUrl: `${window.location.origin}/cart`,
  });
};
```

#### **3.2 Payment Confirmation**
- Webhook handling
- Booking confirmation
- Email receipts
- Itinerary generation

### **Phase 4: Order Management (1-2 weeks)**

#### **4.1 Database Schema**
```sql
-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  total_amount DECIMAL,
  currency TEXT,
  status TEXT, -- 'pending', 'confirmed', 'cancelled'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  type TEXT, -- 'flight', 'hotel', 'activity'
  booking_reference TEXT,
  details JSONB,
  price DECIMAL,
  status TEXT
);
```

#### **4.2 Booking Management**
- View all bookings
- Modify reservations
- Cancel bookings
- Download tickets/vouchers

---

## 🚀 **QUICK IMPLEMENTATION GUIDE**

### **Step 1: Add Cart Context (Today)**
```jsx
// Create src/contexts/CartContext.tsx
'use client';
import { createContext, useContext, useReducer } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, { items: [], total: 0 });
  
  const addToCart = (item) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };
  
  const removeFromCart = (itemId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
  };
  
  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
};
```

### **Step 2: Add Cart UI (This Week)**
```jsx
// Create src/components/Cart.tsx
import { useCart } from '@/contexts/CartContext';

export default function Cart() {
  const { cart, removeFromCart } = useCart();
  
  return (
    <div className="cart-sidebar">
      <h2>Your Trip Cart</h2>
      {cart.items.map(item => (
        <div key={item.id} className="cart-item">
          <h3>{item.name}</h3>
          <p>${item.price}</p>
          <button onClick={() => removeFromCart(item.id)}>Remove</button>
        </div>
      ))}
      <div className="cart-total">
        Total: ${cart.total}
      </div>
      <button className="checkout-btn">Proceed to Checkout</button>
    </div>
  );
}
```

### **Step 3: Add "Add to Cart" Buttons**
```jsx
// In flight/hotel components
import { useCart } from '@/contexts/CartContext';

const FlightCard = ({ flight }) => {
  const { addToCart } = useCart();
  
  return (
    <div className="flight-card">
      <h3>{flight.airline}</h3>
      <p>${flight.price}</p>
      <button 
        onClick={() => addToCart({
          id: flight.id,
          type: 'flight',
          name: `${flight.origin} → ${flight.destination}`,
          price: flight.price,
          details: flight
        })}
      >
        Add to Cart
      </button>
    </div>
  );
};
```

---

## ⚠️ **IMPORTANT WARNINGS**

### **🚨 Current App Status:**
- **DO NOT** advertise as "ready for bookings"
- **Mock data only** - no real reservations
- **No payment processing** - Stripe not connected
- **No booking confirmations** - everything is demo

### **🔒 Before Going Live:**
1. **Legal Requirements**
   - Travel agent licensing (if required in your jurisdiction)
   - Terms of service for bookings
   - Cancellation/refund policies
   - Data protection compliance

2. **Financial Setup**
   - Business bank account
   - Stripe business verification
   - Tax handling for different countries
   - Currency conversion fees

3. **Insurance & Liability**
   - Travel booking insurance
   - Liability coverage
   - Customer protection policies

---

## 💡 **RECOMMENDED APPROACH**

### **Phase 1: Demo Mode (Current)**
- Keep everything as "demo" and "preview"
- Add clear disclaimers: "This is a demo - no real bookings"
- Focus on user experience and design

### **Phase 2: MVP Cart (Next 2 weeks)**
- Implement basic cart functionality
- Add Stripe test mode
- Create booking simulation

### **Phase 3: Real Integration (1-2 months)**
- Partner with booking providers
- Implement real payment processing
- Add legal compliance

### **Phase 4: Launch (After testing)**
- Full booking capabilities
- Customer support system
- Marketing and user acquisition

---

## 🎯 **IMMEDIATE ACTION ITEMS**

1. **Add Cart Context** - Start with basic cart state management
2. **Create Cart UI** - Shopping cart sidebar/page
3. **Add "Add to Cart" buttons** - Throughout flight/hotel displays
4. **Implement Stripe Test Mode** - For payment flow testing
5. **Add Booking Simulation** - Fake confirmation emails/receipts

**Would you like me to implement the basic cart system first?** 🛒
