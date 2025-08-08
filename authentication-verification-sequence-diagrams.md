# SpennyPiggy Authentication & User Verification Workflows

## Overview
This document contains sequence diagrams tracking the complete user journey from guest registration to fully verified creator status, including all authentication and verification components.

## State Transitions Overview
- **Guest** → **Registered** (via RegisteredUserController)
- **Registered** → **Email Verified** (via email verification)
- **Email Verified** → **Card Verified** (for gifters via Stripe card verification)
- **Email Verified** → **Identity Verified** (for creators via Stripe Identity)
- **Identity Verified** → **Creator** (full verification complete)

---

## 1. Guest → Registered User Flow

```mermaid
sequenceDiagram
    participant G as Guest User
    participant RF as Register Form
    participant RUC as RegisteredUserController
    participant G2FA as Google2FA Service
    participant UV as User Validation
    participant AD as AllowedDomain
    participant H as Helpers
    participant U as User Model
    participant UVS as UserVerificationStatus
    participant GA as GifterAddress
    participant WU as WelcomeUser Job
    participant Auth as Laravel Auth
    participant Session as Session Manager

    G->>RF: Access /register
    RF->>RUC: GET create()
    RUC->>RF: Return Inertia Register view
    
    G->>RF: Submit registration form
    RF->>RUC: POST store(request)
    
    Note over RUC: Validation Phase
    RUC->>UV: Validate name, email, password, username, role
    RUC->>U: Check email uniqueness
    RUC->>AD: Validate email domain against allowed domains
    RUC->>H: checkBlockData() - validate content
    
    alt Validation Fails
        RUC->>RF: Redirect back with error
    else Validation Passes
        Note over RUC: User Creation Phase
        RUC->>G2FA: generateSecretKey()
        G2FA-->>RUC: Return TFA secret key
        
        RUC->>U: Create user with TFA key
        U-->>RUC: User created with UUID
        
        alt User Role = 1 (Creator)
            RUC->>UVS: Create verification status (bio_status=1, address_status=0)
        else User Role = 0 (Gifter)
            RUC->>GA: Create gifter address record
        end
        
        Note over RUC: Post-Creation Tasks
        RUC->>Auth: Login user
        Auth-->>Session: Create authenticated session
        RUC->>WU: Dispatch welcome email job
        
        alt Email Already Verified
            RUC->>RF: Redirect to user profile
        else Email Not Verified
            RUC->>RF: Redirect to verification notice
        end
    end
```

---

## 2. Email Verification Flow

```mermaid
sequenceDiagram
    participant U as User
    participant VN as Verification Notice
    parameter EVN as EmailVerificationNotificationController
    participant WU as WelcomeUser Job
    participant Mail as Mail Service
    parameter VE as VerifyEmailController
    parameter UM as User Model
    parameter Auth as Authentication

    U->>VN: Access /verification
    VN->>U: Show "Verify your email" page
    
    U->>EVN: Click "Resend verification"
    EVN->>Mail: Send verification email
    Mail-->>U: Email with verification link
    
    U->>Mail: Click verification link in email
    Mail->>VE: GET /user/{uuid}
    
    VE->>UM: Find user by UUID
    alt User Found
        VE->>UM: Update email_verified_at = now()
        UM-->>VE: Email verification saved
        VE->>U: Redirect to user profile with success
    else User Not Found
        VE->>U: Redirect to login with error
    end
```

---

## 3. Two-Factor Authentication (2FA) Setup & Login Flow

