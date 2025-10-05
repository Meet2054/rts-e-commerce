
import HeroSection from '../components/home/Hero';
import Welcom from '../components/home/Welcom';
import PreviousOrder from '../components/home/PreviousOrder';
import BestSelling from '../components/home/BestSelling';
import Categories from '../components/home/Categories';
import Partners from '@/components/home/Partners';

export default function HomePage() {
  return (
    <div className='space-y-10'>
      <HeroSection />
      <Welcom />
      <Partners />
      <PreviousOrder />
      <BestSelling />
      <Categories />
    </div>
  );
}
