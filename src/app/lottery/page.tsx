import LotteryForm from "./LotteryForm";

export const metadata = {
  title: "SE Electronics লটারি",
  description: "স্ক্র্যাচ কার্ডের নম্বর দিয়ে লটারিতে অংশ নিন",
};

export const dynamic = "force-dynamic";

export default function LotteryPage() {
  return <LotteryForm />;
}
