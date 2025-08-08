# Email & Notification System Documentation

## Overview
This document details the comprehensive Email & Notification System for Spenny Piggy, including SendGrid SMTP settings, Mailables, queued email sending, MagicBell user keys, follow/unfollow notifications, and bulk PWA notifications for creators.

## 1. Email Configuration (SMTP Settings)

### 1.1 Mail Configuration (`config/mail.php`)
```php
'default' => env('MAIL_MAILER', 'smtp'),

'mailers' => [
    'smtp' => [
        'transport' => 'smtp',
        'host' => env('SES_HOST', ''), // Currently using SES, not SendGrid
        'port' => 587,
        'encryption' => 'tls',
        'username' => env('SES_USER', ''),
        'password' => env('SES_PASS', ''),
        'timeout' => null,
        'auth_mode' => null,
        'ping_threshold' => 10,
    ],
    
    // Fallover configuration for reliability
    'failover' => [
        'transport' => 'failover',
        'mailers' => [
            'smtp',
            'log',
        ],
    ],
],

'from' => [
    'address' => env('MAIL_FROM_ADDRESS', 'Noreply@spennypiggy.co'),
    'name' => env('MAIL_FROM_NAME', 'Example'),
],
```

**Note**: The system is currently configured for AWS SES, not SendGrid. For SendGrid implementation:
- Set `SES_HOST` to `smtp.sendgrid.net`
- Set `SES_USER` to `apikey`
- Set `SES_PASS` to your SendGrid API key

### 1.2 Environment Variables Required
```env
MAIL_MAILER=smtp
SES_HOST=smtp.sendgrid.net
SES_USER=apikey
SES_PASS=your_sendgrid_api_key
MAIL_FROM_ADDRESS=Noreply@spennypiggy.co
MAIL_FROM_NAME=SPENNY PIGGY
```

## 2. Mailable Classes

### 2.1 User Authentication & Verification
- **`VerifyEmail.php`** - Email verification for new users
- **`ForgotPassEmail.php`** - Password reset emails
- **`Welcome.php`** - Welcome emails for new users

### 2.2 Payment & Transaction Emails
- **`Checkout.php`** - Payment confirmation to creators
- **`CheckoutToUser.php`** - Payment confirmation to gift senders
- **`ThankyouUser.php`** - Thank you emails to supporters
- **`ThankYouMailAdmin.php`** - Payment notifications to admin

### 2.3 Subscription & Membership
- **`SubscriptionMail.php`** - Subscription payment reminders
- **`MonthlySubscriptionSuccessMail.php`** - Monthly subscription success
- **`MonthlySubscriptionFailedMail.php`** - Failed subscription payments
- **`MemberMail.php`** - New membership notifications to creators
- **`MemberMailToUser.php`** - Membership confirmations to users
- **`SubsMail.php`** - Subscription confirmations

### 2.4 Shop & Product Emails
- **`ShopBuyedMail.php`** - Shop purchase notifications to creators
- **`ShopBuyedMailUser.php`** - Purchase confirmations to buyers
- **`Wishlist.php`** - Wishlist item notifications

### 2.5 Content Moderation
- **`SendRestrictionMail.php`** - Content removal notifications
- **`SendAvatarRestrictionMail.php`** - Avatar restriction notices
- **`SendCoverRestrictionMail.php`** - Cover image restriction notices

### 2.6 Administrative
- **`SendAdminIntroMail.php`** - Intro approval requests to admin
- **`RenewMail.php`** - Renewal notifications
- **`BillMail.php`** - Bill payment notifications

## 3. Email Service Class (`app/EmailService.php`)

