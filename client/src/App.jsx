import React, { useEffect, useState, useCallback } from "react";
import ExecutiveDashboard from "./ExecutiveDashboard";
import SupervisorDashboard from "./SupervisorDashboard";
import AnalyticsDashboard from "./AnalyticsDashboard";
import AdminTrainingDashboard from "./AdminTrainingDashboard";
import RfidLifecycleView from "./RfidLifecycleView";
import CustomerSimulator from "./CustomerSimulator";
import PassengerPortal from "./PassengerPortal";
import LoginGate from "./LoginGate";
import LandingPage from "./LandingPage";

const SESSION_KEY = "srlms_session";

/**
 * Hash-based routing (no react-router dependency needed):
 *   #/            -> Landing page (no login) if signed out, else role-based dashboard
 *   #/staff-login -> Staff login (executive/supervisor/admin), routes by role after sign-in
 *   #/customer    -> Customer call simulator (public, guest — no account)
 *   #/passenger   -> Passenger self-service portal (login/signup)
 *   #/supervisor  -> Supervisor Dashboard (login required, supervisor/admin role)
 *   #/analytics   -> Analytics Dashboard (login required, any role)
 */
export default function App() {
  const [session, setSession] = useState(null); // { token, user }
  const [hash, setHash] = useState(window.location.hash);

  // restore session on load
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try { setSession(JSON.parse(saved)); } catch { /* ignore corrupt value */ }
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const handleLogin = useCallback((newSession) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    setSession(newSession);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  // --- public routes, no login needed ---
  if (hash.startsWith("#/customer")) return <CustomerSimulator />;
  if (hash.startsWith("#/passenger")) return <PassengerPortal />;

  // --- everything below requires login ---
  if (!session) {
    if (hash.startsWith("#/staff-login")) return <LoginGate onLoggedIn={handleLogin} />;
    return <LandingPage />;
  }

  const role = session.user?.role;

  if (hash.startsWith("#/supervisor")) {
    if (role !== "supervisor" && role !== "admin") {
      return <AccessDenied message="This view is for supervisors and admins." onLogout={handleLogout} />;
    }
    return <SupervisorDashboard user={session.user} token={session.token} onLogout={handleLogout} />;
  }

  if (hash.startsWith("#/analytics")) {
    return <AnalyticsDashboard token={session.token} onLogout={handleLogout} />;
  }

  if (hash.startsWith("#/rfid")) {
    return <RfidLifecycleView token={session.token} onLogout={handleLogout} />;
  }

  if (hash.startsWith("#/admin")) {
    if (role !== "admin") {
      return <AccessDenied message="This view is for admins." onLogout={handleLogout} />;
    }
    return <AdminTrainingDashboard user={session.user} token={session.token} onLogout={handleLogout} />;
  }

  // default route: role-based landing
  if (role === "supervisor") return <SupervisorDashboard user={session.user} token={session.token} onLogout={handleLogout} />;
  if (role === "admin") return <AdminTrainingDashboard user={session.user} token={session.token} onLogout={handleLogout} />;
  return <ExecutiveDashboard user={session.user} token={session.token} onLogout={handleLogout} />;
}

function AccessDenied({ message, onLogout }) {
  return (
    <div className="min-h-screen bg-[#0B1120] text-[#E7ECF6] flex flex-col items-center justify-center gap-3" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="text-sm text-[#E5484D]">Access denied</div>
      <div className="text-xs text-[#6B7A99]">{message}</div>
      <button onClick={onLogout} className="mt-2 text-xs text-[#6BA9DE] underline">Log out</button>
    </div>
  );
}
