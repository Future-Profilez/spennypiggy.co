# 🔒 Leaderboard Data Classification & Privacy Policy

## Step 3: Data Classification & Privacy Policy for Public Leaderboard

### 1. JSON Field Classification

Based on analysis of the leaderboard codebase (`LeaderBoardController.php`, `AchievementSystem.jsx`, `PlatformAnalytics.jsx`, `GrowthTrends.jsx`, etc.), all JSON fields have been categorized into **Public-Safe** and **Sensitive** data:

---

## 📊 **PUBLIC-SAFE DATA** (Safe for Leaderboard Display)

### **User Identity & Profile**
✅ **username** - Public identifier for users  
✅ **name** - Display name (when user opts-in to public display)  
✅ **avatar_url** - Profile picture URL  
✅ **cover_url** - Cover image URL  
✅ **role** - User role (creator/supporter)  
✅ **badge** - Achievement badges and categories  
✅ **rank** - Leaderboard position/ranking  

### **Public Engagement Metrics**
✅ **profile_status_lock** - Verification status indicator  
✅ **badge_type** - Type of achievement badge  
✅ **badge_categories** - Achievement category groupings  
✅ **earned_date** - Public achievement dates  
✅ **milestone_title** - Public milestone descriptions  
✅ **category** - Revenue stream categories (wishes, tips, etc.)  

### **Aggregated Platform Statistics**
✅ **total_creators** - Platform-wide creator count  
✅ **total_supporters** - Platform-wide supporter count  
✅ **platform_milestones** - Public platform achievements  
✅ **country** - Geographic data (aggregated by country)  
✅ **creators_count** - Number of creators per region  

---

## 🚨 **SENSITIVE DATA** (Requires Authentication/Authorization)

### **Financial Information**
❌ **amount** - Specific transaction amounts  
❌ **currency** - User's preferred currency  
❌ **total_amount** - Individual user revenue totals  
❌ **total_revenue** - Personal revenue figures  
❌ **amount_subtotal** - Transaction subtotals  
❌ **amount_total** - Transaction totals  
❌ **tax** - Tax amounts and calculations  

### **Business Intelligence & Analytics**
❌ **growth_percentage** - Individual user growth rates  
❌ **monthly_revenue** - Personal monthly earnings  
❌ **revenue_growth** - Individual revenue growth rates  
❌ **achievement_value** - Monetary values tied to achievements  
❌ **current_amount** - Real-time earnings data  
❌ **avg_support** - Average support amounts  

### **Personal & Identifying Information**
❌ **email** - Email addresses  
❌ **guest_email** - Guest transaction emails  
❌ **ip_address** - IP address tracking data  
❌ **session_id** - Payment session identifiers  
❌ **stripe_id** - Payment processor identifiers  
❌ **payment_method_type** - Payment method details  

### **Internal Platform Data**
❌ **user_id** - Internal user identifiers  
❌ **owner_id** - Internal ownership tracking  
❌ **payment_status** - Transaction status details  
❌ **uuid** - Internal unique identifiers  
❌ **created_at** - Precise timestamp data  
❌ **updated_at** - Internal update tracking  

---

## 🛡️ **PUBLIC LEADERBOARD PRIVACY POLICY**

### **What Can Be Displayed Publicly (No Authentication Required):**

#### ✅ **Public Leaderboard Rankings**
- User rankings by position (#1, #2, #3, etc.)
- Usernames and display names (opt-in basis)
- Profile avatars and cover images
- Verification badges and achievement indicators
- General category participation (wishes, tips, memberships, etc.)

#### ✅ **Platform-Wide Statistics**
- Total number of active creators
- Total number of platform supporters  
- Geographic distribution (country-level aggregation)
- Platform milestones and achievements
- General category popularity trends

#### ✅ **Public Achievement System**
- Achievement badge types and categories
- Public milestone celebrations (without specific amounts)
- Community recognition features
- General growth trend indicators (without specific figures)

---

### **What Requires Authentication/Authorization:**

#### 🔐 **Creator Dashboard (Self-View Only)**
- Personal revenue amounts and totals
- Individual transaction history
- Personal growth percentages and analytics
- Detailed financial breakdowns by category
- Tax information and payment details
- Personal business intelligence metrics

#### 🔐 **Platform Administration (Admin Only)**
- Individual user financial data
- Specific transaction amounts and details
- Personal identifying information (emails, IDs)
- Internal system identifiers and tracking data
- Payment processing details
- Business intelligence and revenue analytics

#### 🔐 **Supporter Information (Authenticated Users Only)**
- Identity of supporters (unless anonymous)
- Support amounts and transaction details
- Personal supporter history and patterns

---

## 📋 **Implementation Guidelines**

### **Public Leaderboard Display Rules:**
1. **Default to Privacy** - Only display explicitly classified public-safe data
2. **User Consent Required** - Names and avatars require opt-in consent
3. **Anonymization Options** - Allow users to display as "Anonymous" 
4. **Aggregation Only** - Show aggregated statistics, not individual amounts
5. **Category Indicators** - Show participation without revealing amounts

### **Data Masking Requirements:**
- Replace sensitive amounts with ranking positions
- Use percentage indicators instead of actual figures (e.g., "Top 1%" vs "$5,000")
- Show growth trends without specific numbers (e.g., "Growing Fast" vs "+25%")
- Display relative performance (e.g., "Rising Creator" vs exact growth rate)

### **Authentication Boundaries:**
- **Public View:** Rankings, badges, categories, general statistics
- **Authenticated View:** Own financial data and detailed analytics only
- **Admin View:** Platform-wide analytics and management tools

---

## ✅ **Policy Sign-off Requirements**

**This policy must be approved by:**
- [ ] **Product Owner** - Feature scope and user experience impact
- [ ] **Security Team** - Data privacy and protection compliance  
- [ ] **Legal Team** - GDPR/CCPA compliance and terms of service alignment
- [ ] **Engineering Lead** - Technical implementation feasibility
- [ ] **Data Protection Officer** - Privacy regulation compliance

**Sign-off Date:** _________________

**Next Steps After Approval:**
1. Implement data filtering in LeaderBoardController.php
2. Update frontend components to respect privacy classifications
3. Add user consent mechanisms for public display
4. Implement authentication checks for sensitive data access
5. Add privacy controls in user settings

---

## 🔒 **Compliance Notes**

This classification ensures compliance with:
- **GDPR (General Data Protection Regulation)**
- **CCPA (California Consumer Privacy Act)**  
- **PCI DSS (Payment Card Industry Data Security Standards)**
- **Platform Terms of Service and Privacy Policy**

**No code changes should be implemented until this policy receives full stakeholder approval.**