```mermaid
sequenceDiagram
    participant U as User
    participant L as Login Form
    participant ASC as AuthenticatedSessionController
    participant G2FA as Google2FA Service
    participant UBC as UserBackupCode
    parameter Recovery as Recovery Service
    participant Auth as Laravel Auth
    participant TFA as TFA Page

    Note over U,TFA: 2FA Setup Flow
    U->>ASC: GET show2faQR()
    ASC->>G2FA: Generate QR code for user's TFA key
    G2FA-->>ASC: Return QR code data
    ASC->>U: Display QR code for authenticator app

    U->>ASC: POST update2faStatus() - Enable 2FA
    ASC->>U: Update user.is_2fa = true

    U->>ASC: GET generateBackupCode()
    ASC->>Recovery: Generate 5 backup codes
    Recovery-->>ASC: Return backup codes
    ASC->>UBC: Store encrypted backup codes
    ASC->>U: Display backup codes

    Note over U,TFA: 2FA Login Flow
    U->>L: Enter email/password
    L->>ASC: POST verifyUser()
    ASC->>ASC: Check if user has 2FA enabled
    
    alt 2FA Enabled
        ASC->>TFA: Redirect to TFA verification
        TFA->>U: Show OTP/Backup code input
        
        U->>ASC: POST verify2FA() with OTP/backup code
        
        alt Using OTP
            ASC->>G2FA: verifyKey(user.tfa_key, otp)
            G2FA-->>ASC: Return validation result
        else Using Backup Code
            ASC->>UBC: Check and consume backup code
            UBC-->>ASC: Return validation result
        end
        
        alt Verification Success
            ASC->>Auth: Authenticate user
            Auth-->>ASC: Session created
            ASC->>U: Redirect to user profile
        else Verification Failed
            ASC->>TFA: Show error message
        end
    else 2FA Disabled
        ASC->>Auth: Standard authentication
        ASC->>U: Redirect to user profile
    end
```

---

## 4. Gifter Card Verification Flow

```mermaid
sequenceDiagram
    participant G as Gifter User
    participant GCV as GifterCardVerification Page
    participant RUC as RegisteredUserController
    participant S as Stripe Service
    participant SC as StripeClient
    participant GCVModel as GifterCardVerification Model
    participant GA as GifterAddress
    participant UVS as UserVerificationStatus

    Note over G,UVS: Card Verification Initiation
    G->>GCV: Access card verification page
    GCV->>RUC: POST gifterCardVerification()
    
    RUC->>SC: Ensure Stripe customer exists
    alt No Stripe Customer
        RUC->>SC: Create Stripe customer
        SC-->>RUC: Return customer ID
        RUC->>G: Update user.stripe_id
    end
    
    RUC->>GCVModel: Check existing successful verification
    RUC->>GCVModel: Delete pending/rejected verifications
    
    Note over RUC: Calculate Verification Amount
    RUC->>RUC: Calculate base amount (£1.00) + tax (20%) + VAT (20%)
    RUC->>SC: Create checkout session
    
    SC-->>RUC: Return session URL
    RUC->>GCVModel: Create verification record (status='pending')
    RUC->>G: Redirect to Stripe Checkout

    Note over G,UVS: Payment Processing
    G->>SC: Complete Stripe payment
    SC->>RUC: Redirect to cardVerificationSuccess()
    
    RUC->>SC: Retrieve checkout session details
    SC-->>RUC: Return session with customer details
    
    alt Address Available and New
        RUC->>GA: Store encrypted billing address
    end
    
    RUC->>GCVModel: Update verification status = 'success'
    RUC->>UVS: Update all verification statuses = 1
    RUC->>G: Update profile_status_lock = 1, is_subscribed = 1
    
    RUC->>G: Redirect to profile with success message
```

---

## 5. Creator Identity Verification Flow (Stripe Identity)

```mermaid
sequenceDiagram
    participant C as Creator User
    participant SI as StripeIdentity Page
    participant SC as StripeController
    participant SIS as Stripe Identity Service
    participant VS as VerificationSession
    participant WH as Stripe Webhook
    participant SWC as StripeWebhookController
    participant U as User Model

    Note over C,U: Identity Verification Initiation
    C->>SI: Access /stripe/identity-verification
    SI->>SC: POST createVerificationSession()
    
    alt Local/Dev Environment
        SC->>U: Set identity_status = 1 (auto-approve)
        SC->>C: Return success response
    else Production Environment
        SC->>VS: Create identity verification session
        VS-->>SC: Return session ID and URL
        SC->>U: Update stripe_user_id = session.id
        SC->>C: Return session URL for identity verification
        
        C->>VS: Complete identity verification on Stripe
    end

    Note over WH,U: Webhook Processing
    VS->>WH: Send verification result webhook
    WH->>SWC: POST to webhook endpoint
    
    SWC->>SWC: Verify webhook signature
    SWC->>U: Find user by stripe_user_id
    
    alt Verification Successful
        SWC->>U: Update identity_status = 1, identity_verified_at = now()
        SWC->>WH: Return success response
    else Verification Failed
        SWC->>U: Update identity_verification_error with failure reason
        SWC->>WH: Return success response
    end
```

