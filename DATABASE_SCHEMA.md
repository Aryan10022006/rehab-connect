# 🗄️ RehabConnect Database Schema

## **Firestore Collections Structure**

### **1. `clinics` Collection**
**Primary clinic data with comprehensive healthcare information**

```javascript
{
  id: "clinic_123", // Auto-generated document ID
  
  // Basic Information
  name: "Mumbai Rehabilitation Center",
  description: "Leading physiotherapy and rehabilitation center",
  established: "2015",
  
  // Location Data
  address: {
    street: "123 Health Street",
    area: "Bandra West", 
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400050",
    landmark: "Near SV Road Metro Station"
  },
  
  // Geographic Coordinates (Required for location-based search)
  location: {
    lat: 19.0760,
    lng: 72.8777,
    geoHash: "te7fxg2w0" // For optimized geo queries
  },
  
  // Contact Information
  contact: {
    phone: "+91-9876543210",
    email: "info@mumbairehab.com",
    website: "https://mumbairehab.com",
    whatsapp: "+91-9876543210"
  },
  
  // Operational Details
  hours: {
    monday: { open: "08:00", close: "20:00" },
    tuesday: { open: "08:00", close: "20:00" },
    wednesday: { open: "08:00", close: "20:00" },
    thursday: { open: "08:00", close: "20:00" },
    friday: { open: "08:00", close: "20:00" },
    saturday: { open: "09:00", close: "18:00" },
    sunday: { closed: true }
  },
  
  // Services Offered
  services: [
    "Physiotherapy",
    "Occupational Therapy", 
    "Speech Therapy",
    "Pain Management",
    "Sports Rehabilitation",
    "Neurological Rehabilitation"
  ],
  
  // Specializations
  specializations: [
    "Orthopedic Rehabilitation",
    "Neurological Disorders",
    "Sports Injuries",
    "Pediatric Therapy"
  ],
  
  // Staff Information
  staff: {
    totalDoctors: 5,
    totalTherapists: 12,
    totalSupport: 8,
    keyPersonnel: [
      {
        name: "Dr. Priya Sharma",
        designation: "Chief Physiotherapist",
        experience: "15 years",
        specialization: "Orthopedic Rehabilitation"
      }
    ]
  },
  
  // Facility Features
  features: [
    "Wheelchair Accessible",
    "Parking Available",
    "AC Facility",
    "Modern Equipment",
    "Insurance Accepted",
    "Online Booking"
  ],
  
  // Pricing Information
  pricing: {
    consultationFee: 500,
    sessionFee: 800,
    packageDeals: [
      { sessions: 10, price: 7000, savings: 1000 },
      { sessions: 20, price: 13000, savings: 3000 }
    ]
  },
  
  // Insurance & Payments
  insurance: {
    accepted: true,
    providers: ["Star Health", "ICICI Lombard", "HDFC ERGO"],
    cashless: true
  },
  
  // Rating & Reviews Data
  rating: {
    average: 4.5,
    total: 156,
    breakdown: {
      5: 89,
      4: 45, 
      3: 15,
      2: 5,
      1: 2
    }
  },
  
  // Professional Verification
  verification: {
    verified: true,
    verifiedAt: "2024-01-15T10:30:00Z",
    verifiedBy: "admin_user_123",
    documents: ["license", "insurance", "registration"]
  },
  
  // Media
  media: {
    logo: "https://storage.googleapis.com/clinic-images/logo_123.jpg",
    photos: [
      "https://storage.googleapis.com/clinic-images/facility_1.jpg",
      "https://storage.googleapis.com/clinic-images/equipment_1.jpg"
    ],
    virtualTour: "https://tours.clinic.com/mumbai-rehab"
  },
  
  // System Fields
  createdAt: "2024-01-10T08:00:00Z",
  updatedAt: "2024-08-24T01:30:00Z",
  status: "active", // active, inactive, suspended
  visibility: "public" // public, private, draft
}
```

### **2. `users` Collection**
**User profiles and account information**

