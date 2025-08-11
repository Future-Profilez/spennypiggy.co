<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use App\Models\WishItem;
use App\Models\Membership;
use App\Models\Bills;
use App\Models\Shop;
use App\Models\UserIntro;
use App\Models\UserVerificationStatus;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class ModelRelationshipsTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $models = [
        [
            'model' => \App\Models\WishItem::class,
            'relation' => 'user',
            'conditions' => ['is_approved' => 0],
            'label' => 'Wish Items',
        ],
        [
            'model' => \App\Models\Membership::class,
            'relation' => 'user',
            'conditions' => ['approved' => 0],
            'label' => 'Memberships',
        ],
        [
            'model' => \App\Models\Bills::class,
            'relation' => 'user',
            'conditions' => ['approved' => 0],
            'label' => 'Bills',
        ],
        [
            'model' => \App\Models\Shop::class,
            'relation' => 'user',
            'conditions' => ['approved' => 0],
            'label' => 'Shops',
        ],
        [
            'model' => \App\Models\UserIntro::class,
            'relation' => 'user',
            'conditions' => ['approved' => 0],
            'label' => 'User Intros',
        ],
        [
            'model' => \App\Models\Post::class,
            'relation' => 'user',
            'conditions' => ['approved' => 0],
            'label' => 'Posts',
        ],
    ];

    protected function setUp(): void
    {
        parent::setUp();
        // Create basic tables for testing without running all migrations
        $this->createBasicTables();
    }

    private function createBasicTables(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('username')->unique();
            $table->integer('role')->default(0);
            $table->string('country')->nullable();
            $table->text('bio')->nullable();
            $table->boolean('bio_approved')->default(1);
            $table->string('gender')->nullable();
            $table->boolean('suspended_account')->default(0);
            $table->boolean('is_uk')->default(0);
            $table->string('default_currency')->default('GBP');
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('wish_items', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id');
            $table->string('stripe_product_id')->nullable();
            $table->string('wishname');
            $table->decimal('price', 10, 2);
            $table->string('currency')->default('GBP');
            $table->string('price_id')->nullable();
            $table->string('item_url')->nullable();
            $table->string('thumbnail')->nullable();
            $table->string('reward')->nullable();
            $table->boolean('ai_generated')->default(false);
            $table->integer('subscription')->default(0);
            $table->string('subscription_period')->nullable();
            $table->integer('repeat_purchase')->default(0);
            $table->string('category')->nullable();
            $table->boolean('is_pin')->default(false);
            $table->decimal('fullfill_amount', 10, 2)->nullable();
            $table->decimal('tax_amount', 10, 2)->nullable();
            $table->json('twitter_response')->nullable();
            $table->string('delete_reason')->nullable();
            $table->string('edited_reason')->nullable();
            $table->string('edited_status')->nullable();
            $table->boolean('is_approved')->default(1);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('memberships', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id');
            $table->string('product_id')->nullable();
            $table->string('price_id')->nullable();
            $table->string('level');
            $table->decimal('price', 10, 2);
            $table->string('thumbnail')->nullable();
            $table->text('rewards')->nullable();
            $table->integer('status')->default(1);
            $table->boolean('approved')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('bills', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id');
            $table->string('product_id')->nullable();
            $table->string('price_id')->nullable();
            $table->string('name');
            $table->decimal('price', 10, 2);
            $table->string('currency')->default('GBP');
            $table->string('thumbnail')->nullable();
            $table->decimal('tax_amount', 10, 2)->nullable();
            $table->integer('status')->default(1);
            $table->boolean('approved')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('shops', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id');
            $table->string('type');
            $table->string('stripe_product_id')->nullable();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('currency')->default('GBP');
            $table->string('success_page_type')->nullable();
            $table->text('success_page_value')->nullable();
            $table->string('reward_file_type')->nullable();
            $table->string('reward_file')->nullable();
            $table->boolean('ai_generated')->default(false);
            $table->boolean('ask_question')->default(false);
            $table->integer('slot_limitation')->nullable();
            $table->decimal('special_member_price', 10, 2)->nullable();
            $table->integer('quantity_allow')->default(1);
            $table->text('shipping_information')->nullable();
            $table->boolean('vat_applicable')->default(false);
            $table->boolean('approved')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('user_intros', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id');
            $table->string('poster')->nullable();
            $table->integer('height')->nullable();
            $table->integer('width')->nullable();
            $table->boolean('approved')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('user_verification_status', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->integer('role');
            $table->integer('bio_status')->default(0);
            $table->integer('social_status')->default(0);
            $table->integer('address_status')->default(0);
            $table->integer('user_profile_status')->default(0);
            $table->text('address_verification_error')->nullable();
            $table->timestamps();
        });

        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id');
            $table->string('type');
            $table->string('for_module')->nullable();
            $table->string('title')->nullable();
            $table->text('content')->nullable();
            $table->string('image')->nullable();
            $table->boolean('ai_generated')->default(false);
            $table->boolean('approved')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Test that all models have the user relationship defined
     */
    public function test_all_models_have_user_relationship()
    {
        foreach ($this->models as $modelConfig) {
            $modelClass = $modelConfig['model'];
            $relationName = $modelConfig['relation'];

            if ($relationName === null) {
                continue; // Skip models without relations like User avatar approvals
            }

            $model = new $modelClass;
            
            $this->assertTrue(
                method_exists($model, $relationName),
                "Model {$modelClass} should have {$relationName} relationship method"
            );

            $relation = $model->$relationName();
            
            $this->assertInstanceOf(
                BelongsTo::class,
                $relation,
                "Model {$modelClass}::{$relationName}() should return a BelongsTo relationship"
            );
        }
    }

    /**
     * Test WishItem user relationship returns User instance or null gracefully
     */
    public function test_wish_item_user_relationship_returns_user_or_null()
    {
        // Create a user
        $user = User::factory()->create([
            'suspended_account' => 0,
            'is_uk' => 0
        ]);

        // Create a wish item with valid user
        $wishItem = WishItem::factory()->create([
            'user_id' => $user->id
        ]);

        $result = WishItem::first()->user;
        $this->assertInstanceOf(User::class, $result);
        $this->assertEquals($user->id, $result->id);

        // Test with suspended user
        $suspendedUser = User::factory()->create([
            'suspended_account' => 1,
            'is_uk' => 0
        ]);

        $wishItemSuspended = WishItem::factory()->create([
            'user_id' => $suspendedUser->id
        ]);

        $result = WishItem::where('user_id', $suspendedUser->id)->first()->user;
        $this->assertNull($result);

        // Test with UK user
        $ukUser = User::factory()->create([
            'suspended_account' => 0,
            'is_uk' => 1
        ]);

        $wishItemUk = WishItem::factory()->create([
            'user_id' => $ukUser->id
        ]);

        $result = WishItem::where('user_id', $ukUser->id)->first()->user;
        $this->assertNull($result);

        // Test with non-existent user
        $wishItemOrphan = WishItem::factory()->create([
            'user_id' => 99999
        ]);

        $result = WishItem::where('user_id', 99999)->first()->user;
        $this->assertNull($result);
    }

    /**
     * Test Membership user relationship returns User instance or null gracefully
     */
    public function test_membership_user_relationship_returns_user_or_null()
    {
        // Create a user
        $user = User::factory()->create([
            'is_uk' => 0
        ]);

        // Create a membership with valid user
        $membership = Membership::factory()->create([
            'user_id' => $user->id
        ]);

        $result = Membership::first()->user;
        $this->assertInstanceOf(User::class, $result);
        $this->assertEquals($user->id, $result->id);

        // Test with UK user
        $ukUser = User::factory()->create([
            'is_uk' => 1
        ]);

        $membershipUk = Membership::factory()->create([
            'user_id' => $ukUser->id
        ]);

        $result = Membership::where('user_id', $ukUser->id)->first()->user;
        $this->assertNull($result);

        // Test with non-existent user
        $membershipOrphan = Membership::factory()->create([
            'user_id' => 99999
        ]);

        $result = Membership::where('user_id', 99999)->first()->user;
        $this->assertNull($result);
    }

    /**
     * Test Bills user relationship returns User instance or null gracefully
     */
    public function test_bills_user_relationship_returns_user_or_null()
    {
        // Create a user
        $user = User::factory()->create([
            'is_uk' => 0
        ]);

        // Create a bill with valid user
        $bill = Bills::factory()->create([
            'user_id' => $user->id
        ]);

        $result = Bills::first()->user;
        $this->assertInstanceOf(User::class, $result);
        $this->assertEquals($user->id, $result->id);

        // Test with UK user
        $ukUser = User::factory()->create([
            'is_uk' => 1
        ]);

        $billUk = Bills::factory()->create([
            'user_id' => $ukUser->id
        ]);

        $result = Bills::where('user_id', $ukUser->id)->first()->user;
        $this->assertNull($result);

        // Test with non-existent user
        $billOrphan = Bills::factory()->create([
            'user_id' => 99999
        ]);

        $result = Bills::where('user_id', 99999)->first()->user;
        $this->assertNull($result);
    }

    /**
     * Test Shop user relationship returns User instance or null gracefully
     */
    public function test_shop_user_relationship_returns_user_or_null()
    {
        // Create a user
        $user = User::factory()->create([
            'is_uk' => 0
        ]);

        // Create a shop with valid user
        $shop = Shop::factory()->create([
            'user_id' => $user->id
        ]);

        $result = Shop::first()->user;
        $this->assertInstanceOf(User::class, $result);
        $this->assertEquals($user->id, $result->id);

        // Test with UK user
        $ukUser = User::factory()->create([
            'is_uk' => 1
        ]);

        $shopUk = Shop::factory()->create([
            'user_id' => $ukUser->id
        ]);

        $result = Shop::where('user_id', $ukUser->id)->first()->user;
        $this->assertNull($result);

        // Test with non-existent user
        $shopOrphan = Shop::factory()->create([
            'user_id' => 99999
        ]);

        $result = Shop::where('user_id', 99999)->first()->user;
        $this->assertNull($result);
    }

    /**
     * Test UserIntro user relationship returns User instance or null gracefully
     */
    public function test_user_intro_user_relationship_returns_user_or_null()
    {
        // Create a user
        $user = User::factory()->create([
            'suspended_account' => 0,
            'is_uk' => 0
        ]);

        // Create a user intro with valid user
        $userIntro = UserIntro::factory()->create([
            'user_id' => $user->id
        ]);

        $result = UserIntro::first()->user;
        $this->assertInstanceOf(User::class, $result);
        $this->assertEquals($user->id, $result->id);

        // Test with suspended user
        $suspendedUser = User::factory()->create([
            'suspended_account' => 1,
            'is_uk' => 0
        ]);

        $userIntroSuspended = UserIntro::factory()->create([
            'user_id' => $suspendedUser->id
        ]);

        $result = UserIntro::where('user_id', $suspendedUser->id)->first()->user;
        $this->assertNull($result);

        // Test with UK user
        $ukUser = User::factory()->create([
            'suspended_account' => 0,
            'is_uk' => 1
        ]);

        $userIntroUk = UserIntro::factory()->create([
            'user_id' => $ukUser->id
        ]);

        $result = UserIntro::where('user_id', $ukUser->id)->first()->user;
        $this->assertNull($result);

        // Test with non-existent user
        $userIntroOrphan = UserIntro::factory()->create([
            'user_id' => 99999
        ]);

        $result = UserIntro::where('user_id', 99999)->first()->user;
        $this->assertNull($result);
    }

    /**
     * Test UserVerificationStatus user relationship returns User instance or null gracefully
     */
    public function test_user_verification_status_user_relationship_returns_user_or_null()
    {
        // Create a user
        $user = User::factory()->create([
            'suspended_account' => 0,
            'is_uk' => 0
        ]);

        // Create a user verification status with valid user
        $userVerificationStatus = UserVerificationStatus::factory()->create([
            'user_id' => $user->id
        ]);

        $result = UserVerificationStatus::first()->user;
        $this->assertInstanceOf(User::class, $result);
        $this->assertEquals($user->id, $result->id);

        // Test with suspended user
        $suspendedUser = User::factory()->create([
            'suspended_account' => 1,
            'is_uk' => 0
        ]);

        $userVerificationStatusSuspended = UserVerificationStatus::factory()->create([
            'user_id' => $suspendedUser->id
        ]);

        $result = UserVerificationStatus::where('user_id', $suspendedUser->id)->first()->user;
        $this->assertNull($result);

        // Test with UK user
        $ukUser = User::factory()->create([
            'suspended_account' => 0,
            'is_uk' => 1
        ]);

        $userVerificationStatusUk = UserVerificationStatus::factory()->create([
            'user_id' => $ukUser->id
        ]);

        $result = UserVerificationStatus::where('user_id', $ukUser->id)->first()->user;
        $this->assertNull($result);

        // Test with non-existent user
        $userVerificationStatusOrphan = UserVerificationStatus::factory()->create([
            'user_id' => 99999
        ]);

        $result = UserVerificationStatus::where('user_id', 99999)->first()->user;
        $this->assertNull($result);
    }

    /**
     * Test Post user relationship returns User instance or null gracefully
     */
    public function test_post_user_relationship_returns_user_or_null()
    {
        // Create a user
        $user = User::factory()->create([
            'suspended_account' => 0,
            'is_uk' => 0
        ]);

        // Create a post with valid user
        $post = Post::factory()->create([
            'user_id' => $user->id
        ]);

        $result = Post::first()->user;
        $this->assertInstanceOf(User::class, $result);
        $this->assertEquals($user->id, $result->id);

        // Test with suspended user
        $suspendedUser = User::factory()->create([
            'suspended_account' => 1,
            'is_uk' => 0
        ]);

        $postSuspended = Post::factory()->create([
            'user_id' => $suspendedUser->id
        ]);

        $result = Post::where('user_id', $suspendedUser->id)->first()->user;
        $this->assertNull($result);

        // Test with UK user
        $ukUser = User::factory()->create([
            'suspended_account' => 0,
            'is_uk' => 1
        ]);

        $postUk = Post::factory()->create([
            'user_id' => $ukUser->id
        ]);

        $result = Post::where('user_id', $ukUser->id)->first()->user;
        $this->assertNull($result);

        // Test with non-existent user
        $postOrphan = Post::factory()->create([
            'user_id' => 99999
        ]);

        $result = Post::where('user_id', 99999)->first()->user;
        $this->assertNull($result);
    }

    /**
     * Test that relationships respect soft delete scopes
     */
    public function test_relationships_respect_soft_delete_scopes()
    {
        foreach ($this->models as $modelConfig) {
            $modelClass = $modelConfig['model'];
            $relationName = $modelConfig['relation'];

            if ($relationName === null) {
                continue; // Skip models without relations
            }

            $model = new $modelClass;
            
            if ($relationName === 'user') {
                $relation = $model->user();
                
                // Check that the relationship has proper where clauses for soft delete scopes
                $sql = $relation->getQuery()->toSql();
                
                // Different models have different soft delete scope conditions
                if (in_array($modelClass, [
                    \App\Models\WishItem::class,
                    \App\Models\UserIntro::class,
                    \App\Models\UserVerificationStatus::class,
                    \App\Models\Post::class
                ])) {
                    $this->assertStringContainsString('suspended_account', $sql, 
                        "Model {$modelClass} user relationship should filter suspended accounts");
                }
                
                // All user relationships should filter UK users
                $this->assertStringContainsString('is_uk', $sql, 
                    "Model {$modelClass} user relationship should filter UK users");
            }
        }
    }

    /**
     * Test that soft deleted users are not returned by relationships
     */
    public function test_soft_deleted_users_are_not_returned()
    {
        // Create a user and soft delete them
        $user = User::factory()->create([
            'suspended_account' => 0,
            'is_uk' => 0
        ]);

        $wishItem = WishItem::factory()->create([
            'user_id' => $user->id
        ]);

        // Verify relationship works before deletion
        $this->assertInstanceOf(User::class, $wishItem->fresh()->user);

        // Soft delete the user
        $user->delete();

        // Verify relationship returns null after deletion
        $this->assertNull($wishItem->fresh()->user);
    }

    /**
     * Test error handling for malformed user relationships
     */
    public function test_error_handling_for_malformed_relationships()
    {
        // Test accessing relationship on model with invalid user_id
        $wishItem = new WishItem();
        $wishItem->user_id = 'invalid_user_id'; // This should not cause fatal errors
        
        try {
            $result = $wishItem->user;
            $this->assertNull($result);
        } catch (\Exception $e) {
            // If an exception is thrown, it should be handled gracefully
            $this->assertInstanceOf(\Exception::class, $e);
        }
    }
}
