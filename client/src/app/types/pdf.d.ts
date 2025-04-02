import { jsPDF } from 'jspdf';

// Add missing types for jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
      pageCount: number;
    };
  }
} 