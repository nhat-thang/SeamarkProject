import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext";
import { ProtectedRoute } from "./lib/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/StudentDashboard";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminHome from "./pages/admin/AdminHome";
import TeachersPage from "./pages/admin/TeachersPage";
import TeacherSchedulePage from "./pages/admin/TeacherSchedulePage";
import CoursesPage from "./pages/admin/CoursesPage";
import ClassSectionsPage from "./pages/admin/ClassSectionsPage";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminHome />} />
            <Route path="teachers" element={<TeachersPage />} />
            <Route path="teachers/:teacherId" element={<TeacherSchedulePage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="classes" element={<ClassSectionsPage />} />
          </Route>
          <Route
            path="/student"
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
