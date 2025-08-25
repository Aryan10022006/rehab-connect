# 🔧 TEMPORARY DISTANCE CHANGES FOR TESTING

## ⚠️ IMPORTANT: These changes are TEMPORARY for testing purposes

### After testing is complete, change these values back to 5km:

## Frontend Changes (`d:\rb\frontend\src\pages\HomePage.jsx`)

### 1. Line 67 - Change back to 5km:
```javascript
// CURRENT (Testing):
distance: isPremium ? 20 : 20, // TEMP: Changed from 5 to 20 for testing

// CHANGE BACK TO:
distance: isPremium ? 20 : 5, // Free users: 5km, Premium: 20km
```

### 2. Line 142 - Change back to 5km:
```javascript
// CURRENT (Testing):
radius: isPremium ? 20 : 20, // TEMP: Changed from 5 to 20 for testing

// CHANGE BACK TO:
radius: isPremium ? 20 : 5, // Free users: 5km, Premium: 20km
```

### 3. Lines 578-582 - Make 20km Premium only again:
```javascript
// CURRENT (Testing):
<option value={20}>Within 20 km</option>

// CHANGE BACK TO:
<option value={20} disabled={!isPremium}>Within 20 km {!isPremium && '(Premium)'}</option>
```

### 4. Line 585 - Update warning message:
```javascript
// CURRENT (Testing):
Premium users can search beyond 20km

// CHANGE BACK TO:
Premium users can search up to 20km
```

## Backend Changes (`d:\rb\backend\server.js`)

### 1. Line 379 - Change back to 10km default:
```javascript
// CURRENT (Testing):
const { lat, lng, radius = 20, isPremium = false } = req.body;

// CHANGE BACK TO:
const { lat, lng, radius = 10, isPremium = false } = req.body;
```

### 2. Line 1155 - Change back to 10km default:
```javascript
// CURRENT (Testing):
const { lat, lng, radius = 20, isPremium = false, limit } = req.body;

// CHANGE BACK TO:
const { lat, lng, radius = 10, isPremium = false, limit } = req.body;
```

---

## 🔍 Quick Search & Replace Commands (After Testing):

### Frontend:
1. Find: `distance: isPremium ? 20 : 20` → Replace: `distance: isPremium ? 20 : 5`
2. Find: `radius: isPremium ? 20 : 20` → Replace: `radius: isPremium ? 20 : 5`
3. Find: `<option value={20}>Within 20 km</option>` → Replace: `<option value={20} disabled={!isPremium}>Within 20 km {!isPremium && '(Premium)'}</option>`
4. Find: `Premium users can search beyond 20km` → Replace: `Premium users can search up to 20km`

### Backend:
1. Find: `radius = 20` → Replace: `radius = 10` (in both locations)

---

**💡 Testing Status:** Currently set to 20km for all users for testing purposes.
**🔄 Restore:** Use the above instructions to restore 5km limits for free users after testing.
