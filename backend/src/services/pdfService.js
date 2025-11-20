import puppeteer from 'puppeteer';
import { generatePdfHtml } from '../templates/tourPdfTemplate.js';
import {
  generateFullRouteMapUrl,
  generateSegmentMapUrl,
  generateElevationChartUrl,
  fetchStaticMapAsBase64
} from './staticMapService.js';
import {
  generateTourQRCode,
  generateSegmentQRCode
} from '../utils/qrCodeGenerator.js';

/**
 * Generate a PDF tour guide from tour data
 */
export async function generateTourPdf(tour) {
  let browser = null;

  try {
    console.log('Starting PDF generation...');

    // Step 1: Generate all image URLs and QR codes
    console.log('Generating static maps and QR codes...');

    const { places, route } = tour;

    // Generate full route map URL
    const fullMapUrl = generateFullRouteMapUrl(places, route, {
      width: 800,
      height: 600
    });

    // Generate elevation chart URL if elevation data exists
    const elevationChartUrl = route?.elevation?.gain > 0
      ? generateElevationChartUrl(route, places, { width: 800, height: 200 })
      : null;

    // Generate QR code for full tour (Google Maps)
    const tourQRCode = await generateTourQRCode(places, { width: 150 });

    // Generate segment maps and QR codes for each leg
    const segmentMaps = [];
    const segmentQRCodes = [];

    if (route?.legs) {
      for (let i = 0; i < route.legs.length; i++) {
        const leg = route.legs[i];
        const fromPlace = places[i];
        const toPlace = places[i + 1];

        // Generate segment map URL
        const segmentMapUrl = generateSegmentMapUrl(fromPlace, toPlace, leg, {
          width: 600,
          height: 400
        });
        segmentMaps.push(segmentMapUrl);

        // Generate QR code for this segment
        const qrCode = await generateSegmentQRCode(fromPlace, toPlace, { width: 120 });
        segmentQRCodes.push(qrCode);
      }
    }

    console.log(`Generated ${segmentMaps.length} segment maps and ${segmentQRCodes.length} QR codes`);

    // Step 2: Generate HTML with all images
    const images = {
      fullMapUrl,
      elevationChartUrl,
      tourQRCode,
      segmentMaps,
      segmentQRCodes
    };

    const html = generatePdfHtml(tour, images);

    // Step 3: Launch Puppeteer and generate PDF
    console.log('Launching Puppeteer...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set content and wait for images to load
    console.log('Rendering HTML...');
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF
    console.log('Generating PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1.5cm',
        right: '1.5cm',
        bottom: '1.5cm',
        left: '1.5cm'
      }
    });

    await browser.close();
    console.log('PDF generation complete!');

    return pdfBuffer;

  } catch (error) {
    console.error('Error generating PDF:', error);
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

/**
 * Generate filename for tour PDF
 */
export function generatePdfFilename(tour) {
  const title = tour.title
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 50);

  const date = new Date().toISOString().split('T')[0];

  return `${title}-${date}.pdf`;
}