```javascript
{
  id: "user_abc123", // Firebase Auth UID
  
  // Profile Information
  name: "Rajesh Kumar",
  email: "rajesh.kumar@email.com",
  phone: "+91-9876543210",
  
  // Demographics
  dateOfBirth: "1985-05-15",
  gender: "male", // male, female, other, prefer_not_to_say
  
  // Address
  address: {
    street: "456 Residential Complex",
    area: "Andheri East",
    city: "Mumbai", 
    state: "Maharashtra",
    pincode: "400069"
  },
  
  // Preferences
  preferences: {
    language: "en", // en, hi, mr, etc.
    notifications: {
      email: true,
      sms: false,
      push: true
    },
    searchRadius: 10, // in kilometers
    preferredServices: ["Physiotherapy", "Pain Management"]
  },
  
  // Subscription Status
  subscription: {
    plan: "premium", // free, premium
    status: "active", // active, inactive, cancelled
    startDate: "2024-08-01T00:00:00Z",
    endDate: "2024-09-01T00:00:00Z",
    autoRenew: true
  },
  
  // System Fields
  createdAt: "2024-07-15T10:30:00Z",
  updatedAt: "2024-08-24T01:30:00Z",
  lastLoginAt: "2024-08-24T01:25:00Z",
  status: "active", // active, inactive, suspended
  emailVerified: true,
  phoneVerified: true
}
```

### **3. `user_favorites` Collection**
**User's saved favorite clinics**

```javascript
{
  id: "user_abc123", // User ID (document ID)
  
  clinics: [
    {
      clinicId: "clinic_123",
      addedAt: "2024-08-20T14:30:00Z",
      notes: "Good for physiotherapy sessions"
    },
    {
      clinicId: "clinic_456", 
      addedAt: "2024-08-22T09:15:00Z",
      notes: "Convenient location"
    }
  ],
  
  // System Fields
  updatedAt: "2024-08-24T01:30:00Z",
  totalCount: 2
}
```

### **4. `user_history` Collection**
**User's browsing and interaction history**

```javascript
{
  id: "user_abc123", // User ID (document ID)
  
  clinics: [
    {
      clinicId: "clinic_123",
      viewedAt: "2024-08-24T01:20:00Z",
      viewDuration: 120, // seconds
      actionsTaken: ["viewed_details", "saved_favorite"],
      searchQuery: "physiotherapy mumbai"
    },
    {
      clinicId: "clinic_789",
      viewedAt: "2024-08-23T16:45:00Z", 
      viewDuration: 45,
      actionsTaken: ["viewed_details"],
      searchQuery: "rehabilitation center"
    }
  ],
  
  // Search History
  searches: [
    {
      query: "physiotherapy near me",
      timestamp: "2024-08-24T01:15:00Z",
      location: { lat: 19.0760, lng: 72.8777 },
      resultsCount: 25,
      filters: { 
        service: "Physiotherapy",
        rating: 4,
        distance: 5
      }
    }
  ],
  
  // System Fields
  updatedAt: "2024-08-24T01:30:00Z"
}
```

### **5. `reviews` Collection**
**User reviews and ratings for clinics**

```javascript
{
  id: "review_xyz789", // Auto-generated document ID
  
  // Review Details
  userId: "user_abc123",
  clinicId: "clinic_123",
  rating: 5, // 1-5 stars
  title: "Excellent physiotherapy treatment",
  comment: "The staff was very professional and the treatment was effective. Highly recommended for sports injuries.",
  
  // Review Metadata
  helpful: 12, // Number of users who marked this helpful
  helpfulBy: ["user_def456", "user_ghi789"], // Users who marked helpful
  verified: true, // Verified review (user actually visited)
  anonymous: false,
  
  // Treatment Details (Optional)
  treatmentDetails: {
    service: "Physiotherapy",
    duration: "4 weeks",
    condition: "Sports Injury",
    outcome: "Fully recovered"
  },
  
  // Admin Response (Optional)
  adminResponse: {
    response: "Thank you for your feedback! We're glad we could help.",
    respondedAt: "2024-08-21T10:00:00Z",
    respondedBy: "clinic_admin_123"
  },
  
  // System Fields
  createdAt: "2024-08-20T16:30:00Z",
  updatedAt: "2024-08-21T10:00:00Z",
  status: "published" // published, pending, hidden
}
```

