<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CarDetailRequest extends FormRequest
{
    public function rules()
    {
        return [
            'id' => 'required|integer'
        ];
    }

    public function authorize()
    {
        return true;
    }
}
