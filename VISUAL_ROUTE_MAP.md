# 🗺️ Visual Route Map - Where Next Travel App

## Complete Page Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           HOME PAGE (/)                                  │
│                    Landing page with hero, features                      │
└────────────────┬────────────────┬────────────────┬──────────────────────┘
                 │                 │                 │
        ┌────────▼────────┐      │      ┌──────────▼──────────┐
        │  PLAN TRIP       │      │      │   EXPLORE/SEARCH     │
        │  /plan-trip      │      │      │   /explore          │
        │                  │      │      │   (route mismatch)   │
        └────────┬─────────┘      │      └──────────┬──────────┘
                 │                │                 │
        ┌────────▼─────────┐      │      ┌─────────▼──────────┐
        │  TRIP SUGGESTIONS │      │      │   TRIP DETAILS     │
        │  /suggestions     │      │      │   /trip-details/[id]│
        │                   │      │      └─────────┬──────────┘
        │  [Save] [Book]    │      │                │
        └────────┬──────────┘      │                │
                 │                 │                │
        ┌────────▼──────────┐      │      ┌────────▼──────────┐
        │   TRIP DETAILS     │      │      │      BOOKING       │
        │   /trip-details/[id]      │      │      /booking      │
        │                   │      │      └─────────┬──────────┘
        │  [Save] [Book]    │      │                │
        └────────┬──────────┘      │      ┌────────▼──────────┐
                 │                 │      │      PAYMENT        │
        ┌────────▼──────────┐      │      │ /booking/checkout │
        │   SAVED TRPS       │      │      └─────────┬──────────┘
        │   /saved           │      │                │
        │                    │      │      ┌─────────▼──────────┐
        │  [Link to Details] │      │      │   CONFIRMATION     │
        └────────┬───────────┘      │      │/booking/confirmation│
                 │                 │      └────────────────────┘
                 │                 │
        ┌────────▼───────────┐     │
        │   TRIP DETAILS     │     │
        │   (from saved)     │     │
        └────────────────────┘     │
                                   │
                          ┌────────▼──────────┐
                          │   USER ACCOUNT     │
                          │   /(app)/profile   │
                          └────────┬───────────┘
                                   │
                    ┌─────────────┴──────────────┐
                    │                             │
        ┌───────────▼──────────┐    ┌────────────▼──────────┐
        │     MY TRIPS         │    │    SAVED TRIPS        │
        │     /my-trips         │    │    /saved             │
        └──────────────────────┘    └───────────────────────┘
```

---

## User Flow Paths

### 🟢 Flow 1: New User Planning Trip
```
/ → /plan-trip → /suggestions → /trip-details/[id] → /booking → /booking/checkout → /booking/confirmation
```

### 🟢 Flow 2: Browse and Book  
```
/ → /explore → /trip-details/[id] → /booking → /booking/checkout → /booking/confirmation
```

### 🟡 Flow 3: Save for Later
```
Any Page → [Save] → /saved → /trip-details/[id] → /booking
```

### 🟡 Flow 4: Returning User
```
/ → /(app)/profile → /my-trips OR /saved
```

---

## Color Legend

- 🟢 **Green**: Flow is connected and working
- 🟡 **Yellow**: Flow needs verification/fixing
- 🔴 **Red**: Flow is broken or missing

---

## Route Status

| Route | Status | Notes |
|-------|--------|-------|
| `/` | ✅ | Home page exists |
| `/explore` | ⚠️ | Should be `/search` per wireframe |
| `/plan-trip` | ✅ | Connected to suggestions |
| `/suggestions` | ✅ | Connected to trip details |
| `/trip-details/[id]` | ⚠️ | Needs save/book buttons verification |
| `/saved` | ⚠️ | Needs links to trip details |
| `/booking` | ⚠️ | Needs verification of connections |
| `/booking/checkout` | ⚠️ | Needs verification of payment flow |
| `/booking/confirmation` | ⚠️ | Needs verification of redirect |
| `/(app)/profile` | ⚠️ | Needs navigation links |
| `/my-trips` | ⚠️ | Needs links to trip details |

---

## Critical Connections to Verify

1. **Plan Trip → Suggestions**: ✅ Connected (router.push)
2. **Suggestions → Details**: ✅ Connected (See Details button)
3. **Details → Booking**: ⚠️ Needs verification
4. **Booking → Checkout**: ⚠️ Needs verification
5. **Checkout → Confirmation**: ⚠️ Needs verification
6. **Save Trip → Saved**: ⚠️ Needs verification
7. **Saved → Details**: ⚠️ Needs verification
8. **Home → Account**: ⚠️ Needs verification
9. **Account → My Trips**: ⚠️ Needs verification
10. **Account → Saved**: ⚠️ Needs verification

---

## Page Count Summary

- **Total Pages Found**: ~60+ pages
- **Required Pages (Wireframe)**: 11 pages
- **Pages Matching Wireframe**: 11/11 (100%)
- **Routes with Issues**: 1 (`/explore` vs `/search`)
- **Connections Needing Fix**: 5-10 connections

---

**Last Updated**: Current codebase analysis
**See Also**: `CHATGPT_HANDOFF_WIREFRAME_IMPLEMENTATION.md` for detailed information