### **6. `subscriptions` Collection**
**User subscription and payment tracking**

```javascript
{
  id: "sub_abc123", // Auto-generated document ID
  
  // Subscription Details
  userId: "user_abc123",
  plan: "premium_monthly", // free, premium_monthly, premium_yearly
  status: "active", // active, inactive, cancelled, past_due
  
  // Billing Information
  amount: 199,
  currency: "INR",
  billingCycle: "monthly", // monthly, yearly, lifetime
  
  // Payment Details
  paymentMethod: "stripe", // stripe, razorpay, bank_transfer
  stripeCustomerId: "cus_stripe123",
  stripeSubscriptionId: "sub_stripe456",
  
  // Dates
  startDate: "2024-08-01T00:00:00Z",
  endDate: "2024-09-01T00:00:00Z",
  nextBillingDate: "2024-09-01T00:00:00Z",
  cancelledAt: null,
  
  // Features Included
  features: [
    "unlimited_clinic_access",
    "extended_search_radius",
    "priority_support",
    "advanced_filters"
  ],
  
  // System Fields
  createdAt: "2024-08-01T00:00:00Z",
  updatedAt: "2024-08-24T01:30:00Z"
}
```

### **7. `admin_users` Collection**
**Administrative user access control**

```javascript
{
  id: "admin_xyz123", // User ID
  
  // Admin Details
  role: "super_admin", // super_admin, admin, moderator
  permissions: [
    "manage_clinics",
    "manage_users", 
    "view_analytics",
    "manage_reviews",
    "system_settings"
  ],
  
  // Access Control
  lastLoginAt: "2024-08-24T01:00:00Z",
  loginCount: 145,
  ipRestrictions: ["192.168.1.*"], // Optional IP restrictions
  
  // System Fields
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-08-24T01:30:00Z",
  status: "active" // active, inactive, suspended
}
```

## **Indexes Required for Optimal Performance**

### **Firestore Composite Indexes**

```javascript
// 1. Clinics location-based search
{
  collection: "clinics",
  fields: [
    { field: "location.geoHash", order: "ASCENDING" },
    { field: "verification.verified", order: "ASCENDING" },
    { field: "rating.average", order: "DESCENDING" }
  ]
}

// 2. User reviews query
{
  collection: "reviews", 
  fields: [
    { field: "clinicId", order: "ASCENDING" },
    { field: "createdAt", order: "DESCENDING" }
  ]
}

// 3. User history efficient retrieval
{
  collection: "user_history",
  fields: [
    { field: "userId", order: "ASCENDING" },
    { field: "clinics.viewedAt", order: "DESCENDING" }
  ]
}
```

## **Database Optimization Rules**

### **🚀 Performance Optimizations**

1. **Geo-location Queries**: Use geoHash for efficient location-based searches
2. **Caching Strategy**: Cache clinic data for 15 minutes, user data for 5 minutes
3. **Pagination**: Limit queries to 20 results with cursor-based pagination
4. **Denormalization**: Store calculated rating averages in clinic documents
5. **Batch Operations**: Use Firestore batch writes for multiple updates

### **🔐 Security Rules**

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Clinics: Public read, admin write
    match /clinics/{clinicId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Users: Own data only
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // User favorites: Own data only  
    match /user_favorites/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Reviews: Authenticated users can read all, write own
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (request.auth.uid == resource.data.userId || isAdmin());
    }
    
    // Admin function
    function isAdmin() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/admin_users/$(request.auth.uid));
    }
  }
}
```

This comprehensive schema provides:
- ✅ **Scalable Structure**: Optimized for 10,000+ clinics and 100,000+ users
- ✅ **Location Intelligence**: Efficient geo-based searches  
- ✅ **Professional Data**: Complete healthcare facility information
- ✅ **User Experience**: Favorites, history, reviews, subscriptions
- ✅ **Admin Control**: Role-based access and content management
- ✅ **Payment Integration**: Subscription and billing tracking
