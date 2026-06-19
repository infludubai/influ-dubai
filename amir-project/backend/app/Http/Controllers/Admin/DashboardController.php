<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CustomQuote;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $stats = [
            'total_orders' => Order::count(),
            'pending_orders' => Order::where('status', 'pending_approval')->count(),
            'active_orders' => Order::whereIn('status', ['approved', 'in_progress'])->count(),
            'completed_orders' => Order::where('status', 'completed')->count(),
            'total_clients' => User::where('role', 'client')->count(),
            'new_quotes' => CustomQuote::where('status', 'new')->count(),
            'revenue_total' => Invoice::where('status', 'paid')->sum('total'),
            'revenue_this_month' => Invoice::where('status', 'paid')
                ->whereMonth('paid_at', now()->month)
                ->whereYear('paid_at', now()->year)
                ->sum('total'),
        ];

        return response()->json(['data' => $stats]);
    }

    public function recentOrders(): JsonResponse
    {
        $orders = Order::with(['user:id,name,email', 'package:id,name'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        return response()->json(['data' => $orders]);
    }

    public function revenueChart(): JsonResponse
    {
        $data = Invoice::where('status', 'paid')
            ->where('paid_at', '>=', now()->subMonths(6))
            ->select(
                DB::raw('DATE_FORMAT(paid_at, "%Y-%m") as month'),
                DB::raw('SUM(total) as revenue'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json(['data' => $data]);
    }
}
