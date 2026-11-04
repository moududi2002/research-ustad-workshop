'use client';

import Image from 'next/image';

export default function PayFooter() { 
    return ( 
    <footer className="w-full border-t border-slate-100 bg-white py-6"> 
    <div className="container-custom mx-auto px-4"> 
        <div className="flex flex-col items-center gap-3"> 
            <p className="text-xs font-medium text-slate-500"> Secure Payment Powered By </p>

            <div className="relative w-full max-w-3xl overflow-hidden">
            <Image
            src="/images/paystation-banner.png"
            alt="PayStation Secure Payment"
            width={1200}
            height={50}
            className="h-auto w-full object-contain"
            priority={false}
            />
      </div>
    </div>
  </div>
</footer>


); }