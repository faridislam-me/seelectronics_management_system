import { contactDetails } from "@/constants";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Delete your account | SE Electronics" };

export default function DeleteAccountPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 text-[15px] leading-relaxed text-gray-800">
      <h1 className="text-2xl font-extrabold text-[#0b3d91]">Delete your account and data</h1>
      <p className="mt-1 text-sm text-gray-500">SE Customer · SE Technician · SE Electrician · SE Seller · SE Supplier</p>
      <h2 className="mt-6 text-lg font-bold text-[#16213a]">How to request deletion</h2>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5">
        <li>
          Call {contactDetails.customerCare} or WhatsApp {contactDetails.whatsApp}, or email {contactDetails.email} from the phone number registered on your account.
        </li>
        <li>Tell us your ID (customer, staff, seller or supplier ID) and that you want your account deleted.</li>
        <li>We verify that the request is from the account owner and delete the account within 30 days.</li>
      </ol>
      <h2 className="mt-6 text-lg font-bold text-[#16213a]">What is deleted and what is kept</h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-5">
        <li>Deleted: your login, profile details, saved location, uploaded photos and push notification tokens.</li>
        <li>
          Kept where we must: invoice, payment and warranty records needed for accounting and legal reasons, in a form that is no longer used to contact you. A product whose warranty is still running loses its warranty claim once the account is deleted.
        </li>
      </ul>
      <p className="mt-6 text-sm text-gray-500">See also our <a className="text-[#1f7cf0] underline" href="/privacy-policy">Privacy Policy</a>.</p>
    </main>
  );
}
