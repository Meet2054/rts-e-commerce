import Header from '@/app/components/Header';
import ProductHeader from './components/ProductHeader';
import HeroSection from './components/Hero';
import Welcom from './components/Welcom';
import PreviousOrder from './components/PreviousOrder';
import BestSelling from './components/BestSelling';
import Categories from './components/Categories';
import Footer from './components/Footer';

export default function HomePage() {
  return (
    <div className='space-y-3 bg-[#F1F2F4]'>
      <Header />
      <ProductHeader />
      <HeroSection />
      <Welcom />
      <PreviousOrder />
      <BestSelling />
      <Categories />
      <Footer />
    </div>
  );
}
