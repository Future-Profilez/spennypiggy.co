import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Shield,
    LogOut,
    UserX,
    Search,
    X,
    Monitor,
    Smartphone,
    Globe,
    UserMinus,
} from "lucide-react";
import { useAlerts } from "@/Components/Alerts";

export default function SecurityZone() {
    const { successAlert, errorAlert } = useAlerts();
    const [sessions, setSessions] = useState([]);
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sessionsRes, blockedRes] = await Promise.all([
                axios.get(route("creator.security.sessions")),
                axios.get(route("creator.security.blocked-users")),
            ]);
            setSessions(sessionsRes.data.sessions);
            setBlockedUsers(blockedRes.data.blocked_users);
        } catch (error) {
            console.error("Error fetching security data", error);
        } finally {
            setLoading(false);
        }
    };

    const revokeSession = async (sessionId) => {
        if (!confirm("Are you sure you want to log out this session?")) return;
        try {
            await axios.post(route("creator.security.sessions.revoke"), {
                session_id: sessionId,
            });
            successAlert("Session revoked successfully");
            fetchData();
        } catch (error) {
            errorAlert("Failed to revoke session");
        }
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.length < 2) {
            setSearchResults([]);
            setSearching(false);
            return;
        }

        setSearching(true);
        try {
            const res = await axios.get(
                route("creator.security.search-users", { query }),
            );
            setSearchResults(res.data.users || []);
        } catch (error) {
            console.error("Search error", error);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const blockUser = async (userId) => {
        try {
            await axios.post(route("creator.security.block-user"), {
                user_id: userId,
            });
            successAlert("User blocked successfully");
            setSearchQuery("");
            setSearchResults([]);
            fetchData();
        } catch (error) {
            errorAlert(error.response?.data?.message || "Failed to block user");
        }
    };

    const unblockUser = async (userId) => {
        try {
            await axios.delete(
                route("creator.security.unblock-user", { id: userId }),
            );
            successAlert("User unblocked successfully");
            fetchData();
        } catch (error) {
            errorAlert("Failed to unblock user");
        }
    };

    const clearSearch = () => {
        setSearchQuery("");
        setSearchResults([]);
        setSearching(false);
    };

    // Filter out already blocked users from search results
    const filteredSearchResults = searchResults.filter(
        (user) => !blockedUsers.some((blocked) => blocked.id === user.id),
    );

    if (loading)
        return (
            <div className="p-8 text-center font-gulfs">
                LOADING SECURITY DATA...
            </div>
        );

    return (
        <div className="space-y-8 p-2 smax-h-[70vh] overflow-y-auto custom-scrollbar">
            <div>
                <h2 className="text-xl font-gulfs mb-4 flex items-center gap-2 text-black">
                    <Shield className="text-[#FF007F]" /> ACTIVE SESSIONS
                </h2>
                <div className="space-y-3">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className="flex items-center justify-between p-4 bg-white border-2 border-black rounded-[20px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-pink-100 rounded-xl border border-black text-[#FF007F]">
                                    {session.device.is_mobile ? (
                                        <Smartphone
                                            size={24}
                                            strokeWidth={2.5}
                                        />
                                    ) : (
                                        <Monitor size={24} strokeWidth={2.5} />
                                    )}
                                </div>
                                <div>
                                    <p className="font-black text-gray-900 flex items-center gap-2">
                                        {session.device.browser} on{" "}
                                        {session.device.platform}
                                        {session.is_current_device && (
                                            <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                Active Now
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">
                                        {session.ip_address} •{" "}
                                        {session.last_active}
                                    </p>
                                </div>
                            </div>
                            {!session.is_current_device && (
                                <button
                                    onClick={() => revokeSession(session.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl border-2 border-transparent hover:border-red-200 transition-all"
                                    title="Revoke Session"
                                >
                                    <LogOut size={20} strokeWidth={2.5} />
                                </button>
                            )}
                        </div>
                    ))}
                    {sessions.length === 0 && (
                        <p className="text-gray-500 italic text-center p-4">
                            No other active sessions found.
                        </p>
                    )}
                </div>
            </div>

            <div className="h-0.5 bg-black/10 rounded-full"></div>

            <div>
                <h2 className="text-xl font-gulfs mb-4 flex items-center gap-2 text-black">
                    <UserX className="text-red-600" /> BLOCKED USERS
                </h2>

                <div className="relative mb-6">
                    <div
                        className={`flex items-center gap-3 p-4 bg-white border-2 border-black rounded-[20px] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${searchQuery.length >= 2 ? "ring-2 ring-pink-500" : ""}`}
                    >
                        <Search
                            size={22}
                            className="text-gray-400"
                            strokeWidth={2.5}
                        />
                        <input
                            type="text"
                            placeholder="SEARCH USER TO BLOCK..."
                            className="flex-1 border-none focus:ring-0 p-0 text-sm font-black uppercase tracking-wider placeholder:text-gray-300 outline-none"
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                        {searchQuery && (
                            <button
                                onClick={clearSearch}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={18} className="text-gray-400" />
                            </button>
                        )}
                    </div>

                    {/* Search Results Dropdown */}
                    {searchQuery.length >= 2 && (
                        <div className="absolute z-20 w-full mt-3 bg-white border-2 border-black rounded-[25px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                            {searching ? (
                                <div className="p-8 text-center">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-black border-t-transparent"></div>
                                    <p className="text-xs font-bold uppercase text-gray-400 mt-2">
                                        Searching...
                                    </p>
                                </div>
                            ) : filteredSearchResults.length > 0 ? (
                                filteredSearchResults.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between p-4 hover:bg-pink-50 border-b-2 border-black last:border-none transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={
                                                    user.avatar_url ||
                                                    "/default-avatar.png"
                                                }
                                                className="w-11 h-11 rounded-[15px] border-2 border-black object-cover shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                alt={user.name}
                                                onError={(e) => {
                                                    e.target.src =
                                                        "/default-avatar.png";
                                                }}
                                            />
                                            <div>
                                                <p className="font-black text-sm uppercase">
                                                    {user.name}
                                                </p>
                                                <p className="text-xs text-gray-500 font-bold">
                                                    @{user.username}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => blockUser(user.id)}
                                            className="bg-black text-white px-5 py-2 rounded-xl text-xs font-black uppercase hover:bg-red-600 transition-all shadow-[3px_3px_0px_0px_rgba(255,142,37,1)] active:translate-y-0.5 active:shadow-none"
                                        >
                                            Block
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center">
                                    <UserMinus
                                        className="mx-auto text-gray-300 mb-2"
                                        size={32}
                                    />
                                    <p className="text-gray-400 font-bold uppercase text-sm">
                                        No users found
                                    </p>
                                    <p className="text-gray-300 text-xs mt-1">
                                        Try a different username
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {blockedUsers.length > 0 ? (
                        blockedUsers.map((block) => (
                            <div
                                key={block.id}
                                className="flex items-center justify-between p-4 bg-white border-2 border-black rounded-[20px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <div className="flex items-center gap-4">
                                    <img
                                        src={
                                            block.avatar_url ||
                                            "/default-avatar.png"
                                        }
                                        className="w-12 h-12 rounded-[15px] border-2 border-black object-cover shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                        alt={block.name}
                                        onError={(e) => {
                                            e.target.src =
                                                "/default-avatar.png";
                                        }}
                                    />
                                    <div>
                                        <p className="font-black text-gray-900 uppercase">
                                            {block.name}
                                        </p>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-tight">
                                            @{block.username} • BLOCKED{" "}
                                            {block.blocked_at}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => unblockUser(block.id)}
                                    className="bg-white border-2 border-black text-black px-5 py-2 rounded-xl text-xs font-black uppercase hover:bg-gray-100 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none"
                                >
                                    Unblock
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 bg-gray-50 border-2 border-dashed border-gray-300 rounded-[30px]">
                            <UserX
                                className="mx-auto text-gray-300 mb-2"
                                size={40}
                            />
                            <p className="text-gray-400 font-bold uppercase text-sm">
                                No blocked users yet
                            </p>
                            <p className="text-gray-300 text-xs mt-1">
                                Search and block users above
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
