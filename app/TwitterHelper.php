<?php

namespace App;

/**
 * Help To Generate Twitter Content
 * Random according to Events with dynamic variable
 * [name]: User's name(payer)/Someone
 * [wish]: Wish name
 * [fund_amount]: Crowdfund amount
 * [amount]: Amount Paid
 * [period]: Subscription Period
 * [user_link]: Creators Profile Link
 *
 * @static  $texts
 * @static  $emojis
 *
 * @method  eventEmojis
 * @method  getTwitterContent
 * @method  processText
 *
 * @author Pradeep Sharma <pradeep@fpdemo.com>
 *
 * @see https://github.com/FP-DEV-PRADEEP
 */
class TwitterHelper
{
    /**
     * Set of Texts For Tweet
     *
     * @var array
     */
    public static $texts = [
        'wish-add' => [
            "Let's make it rain coins![e_1]\n Dive into my wishlist and drop a little surprise 🎁 my way via [user_link] using @SpennyPiggy! 🐷",
            "Get ready to make some noise![e_1]\n Check out my wishlist and drop a few coins of happiness 🎁 my way via [user_link] using @SpennyPiggy! 🐷",
            "Time for a coin shower![e_1] \nExplore my wishlist and drop a little something special at [user_link] via @SpennyPiggy 🐷 to add some sparkle! 🎁",
        ],
        'tip-jar-tips' => [
            "[name] just made it pour in my tip jar! A top-up of [amount] has added extra sparkle.[e_1] \nCheck out my wishlist and consider making my day even brighter!🎁 \n[user_link] via @SpennyPiggy 🐷",
            "Well, [name] just made it drizzle generosity into my tip jar with a top-up worth [amount]![e_1] \nPeek at my wishlist and sprinkle a little more magic my way!🎁 \n [user_link] via @SpennyPiggy 🐷",
            "Looks like [name]'s playing weather wizard! They've showered my tip jar with a top-up of [amount].[e_1] \nExplore my wishlist and maybe add some sunshine to my day!🎁 \n [user_link] via @SpennyPiggy 🐷",
        ],
        'crowdfund-paid' => [
            "Just received a contribution towards my '[fund_amount]' crowdfund goal, hitting [amount]![e_1] \nTake a look at my wishlist and consider sending a little something my way via [user_link] through @SpennyPiggy! 🐷",
            "Someone just added to my '[fund_amount]' crowdfund goal, reaching [amount]![e_1] \nFeel free to check out my wishlist and send me a surprise using [user_link] via @SpennyPiggy! 🐷",
            "A generous soul just chipped in towards my '[fund_amount]' crowdfund goal, hitting [amount]![e_1] \nWant to add some extra cheer? Check out my wishlist and send something my way at \n [user_link] via @SpennyPiggy! 🐷",
        ],
        'surprise' => [
            "Whoa! [name] just sprinkled [amount] on me like magic![e_1] Fancy spreading more joy? Check out my wishlist and send something 🎁 my way via \n [user_link] using @SpennyPiggy! 🐷",
            "Surprise! A magical [name] just gifted me [amount] out of the blue![e_1] \nWant to keep the magic going? Visit my wishlist and send a little something 🎁 via\n [user_link] through @SpennyPiggy! 🐷",
            "Well, well! [name] waved a magic wand and surprised me with a generous [amount]![e_1] \nFeeling the magic too? Explore my wishlist and send some enchantment 🎁 my way at\n [user_link] via @SpennyPiggy! 🐷",
        ],
        'subscription' => [
            "Well, look at that! [name]'s jumped on the [period] subscription train to my [wish] wishlist, splurging on items worth [amount].[e_1] \nJoin the fun by checking out my wishlist and sending a surprise my way!🎁\n [user_link] via @SpennyPiggy! 🐷",
            "Guess what? I've got a new [period] subscriber treating my [wish] wishlist like a treasure trove—worth a cool [amount]![e_1] \nDive into my wishlist and be the next star in this gifting show!🎁\n [user_link] via @SpennyPiggy! 🐷",
        ],
        'purchase' => [
            '"[name]" just made my wishlist dream come true, funding a gift worth [amount]! Feel like joining in the fun? \nCheck out my wishlist and send me a little surprise 🎁 via\n [user_link] using @SpennyPiggy! 🐷',
            "Cheers to [name] for making my day! They just sponsored a gift from my wishlist valued at [amount]. \nWant to add to the excitement? Explore my wishlist and send me something special 🎁 through \n [user_link] via @SpennyPiggy! 🐷",
            "Big shoutout to [name]! They've generously funded a wishlist item worth [amount]. \nExcited to spread more joy? Visit my wishlist and send a surprise 🎁 my way using\n [user_link] via @SpennyPiggy! 🐷",
        ],
    ];

    /**
     * Tweet Emojis
     *
     * @var array
     */
    public static $emojis = [
        'wish-add' => ['😇', '🚨', '🙌🏻'],
        'tip-jar-tips' => ['💰', '💸', '💷'],
        'crowdfund-paid' => ['📈', '💗', '🎉'],
        'surprise' => ['🎁', '🥳', '🪄'],
        'subscription' => ['🤑', '🫶', '✨'],
        'purchase' => ['🚀', '🥰', '🙏🏻'],
    ];

    /**
     * Get Shuffled Emojis
     *
     * @param  string  $event  Type of Event
     * @return string
     */
    public static function eventEmojis($event)
    {
        if (static::$emojis[$event] ?? false) {
            $e = static::$emojis[$event];
            shuffle($e);

            return implode('', $e);
        }

        return '';
    }

    /**
     * Prepare Twitter Text
     *
     * @param  string  $event  Type Of Event
     * @param  array  $payload  Values of dyamic Content
     * @return string
     */
    public static function getTwitterContent($event, $payload)
    {
        if ((empty(static::$texts[$event]))) {
            return '';
        }

        $event_text = static::$texts[$event];
        $content = $event_text[array_rand($event_text)];
        $payload['e_1'] = self::eventEmojis($event);

        return self::processText($content, $payload);
    }

    /**
     * Dynamically Replace Content using Regex
     *
     * @param  string  $text  Text to process
     * @param  array  $payload  Array of variables with Keys[dynamic varibale] and value pair
     * @param  string  $regex
     * @return string
     */
    public static function processText($text, $payload, $regex = '/\[(.*?)\]/')
    {

        $text = preg_replace_callback($regex, function ($matches) use ($payload) {
            return isset($payload[$matches[1]]) ? $payload[$matches[1]] : ($matches[0] == '[name]' ? 'Someone' : '');
        }, $text);

        return $text;
    }
}
