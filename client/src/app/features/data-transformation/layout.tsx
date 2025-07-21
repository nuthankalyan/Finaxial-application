import React from 'react';
import { metadata } from './metadata';

export { metadata };

export default function DataTransformationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
