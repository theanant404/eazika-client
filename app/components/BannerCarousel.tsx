"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

export function BannerCarousel() {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay()]);

  const banners = [
    {
      id: 1,
      color: "bg-blue-500",
      title: "Summer Sale",
      subtitle: "Up to 50% Off",
    },
    {
      id: 2,
      color: "bg-purple-500",
      title: "New Arrivals",
      subtitle: "Check out the latest tech",
    },
    {
      id: 3,
      color: "bg-orange-500",
      title: "Free Delivery",
      subtitle: "On orders over ₹50",
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl shadow-lg" ref={emblaRef}>
      <div className="flex">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="flex-[0_0_100%] min-w-0 relative h-40 md:h-56"
          >
            <div
              className={`w-full h-full ${banner.color} flex flex-col justify-center items-start px-8`}
            >
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">
                {banner.title}
              </h2>
              <p className="text-white/90 text-sm md:text-lg">
                {banner.subtitle}
              </p>
              <button className="mt-4 px-4 py-2 bg-white text-gray-900 rounded-full text-xs font-bold uppercase tracking-wide hover:bg-opacity-90 transition-opacity">
                Shop Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
