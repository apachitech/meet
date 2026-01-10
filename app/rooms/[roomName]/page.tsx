import * as React from 'react';
import { PageClientImpl } from './PageClientImpl';
import { isVideoCodec } from '@/lib/types';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ roomName: string }> }): Promise<Metadata> {
  const { roomName } = await params;
  
  // Optional: Fetch site name again if we want to be super explicit, 
  // but the template in RootLayout should handle the suffix if we just return a title.
  // However, since generateMetadata in root is async, let's just rely on the template if possible, 
  // OR fetch it here to be safe.
  
  return {
    title: decodeURIComponent(roomName),
    openGraph: {
        title: `Watch ${decodeURIComponent(roomName)} Live`,
    }
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ roomName: string }>;
  searchParams: Promise<{
    region?: string;
    hq?: string;
    codec?: string;
  }>;
}) {
  const _params = await params;
  const _searchParams = await searchParams;
  const codec =
    typeof _searchParams.codec === 'string' && isVideoCodec(_searchParams.codec)
      ? _searchParams.codec
      : 'vp9';
  const hq = _searchParams.hq === 'true' ? true : false;

  return (
    <PageClientImpl
      roomName={_params.roomName}
      region={_searchParams.region}
      hq={hq}
      codec={codec}
    />
  );
}
