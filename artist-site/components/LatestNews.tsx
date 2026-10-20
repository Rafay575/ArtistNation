'use client';

import Image from 'next/image';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import { useArtist } from '@/contexts/ArtistContext';

export default function NewsSection({ content }: { content: any }) {
    const { settings } = useArtist();
    const primaryColor = settings?.primary_color || '#5D2FDB';

    const {
        heading = 'Latest News',
        readMoreLink = '#',
        newsItems = [],
    } = content;

    return (
        <div className="relative py-[50px] lg:py-[80px]">
            <div className="container">
                <div className="flex justify-between">
                    <p className="text-4xl md:text-5xl font-bold leading-[100%] text-primary">
                        {heading}
                    </p>
                    {readMoreLink && (
                        <button
                            className="bg-transparent border border-primary text-primary hover:text-white hover:bg-primary hover:border-primary text-[17px] py-1 px-5 rounded-full duration-300 hidden md:block"
                            style={{
                                borderColor: primaryColor,
                                color: primaryColor,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = primaryColor;
                                e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = primaryColor;
                            }}
                        >
                            Read More
                        </button>
                    )}
                </div>
                <div className="mt-6 lg:mt-10">
                    <Carousel
                        opts={{
                            align: 'start',
                            loop: true,
                        }}
                        className="w-full"
                    >
                    <CarouselContent className="items-stretch">
    {newsItems.map((item: any, idx: number) => (
        <CarouselItem
            key={idx}
            className="basis-full md:basis-1/2 lg:basis-1/3 h-auto"
        >
            <div className="flex flex-col items-start gap-2 md:gap-4 h-full">
                <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden">
                    <Image
                        src={item.image || '/placeholder.png'}
                        alt={item.title}
                        fill
                        unoptimized={true}
                        className="object-cover"
                    />
                </div>
                <p className="text-2xl font-bold text-primary line-clamp-2">
                    {item.title}
                </p>
                <p className="line-clamp-3 flex-1">{item.description}</p>
                {item.link && (
                    <span
                        className="border-b-2 border-primary text-primary leading-[100%] mb-2 font-semibold cursor-pointer"
                        style={{ borderColor: primaryColor, color: primaryColor }}
                        onClick={() => window.location.href = item.link}
                    >
                        Read More
                    </span>
                )}
            </div>
        </CarouselItem>
    ))}
</CarouselContent>

                        <CarouselPrevious
                            className="border-primary text-white bg-primary hover:bg-primary hover:text-white"
                            style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                        />
                        <CarouselNext
                            className="border-primary text-white bg-primary hover:bg-primary hover:text-white"
                            style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                        />
                    </Carousel>
                </div>
                {readMoreLink && (
                    <button
                        className="bg-transparent border border-primary text-primary hover:text-white hover:bg-primary hover:border-primary text-[17px] py-1 px-5 rounded-full duration-300 block md:hidden mt-5 ml-auto"
                        style={{
                            borderColor: primaryColor,
                            color: primaryColor,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = primaryColor;
                            e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = primaryColor;
                        }}
                    >
                        Read More
                    </button>
                )}
            </div>
            <Image
                src="/overlay5.png"
                alt="overlay"
                width={300}
                height={400}
                className="w-[200px] absolute top-0 left-20 z-1"
            />
        </div>
    );
}