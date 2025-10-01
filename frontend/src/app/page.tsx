import HeroSection from "@/components/landing-page/hero-section";
import Header from "@/components/landing-page/header";
import KeyFeatures from "@/components/landing-page/key-features";
import HowItWorks from "@/components/landing-page/how-it-works";
import Footer from "@/components/landing-page/footer";

const page = () => {
  return (
    <div>
      <Header />
      <HeroSection />
      <KeyFeatures />
      <HowItWorks />
      <Footer />
    </div>
  );
};

export default page;
