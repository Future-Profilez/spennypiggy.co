<?php

namespace App;

/**
 * Dynamically Generate Seo Meta & Title Tags for Pages
 *
 *
 */
class SeoMeta   {

    /**
     * Dynamic SEO Tags structured as
     * tagType => tagProps[...props]
     * @var arrya
     */
    protected static $tags = [
        'title' => 'Spennypiggy | Financial Gifts, Exclusive Content & Memberships'
    ];

    /**
     * Add Tags in Meta Tags
     *
     * @param string $tag   Tag Name
     * @param string|array  $props  Tag Properties
     * @return void
     */
    public static function addTag($tag, $props) :void
    {
        if($tag == 'title'){
            static::$tags[$tag] =   $props;
        } else {
            static::$tags[$tag][] = $props;
        }
    }

    /**
     * Render Seo Tags
     *
     * @return string
     */
    public static function render()
    {
        $html   =   '';
        foreach(static::$tags as $tag => $sub){

            if($tag == 'title'){
                $html .= "<title inertia>$sub</title>".PHP_EOL;
                continue;
            }

            foreach($sub as $props){
                $attr   =   '';
                $html   .=   "<$tag ";
                if(is_array($props)){
                    foreach($props as $prop => $value){
                        $attr   .=  "$prop=\"$value\" ";
                    }
                } else {
                    $attr   =   $props;
                }

                $html   .=  "$attr />".PHP_EOL;
            }

        }

        return $html;
    }

}
