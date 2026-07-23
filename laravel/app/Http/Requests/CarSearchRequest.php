<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CarSearchRequest extends FormRequest
{
    public function rules()
    {
        return [
            'year' => 'nullable|integer|min:1900|max:2023',
            'make' => 'required|string|max:255',
            'model' => 'nullable|string|max:255',
            'limit' => 'required|integer|min:1|max:1000',
            'offset' => 'required|integer|min:0',
        ];
    }

    public function authorize()
    {
        return true;
    }
}