### 3.1 Core Email Service Methods
```php
class EmailService
{
    // Welcome emails
    public static function welcome($data);
    
    // Payment notifications  
    public static function checkOutUser($data, $anon, $surprise, $message, $anonname, $symbol, $vat_amount);
    public static function checkOutToUser($data, $curr);
    public static function thankyouUser($payment);
    
    // Subscription management
    public static function sendSubscriptionMail($value);
    public static function sendMonthlySubscribedMail($email, $sub);
    public static function monthlySubscribedFailedMail($email, $sub);
    
    // Shop transactions
    public static function shopBuyed($data, $anon, $amountUserPay);
    public static function shopBuyedUser($data, $url, $curr);
    
    // User verification
    public static function verifyUserEmail($data);
    public static function ForgotPassword($data);
    
    // Content moderation
    public static function sendRestrictionMail($wish);
    public static function sendAvatarRestrictionMail($email);
    public static function sendCoverRestrictionMail($email);
}
```

### 3.2 Error Handling & Logging
All email methods include comprehensive error handling:
```php
try {
    Mail::to($data['to'])->send(new Mailable($data));
} catch (TransportException $e) {
    AppService::setStatus('email', 0, $e->getMessage());
}
```

## 4. Queued Email System

### 4.1 Queue Jobs for Email Sending
All email sending is handled through Laravel Queue jobs for better performance and reliability:

#### 4.1.1 Email Queue Jobs
- **`SendUserGiftMail.php`** - Handles user verification emails
- **`SendRenewMail.php`** - Renewal notification emails
- **`SendMailSubscriptions.php`** - Subscription reminder emails
- **`ThankyouMailToUser.php`** - Thank you emails to supporters
- **`SendThankYouMailAdmin.php`** - Admin payment notifications
- **`MembershipMail.php`** - Membership emails to creators
- **`MembershipMailToUser.php`** - Membership confirmations to users
- **`SendIntroMailAdmin.php`** - Admin intro approval requests

#### 4.1.2 Queue Job Structure Example
```php
class SendUserGiftMail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    
    public $user;
    public $owner;
    
    public function __construct($user, $owner)
    {
        $this->user = $user;
        $this->owner = $owner;
    }
    
    public function handle()
    {
        if($this->user->notification_send == 1) {
            $emailData = [
                'to' => $this->user->email,
                'name' => $this->user->name,
                'username' => $this->user->username,
                'phone' => $this->user->phone,
                'email' => $this->user->email,
                'uuid' => $this->user->uuid,
            ];
            EmailService::verifyUserEmail($emailData);
        }
    }
}
```

### 4.2 Notification Preferences
Email sending respects user notification preferences:
```php
if($this->user->notification_send == 1) {
    // Send email only if user has enabled notifications
}
```

## 5. MagicBell Integration

### 5.1 MagicBell Configuration
```php
// Environment variables
MAGICBELL_API_KEY=515ceed31a4ba4c745b165a12e3a523dc9e93db4
MAGICBELL_API_SECRET=your_api_secret
MAGICBELL_API_URL=https://api.magicbell.com
```

### 5.2 MagicBell Service (`app/Services/MagicBellService.php`)
```php
class MagicBellService
{
    protected $apiKey;
    protected $apiSecret;
    
    public function __construct()
    {
        $this->apiKey = env('MAGICBELL_API_KEY');
        $this->apiSecret = env('MAGICBELL_API_SECRET');
    }
    
    public function sendNotification($title, $content, $email)
    {
        $payload = [
            'notification' => [
                'title' => $title,
                'content' => $content,
                'recipients' => [
                    ['email' => $email]
                ]
            ]
        ];
        
        $response = Http::withHeaders([
            'X-MAGICBELL-API-KEY' => $this->apiKey,
            'X-MAGICBELL-API-SECRET' => $this->apiSecret,
            'Accept' => 'application/json',
        ])->post('https://api.magicbell.com/notifications', $payload);
        
        return $response->successful();
    }
}
```

### 5.3 MagicBell Frontend Integration (`resources/js/Pages/webpush/MagicBellNotification.jsx`)
```javascript
const MagicBellNotification = () => {
    const { auth } = usePage().props;
    
    return (
        <MagicBell 
            theme={customTheme}
            apiKey={'515ceed31a4ba4c745b165a12e3a523dc9e93db4'}
            userEmail={auth?.user?.email}
        >
            {(props) => (
                <NotificationInbox 
                    width={"100%"} 
                    height={500} 
                    {...props} 
                />
            )}
        </MagicBell>
    );
};
```

