import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Product } from './pages/Product';
import { Blog } from './pages/Blog';
import { Contact } from './pages/Contact';
import { NotFound } from './pages/NotFound';
import { RequireAuth } from './components/RequireAuth';
import { RequireAdmin } from './components/RequireAdmin';
import { Login } from './pages/app/Login';
import { Signup } from './pages/app/Signup';
import { AppLayout } from './pages/app/AppLayout';
import { Feed } from './pages/app/Feed';
import { Explore } from './pages/app/Explore';
import { CreatePost } from './pages/app/CreatePost';
import { Profile } from './pages/app/Profile';
import { PostDetail } from './pages/app/PostDetail';
import { Messages } from './pages/app/Messages';
import { Thread } from './pages/app/Thread';
import { AdminLayout } from './pages/admin/AdminLayout';
import { Overview } from './pages/admin/Overview';
import { Users } from './pages/admin/Users';
import { Activity } from './pages/admin/Activity';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/product" element={<Product />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="/app/login" element={<Login />} />
      <Route path="/app/signup" element={<Signup />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Feed />} />
        <Route path="explore" element={<Explore />} />
        <Route path="create" element={<CreatePost />} />
        <Route path="profile" element={<Profile />} />
        <Route path="u/:id" element={<Profile />} />
        <Route path="p/:id" element={<PostDetail />} />
        <Route path="messages" element={<Messages />} />
        <Route path="messages/:id" element={<Thread />} />
      </Route>

      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Overview />} />
        <Route path="users" element={<Users />} />
        <Route path="activity" element={<Activity />} />
      </Route>
    </Routes>
  );
}

export default App;
