'use client';

import React from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

type Props = {
  children: React.ReactNode;
};

export default function MapProvider({ children }: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'], 
  });

  if (!isLoaded) return <div>Loading Map...</div>;

  return <>{children}</>;
}
