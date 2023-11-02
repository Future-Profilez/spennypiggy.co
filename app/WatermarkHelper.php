<?php

namespace App;

use Illuminate\Support\Facades\Storage;
use Image;

/**
 * Class For handle the Watermarks on Image
 *
 * @see https://image.intervention.io/v2/api/make
 */
class WatermarkHelper
{


    public function __construct()
    {
    }

    /**
     * Get Suitable Image for watermark
     *
     * @param int $width Width Of Image
     * @param int $height Height of Image
     * @return string Image Path
     */
    public static function getWatermarkImage($width, $height)
    {

        $param = $width > $height ? $width : $height;

        if ($param > 3840) {
            // $wm = Storage::disk('s3')->url('watermark/3648_590x590.png');
            // $wm = Storage::disk('s3')->url('watermark/3072_482x482.png');
            $wm = "c4393934-323a-4d16-8eee-a755948e7a5f";
        } elseif ($param > 3072) {
            $wm = "67222243-37f5-4f1a-999b-ad200233e14f";
        } elseif ($param > 2592) {
            $wm = "f75ce6e0-ad1f-4bb6-8da9-22e3224f1f97";
        } elseif ($param > 1920) {
            $wm = "78b64261-3dc9-4582-a4e5-0eb3ac376393";
        } elseif ($param > 1800) {
            $wm = "7edd083d-8538-4f2e-b247-c8f2969d014a";
        } elseif ($param > 1280) {
            $wm = "7edd083d-8538-4f2e-b247-c8f2969d014a";
        } elseif ($param >= 1080) {
            $wm = "49bcb68d-f1c1-46e8-a210-7d4065180c9a";
        } elseif ($param >= 720) {
            $wm = "874d84d4-745f-4895-9ee8-7407568ba4db";
        } else {
            $wm = "f4ac79ac-ea4e-4110-9d9a-a3050f8bb87e";
        }

        return $wm;
    }

    /**
     * Get Font Size According to the Image Size
     *
     * @param int $width Width Of Image
     * @param int $height Height of Image
     * @return int Size of Font
     */
    public static function getFontSize($width, $height)
    {
        $param = $width > $height ? $width : $height;

        if ($param > 3840) {
            $wm = 40;
        } elseif ($param > 3072) {
            $wm = 36;
        } elseif ($param > 2592) {
            $wm = 32;
        } elseif ($param > 1920) {
            $wm = 28;
        } elseif ($param > 1800) {
            $wm = 24;
        } elseif ($param > 1280) {
            $wm = 20;
        } elseif ($param >= 1080) {
            $wm = 16;
        } elseif ($param >= 720) {
            $wm = 12;
        } else {
            $wm = 8;
        }
        return $wm;
    }


    /**
     * Attatch watermark As Image to the image
     *
     * @param \Image $image Intervention Image Object
     * @param string $placement Placement identifier
     * @param int $x X Offset
     * @param int $y Y Offset
     * @return \Image
     */
    public static function addImageWatermark($image)
    { //, $placement = 'top-right', $x = 10, $y = 10){
        $height = $image->height();
        $width = $image->width();
        $wm = static::getWatermarkImage($width, $height);
        // $image->insert($wm, $placement, $x, $y);
        return $wm;
    }

    /**
     * Place Text Watermark at Bottom left
     *
     * @param \Image $image Intervention Image Object
     * @param string|array $color Text Color Code
     * @param string $text Watermark text
     */
    public static function addTextWatermark($image, $text, $color = '#6175fa')
    {
        $width = $image->width();
        $height = $image->height();
        $fontsize = static::getFontSize($width, $height);
        // $image->text($text, 5, ($height - 20), function ($font) use ($fontsize, $color) {
        //     $font->file(storage_path('app/public/font/Inter-Medium.ttf'));
        //     $font->size($fontsize);
        //     $font->color($color);
        //     $font->align('left');
        //     $font->valign('bottom');
        // });

        $arr = [
            'fontsize' => $fontsize,
            'width' => $width,
            'height' => $height,
            'color' => $color
        ];

        return $arr;
    }

    /**
     * Properties for UploadCare Text WaterMark
     *
     * @param int $width
     * @param int $height
     * @param string $color
     * @return array
     */
    public static function addUcTextWatermark($width, $height, $color = '#6175fa'){
        $fontsize = static::getFontSize($width, $height);
        // $image->text($text, 5, ($height - 20), function ($font) use ($fontsize, $color) {
        //     $font->file(storage_path('app/public/font/Inter-Medium.ttf'));
        //     $font->size($fontsize);
        //     $font->color($color);
        //     $font->align('left');
        //     $font->valign('bottom');
        // });

        $arr = [
            'fontsize' => $fontsize,
            'width' => $width,
            'height' => $height,
            'color' => $color
        ];

        return $arr;
    }
}
