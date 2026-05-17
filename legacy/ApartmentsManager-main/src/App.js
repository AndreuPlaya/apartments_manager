import { Routes, Route } from 'react-router-dom'
import { lazy } from 'react';
import Layout from './components/Layout'
import { ROLES } from './config/roles'
import useTitle from './hooks/useTitle';

const Home = lazy(() => import('./features/home/Home'));
const About = lazy(() => import('./features/about/About'));
const ContactUs = lazy(() => import('./features/contact-us/ContactUs'));
const PrivacyPolicy = lazy(() => import('./features/privacy-policy/PrivacyPolicy'));
const LegalNotice = lazy(() => import('./features/legal-notice/LegalNotice'));
const Rooms = lazy(() => import('./features/rooms/Rooms'));
const Activities = lazy(() => import('./features/activities/Activities'));
const Login = lazy(() => import('./features/auth/Login'));
const Register = lazy(() => import('./features/auth/Register'));
const Dashboard = lazy(() => import('./features/dashboard/Dashboard'));
const UsersList = lazy(() => import('./features/users/UsersList'));
const EditUser = lazy(() => import('./features/users/EditUser'));
const NewUserForm = lazy(() => import('./features/users/NewUserForm'));
const ApartmentsList = lazy(() => import('./features/apartments/ApartmentsList'));
const EditApartment = lazy(() => import('./features/apartments/EditApartment'));
const NewApartment = lazy(() => import('./features/apartments/NewApartmentForm'));
const BookingsList = lazy(() => import('./features/bookings/BookingsList'));
const EditBooking = lazy(() => import('./features/bookings/EditBooking'));
const NewBooking = lazy(() => import('./features/bookings/NewBooking'));
const ChannelsList = lazy(() => import('./features/channels/ChannelsList'));
const EditChannel = lazy(() => import('./features/channels/EditChannel'));
const NewChannel = lazy(() => import('./features/channels/NewChannelForm'));
const ClientsList = lazy(() => import('./features/clients/ClientsList'));
const EditClient = lazy(() => import('./features/clients/EditClient'));
const NewClient = lazy(() => import('./features/clients/NewClientForm'));
const KpisView = lazy(() => import('./features/management/kpiView'));
const PropertiesList = lazy(() => import('./features/properties/PropertiesList'));
const EditProperty = lazy(() => import('./features/properties/EditProperty'));
const NewProperty = lazy(() => import('./features/properties/NewPropertyForm'));
const ContractsList = lazy(() => import('./features/contracts/ContractsList'));
const EditContract = lazy(() => import('./features/contracts/EditContract'));
const NewContract = lazy(() => import('./features/contracts/NewContract'));
const Prefetch = lazy(() => import('./features/auth/Prefetch'));
const PersistLogin = lazy(() => import('./features/auth/PersistLogin'));
const RequireAuth = lazy(() => import('./features/auth/RequireAuth'));
const Calendar = lazy(() => import('./features/bookings/Calendar'));

function App() {
  useTitle('')
  return (
    <Routes>
      <Route element={<PersistLogin />}>
        <Route path="/" element={<Layout />}>
          {/* public routes */}
          <Route index element={<Home />} />
          <Route path="activities" element={<Activities />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="about" element={<About />} />
          <Route path="contact-us" element={<ContactUs />} />
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="legal-notice" element={<LegalNotice />} />
          <Route path="rooms" element={<Rooms />} />

          {/* Protected Routes */}
          <Route element={<RequireAuth allowedRoles={[...Object.values(ROLES)]} />}>
            <Route element={<Prefetch />}>

              <Route path="private/dashboard" element={<Dashboard />} />

              <Route element={<RequireAuth allowedRoles={[ROLES.Admin]} />}>
                <Route path="private/users">
                  <Route index element={<UsersList />} />
                  <Route path=":id" element={<EditUser />} />
                  <Route path="new" element={<NewUserForm />} />
                </Route>
              </Route>

              <Route element={<RequireAuth allowedRoles={[ROLES.Manager]} />}>
                <Route path="private/apartments">
                  <Route index element={<ApartmentsList />} />
                  <Route path=":id" element={<EditApartment />} />
                  <Route path="new" element={<NewApartment />} />
                </Route>


                <Route path="private/channels">
                  <Route index element={<ChannelsList />} />
                  <Route path=":id" element={<EditChannel />} />
                  <Route path="new" element={<NewChannel />} />
                </Route>
                <Route path="private/kpis">
                  <Route index element={<KpisView />} />
                </Route>

              </Route>

              <Route element={<RequireAuth allowedRoles={[ROLES.Manager, ROLES.Host]} />}>
                <Route path="private/calendar" index element={<Calendar />} />

                <Route path="private/bookings">
                  <Route index element={<BookingsList />} />
                  <Route path=":id" element={<EditBooking />} />
                  <Route path="new" element={<NewBooking />} />
                </Route>

                <Route path="private/clients">
                  <Route index element={<ClientsList />} />
                  <Route path=":id" element={<EditClient />} />
                  <Route path="new" element={<NewClient />} />
                </Route>
              </Route>
            </Route>
          </Route>
        </Route>
      </Route>
    </Routes >
  );
}

export default App;