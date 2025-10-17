import { Outlet } from "react-router-dom";
import CommunitySidebar from "./CommunitySidebar";
import "../../css/community.css";

export default function CommunityLayout() {
    return (
        <div className="ss-community-layout">

            <CommunitySidebar />
            <main className="ss-community-main">
                <Outlet />
            </main>


        </div>
    );
}
