import React from 'react';

export default function BackgroundLayer() {
  return (
    <div 
      className="fixed top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat -z-50"
      style={{ backgroundImage: "url('/Rts-Bg.png')" }}
    />
  );
}