### 5.4 MagicBell User Key Generation
```php
public function getUserKey()
{
    $user = 'naveen@internetbusinesssolutionsindia.com';
    
    $client = new Client();
    $response = $client->post('https://api.magicbell.com/users', [
        'headers' => [
            'X-MAGICBELL-API-KEY' => env('MAGICBELL_API_KEY'),
            'X-MAGICBELL-API-SECRET' => env('MAGICBELL_API_SECRET'),
            'Content-Type' => 'application/json',
        ],
        'json' => [
            'user' => [
                'email' => $user,
            ]
        ],
    ]);
    
    $data = json_decode($response->getBody()->getContents());
    return response()->json(['userKey' => $data->user->id]);
}
```

## 6. Follow/Unfollow Notification System

### 6.1 Follow Model (`app/Models/Follow.php`)
```php
class Follow extends Model
{
    protected $fillable = [
        'follower_id',
        'followed_id',
    ];
    
    public function followers()
    {
        return $this->belongsToMany(User::class, 'follows', 'followed_id', 'follower_id');
    }
    
    public function following()
    {
        return $this->belongsToMany(User::class, 'follows', 'follower_id', 'followed_id');
    }
}
```

### 6.2 Follow/Unfollow Controller Logic
```php
public function userFollowUnFollow(Request $request)
{
    $followed_id = $request->user_id;
    $LoggedInUser = Auth::user();
    
    if ($LoggedInUser->id == $followed_id) {
        return redirect()->back()->with('error', 'You cannot follow yourself.');
    }
    
    $userFollow = Follow::where('follower_id', Auth::id())
                       ->where('followed_id', $followed_id)
                       ->first();
                       
    $followedUser = User::select('id', 'name', 'username', 'email')
                       ->where('id', $followed_id)
                       ->first();
    
    if ($userFollow === null) {
        // Create new follow relationship
        Follow::create([
            'follower_id' => Auth::id(),
            'followed_id' => $followed_id,
        ]);
        
        // Send notification to followed user
        $title = "👥 New Follower!";
        $content = ucfirst($LoggedInUser->name) . "($LoggedInUser->username)" . 
                  " just followed you. Just Check their profile!";
        $email = $followedUser->email;
        
        Helpers::sendNotification($title, $content, $email);
        $status = 'followed';
    } else {
        // Remove follow relationship
        $userFollow->delete();
        $status = 'unfollowed';
    }
    
    return redirect()->back()->with('success', "You have $status {$followedUser->name}.");
}
```

### 6.3 Frontend Follow Button (`resources/js/Pages/Profile/FollowButton.jsx`)
```javascript
const FollowButton = ({ targetUserId, isInitiallyFollowing }) => {
    const [isFollowing, setIsFollowing] = useState(isInitiallyFollowing);
    const [loading, setLoading] = useState(false);
    
    const handleFollowToggle = () => {
        if (!auth?.user) {
            errorAlert("You must be logged in to follow.");
            return;
        }
        
        setLoading(true);
        
        router.post(
            route("user.follow.unfollow"),
            { user_id: targetUserId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsFollowing((prev) => !prev);
                },
                onFinish: () => {
                    setLoading(false);
                },
            }
        );
    };
    
    return (
        <button 
            onClick={handleFollowToggle} 
            disabled={loading}
            className={`uppercase text-sm font-gulfs rounded-full px-4 pt-[10px] pb-[7px] me-3 ${
                isFollowing ? "!bg-gray-300 " : "btn-shadow  bg-voilet text-white"
            }`}
        >
            {isFollowing ? "Following" : "Follow"}
        </button>
    );
};
```

## 7. PWA Push Notifications for Creators

### 7.1 Bulk PWA Notification Model (`app/Models/BulkPwaNotification.php`)
```php
class BulkPwaNotification extends Model
{
    protected $fillable = [
        'title',
        'body',
        'creator_id',
        'users_count',
        'user_ids',
        'created_at',
    ];
    
    protected $casts = [
        'user_ids' => 'array',
    ];
    
    public function user()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }
}
```

