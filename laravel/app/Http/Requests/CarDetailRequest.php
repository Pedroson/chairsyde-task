<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CarDetailRequest extends FormRequest
{
    public function rules()
    {
        return [
            'id' => 'required|integer',
        ];
    }

    public function authorize()
    {
        return true;
    }

    public function all($keys = null)
    {
        $data = parent::all($keys);
        $data['id'] = $this->route('id');

        return $data;
    }
}
