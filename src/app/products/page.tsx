import Header from '@/app/components/Header';
import Footer from '../components/Footer';
import ProductHeader from '../components/ProductHeader';
import SubFooter from '../components/SubFooter';
import ProductListWithCart from './components/product-list';


export default function ProductPage() {
  return (
    <div className='space-y-3 bg-[#F1F2F4]'>
      <Header />
      <ProductHeader />
      <ProductListWithCart />
      <SubFooter />
      <Footer />
    </div>
  );
}
