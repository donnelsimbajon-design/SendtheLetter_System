import { Outlet } from 'react-router-dom';
import DashboardHeader from './DashboardHeader';

const DashboardLayout = () => {
    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <main className="pt-20 px-4 md:px-8 max-w-[1920px] mx-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
