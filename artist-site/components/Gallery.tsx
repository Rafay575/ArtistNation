'use client';

import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation } from 'swiper/modules';
import { FaArrowLeftLong, FaArrowRight } from 'react-icons/fa6';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/effect-coverflow';

export default function GallerySection({ content }: { content: any }) {
    const {
        heading = 'Gallery',
        description = 'Music is the way to express your emotions and the thing you enjoyed most in life – it\'s one of the most important parts of our lives.',
        images = [],
    } = content;

    // If no images, show a placeholder
    const imageList = images.length > 0 ? images : ['/placeholder.png'];

    return (
        <section className="relative py-[50px] lg:py-[80px] bg-[#F6EDEE] max-w-full overflow-hidden">
            <div className="container relative z-2">
                <h2 className="text-center text-4xl md:text-5xl font-bold text-[#35235B]">
                    {heading}
                </h2>
                <p className="text-center text-gray-500 mt-4 w-full max-w-xl mx-auto">
                    {description}
                </p>
                <div className="relative max-w-6xl mx-auto py-10">
                    <Swiper
                        modules={[EffectCoverflow, Navigation]}
                        effect="coverflow"
                        centeredSlides
                        slidesPerView="auto"
                        loop
                        navigation={{
                            prevEl: '.custom-prev',
                            nextEl: '.custom-next',
                        }}
                        className="gallery-swiper"
                    >
                        {imageList.map((img: string, index: number) => (
                            <SwiperSlide key={index} className="!w-[70%]">
                                <Image
                                    src={img}
                                    alt={`Gallery ${index + 1}`}
                                    width={900}
                                    height={900}
                                    unoptimized={true}
                                    className="object-cover aspect-video w-full"
                                />
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    {/* Left Arrow */}
                    <button className="custom-prev absolute -left-5 md:left-6 top-1/2 z-20 -translate-y-1/2 w-9 h-9 lg:w-12 lg:h-12 rounded-full bg-[#4B2C7A] text-white flex items-center justify-center">
                        <FaArrowLeftLong size={22} />
                    </button>

                    {/* Right Arrow */}
                    <button className="custom-next absolute -right-5 md:right-6 top-1/2 z-20 -translate-y-1/2 w-9 h-9 lg:w-12 lg:h-12 rounded-full bg-[#4B2C7A] text-white flex items-center justify-center">
                        <FaArrowRight size={22} />
                    </button>
                </div>
            </div>

            <Image
                src="/overlay4.png"
                alt="overlay"
                width={300}
                height={400}
                className="w-[100px] absolute top-[30%] left-[85%] z-1"
            />
        </section>
    );
}