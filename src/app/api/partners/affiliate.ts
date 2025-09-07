// src/app/api/partners/affiliate.ts

// Replace placeholders with your real affiliate IDs or query params
const FLIGHT_PARTNER = "YOUR_FLIGHT_PARTNER_ID";
const HOTEL_PARTNER  = "YOUR_HOTEL_PARTNER_ID";
const ACTIVITY_PARTNER = "YOUR_ACTIVITY_PARTNER_ID";

export function buildFlightUrl({ carrierCode, flightNumber, origin, destination, price }: any) {
  // Example: deep link to your OTA with tags
  return `https://partner.example.com/flight?carrier=${carrierCode}&flight=${flightNumber}&from=${origin}&to=${destination}&price=${price}&affid=${FLIGHT_PARTNER}`;
}

export function buildHotelUrl({ hotelId, name, cityCode, price }: any) {
  return `https://partner.example.com/hotel?hotelId=${hotelId}&city=${cityCode}&price=${price}&affid=${HOTEL_PARTNER}`;
}

export function buildActivityUrl({ activityId, city, price }: any) {
  return `https://partner.example.com/activity?id=${activityId}&city=${city}&price=${price}&affid=${ACTIVITY_PARTNER}`;
}
