import "./globals.css";

export const metadata = {
  title: "MediCare — Online Pharmacy & Delivery",
  description:
    "Order medicines online with fast delivery. Browse our catalog, track your orders, and manage prescriptions with MediCare.",
  keywords: "online pharmacy, medicine delivery, buy medicines online, MediCare",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
