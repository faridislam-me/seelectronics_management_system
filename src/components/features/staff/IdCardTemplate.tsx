import { contactDetails } from '@/constants';
import { formatDate } from '@/utils';

interface IdCardProps {
    data: {
        name: string;
        fatherName: string;
        staffId: string;
        phone: string;
        role: 'electrician' | 'technician',
        photoUrl: string,
        currentStreetAddress: string,
        currentDistrict: string,
        currentPoliceStation: string,
        currentPostOffice: string,
        frontBgImage: string,
        backBgImage: string,
        qrcode: string,
        barcode: string
        createdAt: Date;
        issueDate: Date
    };
}

export default function IdCardTemplate({ data, variant = "a4" }: IdCardProps & { variant?: "a4" | "preview" }) {
    // Front on top, back below (vertical stack) — both for the A4 PDF and the on-screen preview.
    return (
        <div className={variant === "a4" ? "relative w-[210mm] h-[297mm] mx-auto flex flex-col items-center gap-10 pt-10" : "relative mx-auto flex flex-col items-center gap-4"}>
            <div
                className="relative bg-white overflow-hidden border border-black"
                style={{
                    width: '3.5in',
                    height: '2.3in',
                    backgroundImage: `url(${data.frontBgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    fontFamily: `Inter, 'SolaimanLipi', sans-serif`
                }}
            >
                {/* Content overlay */}
                <div className="absolute inset-0">

                    {/* Photo box - left side */}
                    <div className='absolute text-center' style={{
                        left: '13px',
                        top: '55px',
                    }}>
                        <div
                            className="border-2 p-[1px] border-black bg-gray-200 overflow-hidden rounded-sm"
                            style={{
                                width: '70px',
                                height: '80px'
                            }}
                        >
                            <img
                                src={data.photoUrl}
                                alt="Photo"
                                className="w-full h-full object-cover object-top"
                            />
                        </div>
                        {/* Role text scaled down */}
                        <span className='text-[10px] mt-1 block font-bold'>
                            {data.role === 'electrician' ? 'ইলেকট্রিশিয়ান' : 'টেকনিশিয়ান'}
                        </span>
                    </div>

                    {/* Right side - Info section */}
                    <div
                        className="absolute"
                        style={{
                            left: '92px',
                            top: '55px',
                        }}
                    >
                        {/* Font scaled to ~10px */}
                        <div className="space-y-2 text-[12px] leading-none text-black">
                            <div className="flex items-center">
                                <span className="font-bold w-11">নাম</span>
                                <span className="mr-1">:</span>
                                <span className="font-semibold whitespace-nowrap">{data.name}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="font-bold w-11">পিতা</span>
                                <span className="mr-1">:</span>
                                <span className="font-semibold whitespace-nowrap">{data.fatherName}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="font-bold w-11">মোবাইল</span>
                                <span className="mr-1">:</span>
                                <span className="font-semibold">{data.phone}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="font-bold w-11">থানা</span>
                                <span className="mr-1">:</span>
                                <span className="font-semibold whitespace-nowrap">{data.currentPoliceStation}, {data.currentDistrict}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="font-semibold w-11">ID</span>
                                <span className="mr-1">:</span>
                                <span className="font-bold text-red-600">
                                    {data.role === 'electrician' ? 'ELE-' : 'TEC-'}{data.staffId}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <span className="font-semibold w-11">Joined</span>
                                <span className="mr-1">:</span>
                                <span className="font-semibold">{formatDate(data.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom address section */}
                    <div
                        className="absolute"
                        style={{
                            left: '10px',
                            right: '10px',
                            bottom: '12px'
                        }}
                    >
                        {/* Font scaled to ~8px to fit address lines */}
                        <p className="px-2 text-[10px] leading-[1.2] text-start font-bold">
                            <span>ঠিকানা :</span> {data.currentStreetAddress}, &nbsp;
                            <span>পোস্ট অফিস :</span> {data.currentPostOffice}, &nbsp;
                            <span>থানা :</span> {data.currentPoliceStation}, &nbsp;
                            <span>জেলা :</span> {data.currentDistrict} &nbsp;
                        </p>
                    </div>
                </div>
            </div>
            <div
                className="relative bg-white overflow-hidden border border-black"
                style={{
                    width: '3.5in',
                    height: '2.3in',
                    backgroundImage: `url(${data.backBgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    fontFamily: `Inter, 'SolaimanLipi', sans-serif`
                }}
            >
                {/* Content overlay */}
                <div className="absolute inset-0">

                    {/* QR Code - top right */}
                    <div
                        className="absolute flex items-start justify-center border-[1px] border-black rounded-[2px]"
                        style={{
                            width: '50px',
                            height: '50px',
                            right: '14px',
                            top: '60px'
                        }}
                    >
                        <img src={data.qrcode} alt="QR Code" className="w-full h-full object-cover object-center" />
                    </div>

                    {/* Birthplace section */}
                    <div
                        className="absolute flex justify-end text-[10px]"
                        style={{
                            right: '14px',
                            top: '113px'
                        }}
                    >
                        <span>জন্মস্থান</span>
                        <span className="mx-1">:</span>
                        <span>{data.currentDistrict}</span>
                    </div>

                    {/* Issue Date section */}
                    <div
                        className="absolute flex text-[10px]"
                        style={{
                            right: '14px',
                            bottom: '38px'
                        }}
                    >
                        <span className="">প্রদানের তারিখ</span>
                        <span className="mx-1">:</span>
                        <span className="font-semibold">{formatDate(data.issueDate)}</span>
                    </div>

                    {/* Barcode and Footer info at bottom */}
                    <div className="absolute flex items-center justify-center gap-2"
                        style={{
                            left: '12px',
                            right: '12px',
                            bottom: '8px',
                            height: '22px'
                        }}>

                        <div className="h-full">
                            <img src={data.barcode} alt="Barcode" className="h-full w-auto" />
                        </div>

                        <div className='flex flex-col text-[10px] leading-tight'>
                            <div className="flex">
                                <span className="font-bold w-12">ওয়েবসাইট</span>
                                <span className="mr-1">:</span>
                                <span className="font-semibold">{contactDetails.website}</span>
                            </div>
                            <div className="flex">
                                <span className="font-bold w-12">হেল্পলাইন</span>
                                <span className="mr-1">:</span>
                                <span className="font-semibold">{contactDetails.customerCare}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}