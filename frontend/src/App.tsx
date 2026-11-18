import { Route, Routes } from 'react-router-dom';
import { GuestOnly, RequireRole } from './auth/Guards';
import { AppShell, adminNav, studentNav, teacherNav } from './layouts/AppShell';
import LoginPage from './pages/LoginPage';
import AdminAuditPage from './pages/admin/AdminAuditPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminGroupsPage from './pages/admin/AdminGroupsPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminRoomsPage from './pages/admin/AdminRoomsPage';
import AdminStudentsPage from './pages/admin/AdminStudentsPage';
import AdminTeachersPage from './pages/admin/AdminTeachersPage';
import ProfilePage from './pages/shared/ProfilePage';
import SettingsPage from './pages/shared/SettingsPage';
import AnalyticsPage from './pages/student/AnalyticsPage';
import CalendarPage from './pages/student/CalendarPage';
import CareerPage from './pages/student/CareerPage';
import DashboardPage from './pages/student/DashboardPage';
import GroupsPage from './pages/student/GroupsPage';
import GuidesPage from './pages/student/GuidesPage';
import LeaderboardPage from './pages/student/LeaderboardPage';
import LessonDetailPage from './pages/student/LessonDetailPage';
import LessonsPage from './pages/student/LessonsPage';
import PaymentsPage from './pages/student/PaymentsPage';
import NewLessonPage from './pages/teacher/NewLessonPage';
import TeacherDashboardPage from './pages/teacher/TeacherDashboardPage';
import TeacherExamPage from './pages/teacher/TeacherExamPage';
import TeacherGroupsPage from './pages/teacher/TeacherGroupsPage';
import TeacherJournalPage from './pages/teacher/TeacherJournalPage';
import TeacherLessonPage from './pages/teacher/TeacherLessonPage';
import TeacherLessonsPage from './pages/teacher/TeacherLessonsPage';
import TeacherReviewPage from './pages/teacher/TeacherReviewPage';
import { Navigate } from 'react-router-dom';

export default function App() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<RequireRole role="STUDENT" />}>
        <Route element={<AppShell items={studentNav} />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/lessons" element={<LessonsPage />} />
          <Route path="/lessons/:id" element={<LessonDetailPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/career" element={<CareerPage />} />
          <Route path="/guides" element={<GuidesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<RequireRole role="TEACHER" />}>
        <Route element={<AppShell items={teacherNav} />}>
          <Route path="/teacher" element={<TeacherDashboardPage />} />
          <Route path="/teacher/groups" element={<TeacherGroupsPage />} />
          <Route path="/teacher/lessons" element={<TeacherLessonsPage />} />
          <Route path="/teacher/lessons/new" element={<NewLessonPage />} />
          <Route path="/teacher/lessons/:id" element={<TeacherLessonPage />} />
          <Route path="/teacher/exams/:id" element={<TeacherExamPage />} />
          <Route path="/teacher/journal" element={<TeacherJournalPage />} />
          <Route path="/teacher/review" element={<TeacherReviewPage />} />
          <Route path="/teacher/profile" element={<ProfilePage />} />
          <Route path="/teacher/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<RequireRole role="ADMIN" />}>
        <Route element={<AppShell items={adminNav} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/students" element={<AdminStudentsPage />} />
          <Route path="/admin/teachers" element={<AdminTeachersPage />} />
          <Route path="/admin/groups" element={<AdminGroupsPage />} />
          <Route path="/admin/rooms" element={<AdminRoomsPage />} />
          <Route path="/admin/payments" element={<AdminPaymentsPage />} />
          <Route path="/admin/audit" element={<AdminAuditPage />} />
          <Route path="/admin/profile" element={<ProfilePage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
