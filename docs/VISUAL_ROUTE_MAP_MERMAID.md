# 🗺️ Visual Route Map – Where Next Travel App (Core 11 Pages)

This Mermaid diagram shows all 11 core pages from the wireframe and how they connect through the 4 key user flows.

```mermaid
flowchart LR

  %% ENTRY POINTS
  H[Home<br/>/]
  S[Search / Explore<br/>/explore<br/>⚠️ should be /search]
  P[Plan Trip<br/>/plan-trip]

  %% CORE TRIP FLOW
  Sug[Trip Suggestions<br/>/suggestions]
  D[Trip Details<br/>/trip-details/[id]]
  B[Booking<br/>/booking]
  Pay[Payment<br/>/booking/checkout]
  C[Confirmation<br/>/booking/confirmation]

  %% PERSISTENCE
  Saved[Saved Trips<br/>/saved]
  MyTrips[My Trips<br/>/my-trips]

  %% ACCOUNT
  Account[User Account<br/>/(app)/profile]

  %% FLOW 1 – NEW USER PLANNING TRIP
  H -->|"Plan Trip"| P
  P -->|"Submit Form"| Sug
  Sug -->|"See Details"| D
  D -->|"Book Now"| B
  B -->|"Proceed to Payment"| Pay
  Pay -->|"Complete Payment"| C

  %% FLOW 2 – BROWSE & BOOK
  H -->|"Explore"| S
  S -->|"View Destination"| D
  D -->|"Book Now"| B
  B -->|"Proceed to Payment"| Pay
  Pay -->|"Complete Payment"| C

  %% FLOW 3 – SAVE FOR LATER
  Sug -.->|"Save Trip"| Saved
  D -.->|"Save Trip"| Saved
  Saved -->|"View Details"| D
  Saved -->|"Book Now"| B

  %% FLOW 4 – RETURNING USER
  H -->|"Account"| Account
  Account -->|"My Trips"| MyTrips
  Account -->|"Saved Trips"| Saved
  MyTrips -->|"View Trip"| D
  MyTrips -->|"Book Again"| B

  %% POST-CONFIRMATION LOOP
  C -->|"View My Trips"| MyTrips
  C -->|"Save for Later"| Saved

  %% AI REFINE LOOP
  Sug -.->|"Refine / adjust filters"| P

  %% STYLING
  classDef entry fill:#dbeafe,stroke:#1d4ed8,color:#111,stroke-width:2px;
  classDef core fill:#dcfce7,stroke:#16a34a,color:#111,stroke-width:2px;
  classDef persist fill:#fee2e2,stroke:#b91c1c,color:#111,stroke-width:2px;
  classDef account fill:#fef3c7,stroke:#d97706,color:#111,stroke-width:2px;
  classDef warning fill:#fef3c7,stroke:#f59e0b,color:#111,stroke-width:3px,stroke-dasharray: 5 5;

  class H,S,P entry;
  class Sug,D,B,Pay,C core;
  class Saved,MyTrips persist;
  class Account account;
  class S warning;
```

## 📊 Flow Legend

- **Solid arrows (→)**: Primary user actions (clicking buttons, submitting forms)
- **Dashed arrows (-.->)**: Secondary actions (saving, optional paths)
- **Color coding**:
  - 🔵 **Blue**: Entry points (Home, Search, Plan Trip)
  - 🟢 **Green**: Core trip flow (Suggestions → Details → Booking → Payment → Confirmation)
  - 🔴 **Red**: Persistence (Saved Trips, My Trips)
  - 🟡 **Yellow**: Account management
  - ⚠️ **Yellow dashed border**: Route needs fixing (/explore should be /search)

## 🔄 The 4 Key User Flows

### Flow 1: New User Planning Trip
```
/ → /plan-trip → /suggestions → /trip-details/[id] → /booking → /booking/checkout → /booking/confirmation
```

### Flow 2: Browse and Book
```
/ → /explore → /trip-details/[id] → /booking → /booking/checkout → /booking/confirmation
```

### Flow 3: Save for Later
```
Any Page → [Save Trip] → /saved → /trip-details/[id] → /booking
```

### Flow 4: Returning User
```
/ → /(app)/profile → /my-trips OR /saved
```

## 📝 Notes

- **Route Mismatch**: `/explore` exists but wireframe specifies `/search` - needs to be fixed
- **Save Actions**: Currently exist on Trip Details, need to verify on Suggestions page
- **Booking Flow**: All pages exist but connections need verification
- **Navigation**: Needs consistent nav component across all pages

---

## 🛠️ How to Use This in Cursor + Figma

### Step 1: Render in Cursor
1. Open this file (`docs/VISUAL_ROUTE_MAP_MERMAID.md`) in Cursor
2. Cursor should automatically render the Mermaid diagram in the preview pane
3. If not, install the Mermaid preview extension

### Step 2: Export to SVG
1. Right-click on the rendered diagram in Cursor
2. Select "Export" or "Copy SVG"
3. Save as `where-next-route-map.svg`

### Step 3: Import to Figma/FigJam
1. Open Figma/FigJam
2. Drag the `where-next-route-map.svg` file into the canvas
3. Right-click → **Ungroup** to break apart the elements
4. Style and edit as needed:
   - Change colors to match your brand
   - Add annotations and notes
   - Mark completed flows vs. TODO flows
   - Add implementation notes on each arrow

### Step 4: Use as Living Document
- Mark edges as "✅ Done" when connections are verified
- Mark edges as "⚠️ Needs Fix" when issues are found
- Add notes like "handled by handleSaveTrip() → /api/trips/save"
- Update as you complete each phase of implementation

---

## 🔗 Related Documentation

- `CHATGPT_HANDOFF_WIREFRAME_IMPLEMENTATION.md` - Complete handoff document
- `PAGE_INVENTORY_AND_FLOW_ANALYSIS.md` - Detailed page inventory
- `QUICK_REFERENCE_WIREFRAME_ROUTES.md` - Quick reference guide
- `CURSOR_ACTION_CHECKLIST.md` - Step-by-step implementation tasks

---

**Last Updated**: Based on current codebase analysis
**Status**: Ready for implementation - see `CURSOR_ACTION_CHECKLIST.md` for next steps

