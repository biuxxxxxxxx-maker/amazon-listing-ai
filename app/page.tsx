import { UserMenu } from "@/components/auth/user-menu";
import { HomePageContent } from "@/components/landing/home-page-content";

export default function HomePage() {
  return (
    <>
      <div className="fixed right-5 top-5 z-50 sm:right-8 lg:right-10">
        <UserMenu />
      </div>
      <HomePageContent />
    </>
  );
}
