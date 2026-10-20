"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { IoClose, IoStarSharp } from "react-icons/io5";
import { useArtist } from "@/contexts/ArtistContext";
import { useCart } from "@/contexts/CartContext";
import { useFanAuth } from "@/hooks/useFanAuth";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"; // if you have shadcn dialog; else use a simple modal

export default function StoreSection({ content }: { content: any }) {
  const { settings } = useArtist();
  const { addItem } = useCart();
  const { isLoggedIn } = useFanAuth();
  const primaryColor = settings?.primary_color || "#5D2FDB";

  const {
    heading = "Store",
    description = "Music is the way to express your emotions...",
    products = [],
  } = content;

  const [selectedProduct, setSelectedProduct] = useState<any>(null); // for modal

  const handleAddToCart = (product: any) => {
    if (!isLoggedIn) {
      toast.error("Please login first");
      console.log("User not logged in. Cannot add to cart.",isLoggedIn);
      return;
    }
    addItem({
      id: product.name || product.title || `product-${Date.now()}`,
      title: product.name || product.title,
      price: parseFloat(product.price) || 0,
      image: product.image || "/placeholder.png",
    });
    toast.success(`${product.name || product.title} added to cart`);
  };

  return (
    <section className="relative py-[50px] lg:py-[80px] bg-[#F6EDEE] max-w-full overflow-hidden">
      <div className="container relative z-2">
        <h2 className="text-center text-4xl md:text-5xl font-bold text-[#35235B]">
          {heading}
        </h2>
        <p className="text-center text-gray-500 mt-4 w-full max-w-xl mx-auto">
          {description}
        </p>
        <div className="mt-6 lg:mt-10">
          <Carousel opts={{ align: "start", loop: true }} className="w-full">
        <CarouselContent className="items-stretch">
  {products.length === 0 ? (
    <CarouselItem className="basis-full">
      <div className="text-center py-10 text-gray-500">
        No products yet.
      </div>
    </CarouselItem>
  ) : (
    products.map((product: any, idx: number) => (
      <CarouselItem
        key={idx}
        className="basis-full md:basis-1/2 lg:basis-1/3 h-auto"
      >
        <div
          className="flex flex-col items-start cursor-pointer h-full bg-white"
          onClick={() => setSelectedProduct(product)}
        >
          <div className="relative w-full aspect-[4/5] overflow-hidden">
            <Image
              src={product.image || "/placeholder.png"}
              alt={product.name || product.title}
              fill
              unoptimized={true}
              className="object-cover"
            />
          </div>
          <div className="flex w-full flex-1">
            <div className="flex-1 bg-white p-2 flex flex-col justify-center">
              <p className="text-xl line-clamp-1">
                {product.name || product.title}
              </p>
              <div className="flex gap-3 items-center">
                <p>${product.price}</p>
                <div className="flex items-center">
                  {[...Array(product.stars || 0)].map((_, i) => (
                    <IoStarSharp
                      key={i}
                      className="text-yellow-500 size-3"
                    />
                  ))}
                </div>
              </div>
            </div>
            <div
              className="w-[100px] flex items-center justify-center bg-primary shrink-0"
              style={{ backgroundColor: primaryColor }}
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(product);
              }}
            >
              <span className="border-b-2 text-white border-white leading-[100%] text-[15px] text-center px-1">
                Add To Cart
              </span>
            </div>
          </div>
        </div>
      </CarouselItem>
    ))
  )}
</CarouselContent>
            <CarouselPrevious
              className="border-primary text-white bg-primary hover:bg-primary hover:text-white"
              style={{
                backgroundColor: primaryColor,
                borderColor: primaryColor,
              }}
            />
            <CarouselNext
              className="border-primary text-white bg-primary hover:bg-primary hover:text-white"
              style={{
                backgroundColor: primaryColor,
                borderColor: primaryColor,
              }}
            />
          </Carousel>
        </div>
      </div>

      {/* Product Detail Modal */}
      <Dialog
        open={!!selectedProduct}
        onOpenChange={(open: boolean) => !open && setSelectedProduct(null)}
      >
        <DialogContent className="max-w-3xl min-w-[50vw] p-0 overflow-hidden">
          <DialogClose className="absolute right-4 top-4 z-10 rounded-full bg-white/90 backdrop-blur p-1.5 shadow-sm hover:bg-white transition">
            <IoClose size={20} className="text-gray-700" />
          </DialogClose>

          {selectedProduct && (
            <div className="flex flex-col md:flex-row">
              {/* Image */}
              <div className="relative w-full md:w-1/2 h-72 md:h-[480px] bg-gray-50 flex items-center justify-center">
                <Image
                  src={selectedProduct.image || "/placeholder.png"}
                  alt={selectedProduct.name || selectedProduct.title}
                  fill
                  className="object-contain p-6"
                  unoptimized
                />
              </div>

              {/* Details */}
              <div className="flex-1 flex flex-col p-6 md:p-8 space-y-5">
                <div className="space-y-2">
                  <DialogTitle className="text-2xl font-bold leading-tight pr-8">
                    {selectedProduct.name || selectedProduct.title}
                  </DialogTitle>

                  {selectedProduct.stars > 0 && (
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <IoStarSharp
                          key={i}
                          className={
                            i < selectedProduct.stars
                              ? "text-yellow-500"
                              : "text-gray-200"
                          }
                          size={16}
                        />
                      ))}
                      <span className="text-sm text-gray-400 ml-1">
                        ({selectedProduct.stars}.0)
                      </span>
                    </div>
                  )}
                </div>

                <p
                  className="text-3xl font-bold"
                  style={{ color: primaryColor }}
                >
                  ${selectedProduct.price}
                </p>

                <p className="text-gray-600 leading-relaxed">
                  {selectedProduct.description || "No description available."}
                </p>

                <div className="flex-1" />

                <button
                  onClick={() => {
                    handleAddToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="w-full py-3.5 rounded-xl text-white font-semibold text-base transition hover:opacity-90 active:scale-[0.99] shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Image
        src="/overlay1.png"
        alt="overlay"
        width={300}
        height={400}
       
        className="md:w-[100px] absolute bottom-10 right-0 z-1"
      />
    </section>
  );
}
