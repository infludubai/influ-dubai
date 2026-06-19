<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class PublicFileStorage
{
    public static function store(UploadedFile $file, string $directory): string
    {
        $directory = trim($directory, '/');
        $disk = Storage::disk('public');

        try {
            if ($directory !== '') {
                $disk->makeDirectory($directory);
            }

            $path = $file->store($directory, 'public');
        } catch (\Throwable $e) {
            report($e);

            throw ValidationException::withMessages([
                'file' => 'The file could not be saved. Please check server storage permissions.',
            ]);
        }

        if (!is_string($path) || $path === '') {
            throw ValidationException::withMessages([
                'file' => 'The file could not be saved. Please check server storage permissions.',
            ]);
        }

        return $path;
    }
}
