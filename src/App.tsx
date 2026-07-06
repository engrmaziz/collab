import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Login } from "@/pages/Login";
import { Signup } from "@/pages/Signup";
import { Dashboard } from "@/pages/Dashboard";
import { DocumentPage } from "@/pages/DocumentPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function App() {
  // Check user's theme preference on initial load
  useEffect(() => {
    const isDark = 
      localStorage.getItem("theme") === "dark" || 
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doc/:id"
        element={
          <ProtectedRoute>
            <DocumentPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}