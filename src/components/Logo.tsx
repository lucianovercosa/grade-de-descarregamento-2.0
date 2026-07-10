import React from 'react';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <img src="https://asanet.com.br/asa/wp-content/themes/asa-frmnt/res/img/assets/logo.svg" alt="ASA Logo" className="h-10 w-auto object-contain object-left" style={{ objectPosition: 'left' }} />
      <div className="text-[11px] font-black tracking-widest text-white uppercase leading-tight drop-shadow-md">
        GRADE DE<br />
        DESCARREGAMENTO<br />
        ALMOXARIFADO ASA<br />
        RECIFE
      </div>
    </div>
  );
}
