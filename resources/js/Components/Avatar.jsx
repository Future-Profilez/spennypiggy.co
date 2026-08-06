import React from "react";
import { Link } from "@inertiajs/react";
import VerifiedBadge, { verifiedTier } from "@/Components/VerifiedBadge";
import userimage from "../../assets/img/user.jpg";

export default function Avatar({ user, name }) {
    const u = user || null;
    const verified = Boolean(verifiedTier(u));

    const inner = (
        <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
                <img
                    className={`w-10 h-10 object-cover rounded-full border-2 ${verified ? "border-green-500" : "border-gray-700"}`}
                    alt={u?.name || "User"}
                    src={u?.avatar_url || userimage}
                />
                <VerifiedBadge
                    user={u}
                    size="sm"
                    className="absolute -top-1 -right-1 bg-white rounded-full"
                />
            </div>
            <div className="min-w-0">
                <p className="text-gray-500 font-semibold text-[14px] leading-tight truncate max-w-[200px]">
                    <span className="capitalize">
                        {name || u?.name || "Anonymous"}
                    </span>
                    {u?.username && (
                        <span className="text-gray-500 font-normal ml-1 text-[13px]">
                            @{u.username}
                        </span>
                    )}
                </p>
                {u?.email && (
                    <p className="text-gray-500 text-[12px] truncate max-w-[200px] mb-1">
                        {u.email}
                    </p>
                )}
                {u?.role !== undefined && (
                    <div className="mt-0.5">
                        <span
                            className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest border ${
                                u.role == 1
                                    ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                    : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            }`}
                        >
                            {u.role == 1 ? "Creator" : "Supporter"}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );

    if (!user) {
        return (
            <div className="flex items-center gap-3">
                <img
                    className="w-10 h-10 object-cover rounded-full border-2 border-gray-700 opacity-50"
                    alt="Anonymous"
                    src={userimage}
                />
                <div>
                    <p className="text-gray-400 text-[14px] font-semibold uppercase tracking-tight">
                        {name || "Anonymous"}
                    </p>
                    <p className="text-gray-600 text-[11px] italic">
                        User not found
                    </p>
                </div>
            </div>
        );
    }

    if (!u?.username) {
        return inner;
    }

    return (
        <Link
            href={route("user.show", u.username)}
            className="hover:opacity-80 transition-opacity"
        >
            {inner}
        </Link>
    );
}
