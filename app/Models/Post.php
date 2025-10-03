<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Ramsey\Uuid\Uuid;

class Post extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'user_id',
        'type',
        'for_module',
        'title',
        'content',
        'image',
        'ai_generated',
        'status',
        'approved',
        'approved_at',
        'can_delete_until',
    ];

    protected $hidden = [
        'id',
        'user_id',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'can_delete_until' => 'datetime',
        'ai_generated' => 'boolean',
    ];

    protected $appends = [
        'image_url',
        'likes_count',
        'liked',
        'comments_count'
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn($w) => $w->uuid = Uuid::uuid4());
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id')->where('suspended_account', 0)->where('is_uk', 0);
    }

    public function getImageUrlAttribute()
    {
        $url = false;
        if (!empty($this->image)) {
            // Check if this is a thank you image with existing transformations (contains /-/text/ or /-/font/)
            if (str_contains($this->image, '/-/text/') || str_contains($this->image, '/-/font/')) {
                // This is a dynamic thank you image - use as-is with domain
                $url = "https://ucarecdn.com/" . $this->image  . '/-/preview/';
                // replace + with %20 for spaces
                $url = str_replace('+', '%20', $url);
            } else {
                // Regular image - add format transformation
                $url = "https://ucarecdn.com/" . $this->image . '/-/format/jpeg/';
            }
        }
        return $url;
    }

    /**
     * Get optimized image URL with modern format support
     */
    public function getOptimizedImageUrl(string $format = 'webp', int $quality = 85, array $options = []): string
    {
        if (empty($this->image)) {
            return '';
        }

        $baseUrl = "https://ucarecdn.com/" . $this->image;
        $transformations = [];

        // Add format transformation
        if (in_array($format, ['webp', 'avif', 'jpeg', 'png'])) {
            $transformations[] = "format/{$format}";
        }

        // Add quality transformation
        $transformations[] = "quality/{$quality}";

        // Add resize if specified
        if (isset($options['width'])) {
            $width = $options['width'];
            $height = $options['height'] ?? '';
            $transformations[] = "resize/{$width}x{$height}";
        }

        // Add other transformations
        if (isset($options['progressive']) && $options['progressive']) {
            $transformations[] = 'progressive/yes';
        }

        return $baseUrl . '/-/' . implode('/-/', $transformations) . '/';
    }

    /**
     * Get responsive image data for modern formats
     */
    public function getResponsiveImageData(): array
    {
        if (empty($this->image)) {
            return [];
        }

        $baseUrl = "https://ucarecdn.com/" . $this->image;
        $sizes = [320, 640, 768, 1024, 1280, 1920];
        $formats = ['original', 'webp', 'avif'];
        
        $data = [
            'original' => $baseUrl . '/-/format/jpeg/-/quality/85/',
            'formats' => [
                'webp' => $baseUrl . '/-/format/webp/-/quality/85/',
                'avif' => $baseUrl . '/-/format/avif/-/quality/85/'
            ],
            'responsive' => []
        ];

        foreach ($formats as $format) {
            $formatUrl = $format === 'original' ? $data['original'] : $data['formats'][$format];
            $data['responsive'][$format] = [];

            foreach ($sizes as $size) {
                $data['responsive'][$format][$size] = str_replace('/-/quality/', "/-/resize/{$size}x/-/quality/", $formatUrl);
            }
        }

        return $data;
    }

    public function likes()
    {
        return $this->hasMany(PostLike::class, 'post_id');
    }

    public function getLikesCountAttribute()
    {
        return $this->likes()->where('status', 1)->count();
    }

    public function comments()
    {
        return $this->hasMany(PostComment::class, 'post_id');
    }

    public function getCommentsCountAttribute()
    {
        $count = $this->comments()->count();
        foreach ($this->comments as $key => $value) {
            $count += $value->replies()->count();
        }
        return $count;
    }

    public function getLikedAttribute()
    {
        $like = null;
        if (Auth::check()) {
            $like = PostLike::where('post_id', $this->id)->where('user_id', Auth::id())->where('status', 1)->first();
        }

        if (!empty($like)) {
            return true;
        }

        return false;
    }
}
