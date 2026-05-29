# Where Next - Dashboard Vision & Purpose

## 🎯 Core Purpose

The dashboard is the **home base** for travelers. It should:
1. **Show users their travel status at a glance** - What trips are coming up? What's planned?
2. **Help users take action quickly** - Plan a new trip, check budgets, view bookings
3. **Provide personalized insights** - Based on their preferences and travel history
4. **Surface relevant information** - Prices, deals, recommendations that matter to them

---

## 🏗️ Dashboard Structure (Proposed)

### **Top Section: Hero/Welcome Area**
- **Purpose**: Personal greeting + quick status
- **Shows**:
  - Personalized greeting (e.g., "Welcome back, Sarah!")
  - Next upcoming trip countdown (if any)
  - Quick action button: "Plan New Trip"
- **Why**: Sets context and provides immediate action

---

### **Main Content: Three Core Sections**

#### **1. Active Trips / Upcoming Travel**
- **Purpose**: Show what's happening now and soon
- **Shows**:
  - Next trip (if any) - with countdown, destination, dates
  - Active trips in planning
  - Recent trips (last 3-5)
- **Why**: Users want to see their travel plans first

#### **2. Quick Actions / Planning Tools**
- **Purpose**: Help users start planning or manage existing trips
- **Shows**:
  - "Plan New Trip" (primary CTA)
  - "View Budget" / "Manage Budget"
  - "AI Travel Agent" / "Get Recommendations"
  - "Saved Trips" / "Wishlist"
- **Why**: Make it easy to take the next step

#### **3. Insights & Recommendations**
- **Purpose**: Provide value beyond just showing data
- **Shows**:
  - **For new users**: Onboarding flow OR example trips with prices
  - **For existing users**: 
    - Personalized destination suggestions (based on preferences)
    - Price alerts / deals
    - Travel tips based on their style
    - Budget insights ("You've saved $X for your next trip")
- **Why**: Keep users engaged and help them discover new places

---

## 🆕 New User Experience

### **First Visit (No Data)**
Instead of showing empty states everywhere, show:
1. **Welcome message** with brief explanation of what they can do
2. **Quick onboarding** (2-3 questions max):
   - Budget style (Budget/Comfortable/Luxury)
   - Travel interests (select 2-3)
   - Home location (optional)
3. **Example trips with prices** - Show what's possible
4. **Clear CTA**: "Plan Your First Trip"

### **After Onboarding**
- Show personalized recommendations based on their answers
- Display example trips in their budget range
- Show relevant deals/prices for their interests

---

## 📊 Data to Display

### **Must Have:**
- Number of planned trips
- Total budget allocated
- Next trip countdown (if any)
- Recent activity

### **Nice to Have:**
- Budget progress (saved vs. planned)
- Travel style badge
- Favorite destinations
- Trip completion percentage

---

## 🎨 Design Principles

1. **Mobile-first**: Most users will check on phone
2. **Action-oriented**: Every section should have a clear next step
3. **Personalized**: Use their data to show relevant content
4. **Progressive disclosure**: Don't overwhelm new users
5. **Visual hierarchy**: Most important info at top

---

## 🚫 What NOT to Show

- Empty states with sad messages
- Too many sections with no data
- Generic content that doesn't help
- Overwhelming lists of features
- Information that requires multiple clicks to be useful

---

## 💡 Key Questions to Answer

1. **What is the user trying to accomplish?**
   - Plan a trip
   - Check on existing trip
   - Manage budget
   - Get inspiration

2. **What information do they need right now?**
   - Next trip details
   - Budget status
   - Action items

3. **What should we encourage them to do?**
   - Complete their profile (if new)
   - Plan a new trip
   - Explore destinations
   - Review their budget

---

## 🔄 User Journey States

### **State 1: Brand New User (No Data)**
- Show onboarding
- Show example trips
- Encourage first trip planning

### **State 2: User with Preferences, No Trips**
- Show personalized recommendations
- Show example trips in their style
- Strong CTA to plan first trip

### **State 3: User with 1-2 Trips**
- Show upcoming trip prominently
- Show planning progress
- Suggest next steps

### **State 4: Active User (3+ Trips)**
- Show trip overview
- Show budget summary
- Show recommendations based on history

---

## 🎯 Success Metrics

A good dashboard should:
- ✅ Help users plan trips faster
- ✅ Show relevant information immediately
- ✅ Encourage exploration and planning
- ✅ Make users feel organized and in control
- ✅ Provide value even when they're not actively planning

---

## 📝 Proposed Layout (Simple Version)

```
┌─────────────────────────────────────────┐
│  Welcome, [Name]!                        │
│  [Next Trip Countdown or CTA]           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Quick Stats (4 cards)                   │
│  - Trips | Budget | Style | Activity    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Your Trips                              │
│  [Upcoming Trip Card] OR [Plan First]   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Quick Actions                           │
│  [Plan Trip] [Budget] [AI Agent]         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  For You / Recommendations              │
│  [Personalized content based on state]   │
└─────────────────────────────────────────┘
```

---

## 🤔 Questions to Consider

1. **Should onboarding be a modal or a dedicated page?**
   - Modal: Quick, doesn't leave dashboard
   - Page: More space, feels more intentional

2. **How much data should we show by default?**
   - Minimal: Less overwhelming
   - Comprehensive: More useful for power users

3. **Should we show example trips for new users?**
   - Yes: Helps them understand what's possible
   - No: Might be confusing or misleading

4. **What's the primary action we want users to take?**
   - Plan a trip (most likely)
   - Complete profile
   - Explore destinations

---

## 🎨 Visual Hierarchy

**Most Important (Top):**
1. Welcome + Next Trip
2. Quick Stats
3. Active Trips

**Secondary (Middle):**
4. Quick Actions
5. Recommendations

**Tertiary (Bottom):**
6. Recent Activity
7. Tips & Insights

---

This vision focuses on **usefulness over features** - every element should serve a clear purpose and help users accomplish their travel planning goals.













