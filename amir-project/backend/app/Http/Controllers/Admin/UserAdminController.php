<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserAdminController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::orderByDesc('created_at')->get([
            'id', 'name', 'username', 'email', 'phone', 'role', 'is_active',
            'email_verified_at', 'created_at',
        ]);

        return response()->json(['data' => $users]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'nullable|string|max:255|unique:users,username',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:30',
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in(['client', 'admin'])],
            'is_active' => 'sometimes|boolean',
            'email_verified' => 'sometimes|boolean',
        ]);

        $user = User::create([
            'name' => $data['name'],
            'username' => $data['username'] ?: strtolower(preg_replace('/[^a-z0-9]+/i', '.', $data['name'])) . random_int(100, 999),
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
            'is_active' => $data['is_active'] ?? true,
            'email_verified_at' => ($data['email_verified'] ?? true) ? now() : null,
        ]);

        return response()->json(['data' => $user, 'message' => 'User created.'], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $data = $request->validate([
            'is_active' => 'sometimes|boolean',
            'role'      => 'sometimes|in:client,admin',
        ]);

        $user->update($data);

        return response()->json(['data' => $user, 'message' => 'User updated.']);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($request->user()->id === $user->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        if ($user->role === 'admin' && User::where('role', 'admin')->count() <= 1) {
            return response()->json(['message' => 'You cannot delete the last admin user.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }
}
