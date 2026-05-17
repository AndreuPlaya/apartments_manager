import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import SideMenu from "./SideMenu"
import Footer from "./Footer"
import CookieConsent from "./CookieConsent";
import { useCookies } from "react-cookie";

const Layout = () => {
    const [cookies] = useCookies(["cookieConsent"])
    return (
        <>
            <Navbar />
            <div className="outlet">
                <SideMenu />
                <Outlet />
            </div>
            <Footer />
            {!cookies.cookieConsent && <CookieConsent />}
        </>
    );
};

export default Layout;