### 7.2 Bulk Notification Controller Logic
```php
public function sendPwaToFollower(Request $request)
{
    $request->validate([
        'title' => 'required|string|max:255',
        'body' => 'required|string',
    ]);
    
    $user = Auth::user();
    
    if ($user->role != 1) {
        return response()->json([
            'status' => false,
            'msg' => 'Only creators can send push notifications.',
        ]);
    }
    
    // Get follower IDs who are not from UK
    $followerIds = Follow::where('followed_id', $user->id)->pluck('follower_id');
    $users = User::whereIn('id', $followerIds)->where('is_uk', 0)->get();
    
    if ($users->isEmpty()) {
        return response()->json([
            'status' => false,
            'msg' => 'No users have followed you yet.',
        ]);
    }
    
    // Rate limiting: max 2 notifications per day
    $today = now()->startOfDay();
    $notificationCountToday = BulkPwaNotification::where('creator_id', $user->id)
                                                ->where('created_at', '>=', $today)
                                                ->count();
    
    if ($notificationCountToday >= 2) {
        return response()->json([
            'status' => false,
            'msg' => 'You cannot send more than 2 push notifications per day.',
        ]);
    }
    
    try {
        $count = 0;
        $userIds = [];
        
        foreach ($users as $userData) {
            $count++;
            $userIds[] = $userData->id;
            Helpers::sendNotification($request->title, $request->body, $userData->email);
        }
        
        BulkPwaNotification::create([
            'title' => $request->title,
            'body' => $request->body,
            'creator_id' => $user->id,
            'users_count' => $count,
            'user_ids' => $userIds,
        ]);
        
        return response()->json([
            'status' => true,
            'msg' => 'Push notifications sent successfully.',
        ]);
    } catch (\Exception $e) {
        Log::error('Push notification error: ' . $e->getMessage());
        return response()->json([
            'status' => false,
            'msg' => 'Failed to send push notifications. Please try again later.',
        ]);
    }
}
```

### 7.3 Frontend Bulk Notification Component (`resources/js/Components/FollowersBulkNotification.jsx`)
```javascript
export default function FollowersBulkNotification() {
    const [formData, setFormData] = useState({ title: "", body: "" });
    const [loading, setLoading] = useState(false);
    
    const maxTitleLength = 50;
    const maxBodyLength = 200;
    
    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await axios.post(
                route("send.pwa.to.follower"),
                formData
            );
            
            if (response?.data?.status) {
                successAlert(response?.data?.msg);
                router.visit(`/account`);
                setFormData({ title: "", body: "" });
            } else {
                errorAlert(response?.data?.msg);
            }
        } catch (error) {
            errorAlert(error?.response?.data?.msg || "An error occurred");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div>
            <h2>Send Push Notification</h2>
            <p>Send a bulk push notification to all of your followers.</p>
            
            <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                maxLength={maxTitleLength}
                placeholder="Notification Title"
            />
            
            <textarea
                name="body"
                rows={4}
                value={formData.body}
                onChange={handleInputChange}
                maxLength={maxBodyLength}
                placeholder="Enter something..."
            />
            
            <button
                onClick={handleSubmit}
                disabled={loading || !formData.title || !formData.body}
            >
                {loading ? "Sending..." : "Send Notification"}
            </button>
        </div>
    );
}
```

## 8. PWA Service Worker Integration

### 8.1 Service Worker (`public/serviceworker.js`)
```javascript
// Basic service worker for PWA functionality
var staticCacheName = "pwa-v" + new Date().getTime();
var filesToCache = [
    '/offline',
    '/css/app.css',
    '/js/app.js',
    // ... icon files
];

// Cache on install
self.addEventListener("install", event => {
    this.skipWaiting();
    event.waitUntil(
        caches.open(staticCacheName)
            .then(cache => {
                return cache.addAll(filesToCache);
            })
    )
});

// Serve from Cache
self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
            .catch(() => {
                return caches.match('offline');
            })
    )
});
```

