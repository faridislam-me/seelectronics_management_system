"use client";
import Image from "next/image";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

import img1 from "../../assets/images/banner1.jpg";
import img2 from "../../assets/images/banner2.jpg";
import img3 from "../../assets/images/banner3.jpg";

interface BannerProps {
  slides?: { img: string | any; url?: string }[];
  /** Tailwind aspect classes for each slide (default keeps the original height). */
  aspectClass?: string;
  /** "fill" stretches (original); "cover" crops to keep proportions when the box is shorter. */
  fit?: "fill" | "cover";
}

const Banner = ({ slides: propSlides, aspectClass = "aspect-[16/6] sm:aspect-[16/5] md:aspect-[16/4]", fit = "fill" }: BannerProps) => {
  const defaultSlides = [
    { img: img1 },
    { img: img2 },
    { img: img3 },
  ];

  const slides = propSlides !== undefined ? propSlides : defaultSlides;

  if (slides.length === 0) {
    return null;
  }

  return (
    <section className="relative rounded-sm overflow-hidden">
      <Carousel
        infiniteLoop
        autoPlay
        interval={5000}
        transitionTime={500}
        showIndicators={false} 
        showStatus={false}
        showThumbs={false}
        swipeable
        emulateTouch
        showArrows={false}
        stopOnHover
      >
        {slides.map((slide, index) => (
          <div key={index} className={`relative w-full ${aspectClass}`}>
            <Image
              src={slide.img}
              alt={`Slide ${index + 1}`}
              fill
              priority={index === 0}
              sizes="100vw"
              className={`${fit === "cover" ? "object-cover" : "object-fill"} rounded-md`}
              unoptimized={typeof slide.img === 'string'}
            />
          </div>
        ))}
      </Carousel>
    </section>
  );
};

export default Banner;