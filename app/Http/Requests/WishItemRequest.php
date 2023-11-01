<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WishItemRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $regex = '/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/';
        return [
            'wishname' => ['required', 'string', 'max:255'],
            'price' => ['required'],
            'item_url' => ['sometimes', 'regex:' . $regex],
            'subscription' => ['required', 'in:0,1,2'],
            'subscription_period' => ['sometimes', 'string'],
            'repeat_purchase' => ['sometimes', 'in:0,1'],
        ];
    }
}