---

## 6. Session Handling & Middleware Protection Flow

```mermaid
sequenceDiagram
    participant U as User
    participant R as Request
    participant HIR as HandleInertiaRequests
    participant UEMV as UserEmailVerify Middleware
    parameter CGCV as CheckGifterCardVerification
    participant CSIV as CheckStripeIdentityVerification
    participant Auth as Authentication
    participant Session as Session Manager

    Note over U,Session: Request Processing
    U->>R: Make authenticated request
    R->>HIR: Process Inertia request
    
    HIR->>Session: Get flash messages (success, error, warning, info)
    HIR->>Auth: Get current user
    HIR->>HIR: Load verification status, notifications, cart count
    HIR-->>R: Add shared props to response

    Note over R,Session: Middleware Chain
    R->>UEMV: Check email verification
    alt Email Not Verified
        UEMV->>R: Redirect to verification notice
    else Email Verified
        UEMV->>CGCV: Continue to next middleware
    end
    
    CGCV->>CGCV: Check if gifter needs card verification
    alt Gifter & Limit Exceeded & Not Card Verified
        CGCV->>R: Return GifterCardVerification page
    else Card Verified or Not Required
        CGCV->>CSIV: Continue to next middleware
    end
    
    CSIV->>CSIV: Check if creator needs identity verification
    alt Creator & Profile Locked & Not Identity Verified & Has Paid Subscription
        CSIV->>R: Return StripeIdentity page
    else Identity Verified or Not Required
        CSIV->>R: Allow request to continue
    end
```

---

## 7. Complete User State Transition Overview

```mermaid
stateDiagram-v2
    [*] --> Guest
    Guest --> Registered : Registration via RegisteredUserController
    
    state Registered {
        [*] --> EmailPending
        EmailPending --> EmailVerified : Email verification via VerifyEmailController
    }
    
    state EmailVerified {
        [*] --> RoleBasedPath
        RoleBasedPath --> GifterPath : role = 0 (Gifter)
        RoleBasedPath --> CreatorPath : role = 1 (Creator)
    }
    
    state GifterPath {
        [*] --> GifterCardPending
        GifterCardPending --> GifterCardVerified : Card verification via Stripe
        GifterCardVerified --> VerifiedGifter
    }
    
    state CreatorPath {
        [*] --> CreatorProfileSetup
        CreatorProfileSetup --> StripeConnectSetup : Connect Stripe account
        StripeConnectSetup --> IdentityPending : Account connected
        IdentityPending --> IdentityVerified : Identity verification via Stripe Identity
        IdentityVerified --> VerifiedCreator
    }
    
    VerifiedGifter --> [*]
    VerifiedCreator --> [*]
    
    note right of Registered
        - TFA key generated
        - UserVerificationStatus created
        - Email verification required
    end note
    
    note right of GifterCardVerified
        - Card payment processed
        - Billing address stored
        - profile_status_lock = 1
    end note
    
    note right of VerifiedCreator
        - identity_status = 1
        - Can receive payments
        - Full platform access
    end note
```

---

## Key Components Summary

### Controllers
- **RegisteredUserController**: Handles registration, card verification for gifters
- **AuthenticatedSessionController**: Manages login, 2FA, session handling
- **StripeController**: Manages Stripe Connect, identity verification
- **VerifyEmailController**: Handles email verification

### Models
- **User**: Core user model with verification status fields
- **UserVerificationStatus**: Tracks verification progress by role
- **GifterCardVerification**: Stores card verification attempts
- **UserBackupCode**: Stores encrypted 2FA backup codes

### Middleware
- **UserEmailVerify**: Ensures email is verified
- **CheckGifterCardVerification**: Enforces card verification for gifters
- **CheckStripeIdentityVerification**: Enforces identity verification for creators

### External Services
- **PragmaRX Google2FA**: 2FA implementation
- **Stripe Checkout**: Card verification payments
- **Stripe Identity**: Identity verification service
- **Stripe Connect**: Creator payment account setup

This comprehensive workflow ensures proper user verification at each stage while maintaining security and compliance requirements.
