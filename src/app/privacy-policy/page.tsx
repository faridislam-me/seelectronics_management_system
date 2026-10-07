import { contactDetails } from "@/constants";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy | SE Electronics" };

const sections: { title: string; body: string[] }[] = [
  {
    title: "Who we are",
    body: [
      "SE Electronics (Sylhet, Bangladesh) provides sales, service and installation of IPS, battery and stabilizer products. This policy covers the SE Customer, SE Technician, SE Electrician, SE Seller and SE Supplier mobile apps and the websites they open (seelectronicsbd.com).",
    ],
  },
  {
    title: "Information we collect",
    body: [
      "Account details you or our office enter: name, mobile number, address, shop name (sellers and suppliers), customer / staff / seller ID.",
      "Purchase, warranty, invoice, payment, service and installation records that belong to your account.",
      "Location: customers can share a map pin of their address for a service visit. Technicians and electricians share their live location while a service job is active so the customer can track the visit. Location is not collected for other purposes.",
      "Photos and files you choose to attach (for example a product photo, a service report photo or a signature). The apps ask for camera or file access only when you use these features.",
      "Device information needed for notifications: a push notification token (Firebase Cloud Messaging) linked to your account.",
    ],
  },
  {
    title: "How we use it",
    body: [
      "To run your account: warranty checks, invoices, service requests and tracking, installation, payments, notices and support.",
      "To send you service notifications and SMS about your own orders and visits.",
      "To keep the system secure and to prevent misuse.",
    ],
  },
  {
    title: "Sharing",
    body: [
      "We do not sell your personal information and we do not show ads.",
      "Your details are visible to SE Electronics staff who need them to serve you. When a technician is assigned to your service, the technician sees your name, phone, address and product. A customer sees the assigned technician's name, phone and live position during the visit.",
      "Service providers that process data for us: cloud hosting and database (Vercel, Neon), file storage, Google Firebase (notifications), and an SMS gateway. They process data only on our behalf.",
      "We disclose information if the law requires it.",
    ],
  },
  {
    title: "Security and retention",
    body: [
      "Data is sent over HTTPS and stored in access-controlled databases. Passwords are stored hashed.",
      "We keep account and warranty records for as long as the warranty and service relationship exists, and as needed for accounting and legal reasons. Live location of staff is only kept as part of the service record.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "You can ask to see, correct or delete your data, or delete your account, at any time. See the account deletion page: /delete-account.",
      "You can turn off notifications, location or camera permission in your phone settings; the related feature will stop working.",
    ],
  },
  {
    title: "Children",
    body: ["The apps are not directed to children under 13 and we do not knowingly collect their data."],
  },
  {
    title: "Changes",
    body: ["We may update this policy. The latest version is always on this page."],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 text-[15px] leading-relaxed text-gray-800">
      <h1 className="text-2xl font-extrabold text-[#0b3d91]">Privacy Policy</h1>
      <p className="mt-1 text-sm text-gray-500">SE Electronics apps · Last updated: October 2026</p>
      {sections.map((s) => (
        <section key={s.title} className="mt-6">
          <h2 className="text-lg font-bold text-[#16213a]">{s.title}</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            {s.body.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>
      ))}
      <section className="mt-6">
        <h2 className="text-lg font-bold text-[#16213a]">Contact</h2>
        <p className="mt-2">
          SE Electronics, Badam Bagicha 2 No Road, Sylhet · Phone {contactDetails.customerCare} · Email {contactDetails.email}
        </p>
      </section>
    </main>
  );
}
