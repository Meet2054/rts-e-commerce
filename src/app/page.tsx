
import HeroSection from '../components/home/Hero';
import Welcom from '../components/home/Welcom';
import PreviousOrder from '../components/home/PreviousOrder';
import BestSelling from '../components/home/BestSelling';
import Categories from '../components/home/Categories';

export default function HomePage() {
  return (
    <div className='space-y-3 bg-[#F1F2F4]'>
      <HeroSection />
      <Welcom />
      <PreviousOrder />
      <BestSelling />
      <Categories />
    </div>
  );
}