### 8.2 Push Notification Subscription (`resources/js/Pages/webpush/OldSubscribe.jsx`)
```javascript
const subscribe = async () => {
    const pushClient = new WebPushClient({
        apiKey: '515ceed31a4ba4c745b165a12e3a523dc9e93db4',
        userEmail: auth?.user?.email,
        serviceWorkerPath: '/service-worker.js',
    });
    
    try {
        const authToken = await pushClient.getAuthToken();
        const data = await pushClient.subscribe();
        const subscribed = await pushClient.isSubscribed();
        
        if (subscribed) {
            localStorage.setItem('isSubscribed', "true");
            // Send welcome notification after 70 seconds
            setTimeout(() => {
                axios.get(`/test-push?email=${auth?.user?.email}&title=🎉 You're in! Let's get started.&content=Want gifts without TMI? Build your privacy-first Wishlist and let your fans spoil you!`);
            }, 70000);
        }
    } catch (error) {
        console.error("Subscription failed:", error);
    }
};
```

## 9. Notification System Features

### 9.1 Rate Limiting
- Creators can send maximum 2 bulk notifications per day
- Prevents spam and maintains user experience

### 9.2 User Filtering
- Notifications only sent to non-UK users (compliance requirement)
- Respects user notification preferences

### 9.3 Notification Types
- **Follow notifications**: When someone follows a creator
- **Payment notifications**: Transaction confirmations
- **Subscription reminders**: Payment due notifications  
- **Content updates**: New posts or content approvals
- **Bulk creator notifications**: Creator to follower broadcasts

### 9.4 Delivery Channels
- **Email**: Via SMTP/SES for transactional emails
- **Push notifications**: Via MagicBell for real-time alerts
- **In-app notifications**: Via custom notification system

## 10. Error Handling & Monitoring

### 10.1 Email Error Handling
```php
try {
    Mail::to($data['to'])->send(new Mailable($data));
} catch (TransportException $e) {
    AppService::setStatus('email', 0, $e->getMessage());
    Log::error('Email sending failed: ' . $e->getMessage());
}
```

### 10.2 Push Notification Error Handling
```php
try {
    $response = Http::withHeaders([
        'X-MAGICBELL-API-KEY' => env('MAGICBELL_API_KEY'),
        'X-MAGICBELL-API-SECRET' => env('MAGICBELL_API_SECRET'),
    ])->post('https://api.magicbell.com/notifications', $payload);
    
    if ($response->successful()) {
        Log::info('Notification sent successfully');
        return true;
    }
    
    Log::error('Failed to send notification: ' . $response->reason());
} catch (\Exception $e) {
    Log::error('Error sending notification: ' . $e->getMessage());
}
```

## 11. Database Tables

### 11.1 Email Related Tables
- `notifications` - Stores in-app notifications
- `bulk_pwa_notifications` - Tracks bulk notification campaigns
- `follows` - Manages follower relationships

### 11.2 Key Indexes
- Index on `notifications.notifiable_id` and `notifications.notifiable_type`
- Index on `follows.follower_id` and `follows.followed_id`
- Index on `bulk_pwa_notifications.creator_id` and `created_at`

## 12. Performance Considerations

### 12.1 Queue Processing
- All email sending happens asynchronously via queues
- Prevents blocking of main application flow
- Allows for retry logic on failures

### 12.2 Batch Processing
- Bulk notifications processed in batches
- Rate limiting prevents API quota exhaustion
- User preference checking before sending

### 12.3 Caching
- User notification preferences cached
- Follower counts cached for performance
- API responses cached where appropriate

## Summary

The Email & Notification System provides comprehensive communication capabilities including:

1. **Multi-channel delivery**: Email (SMTP/SES), Push (MagicBell), In-app
2. **Queue-based processing**: Reliable, asynchronous email delivery
3. **Rich notification types**: Payments, follows, subscriptions, content updates
4. **Rate limiting**: Prevents spam, maintains deliverability
5. **User preferences**: Respects notification settings
6. **Error handling**: Comprehensive logging and fallback mechanisms
7. **PWA integration**: Real-time push notifications for mobile users

The system is designed for scalability, reliability, and user experience while maintaining compliance with regional requirements.
