'use client';

import React, { useState, useRef } from 'react';
import { Carousel } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTheme } from '@/lib/ThemeContext';
import type { CarouselRef } from 'antd/es/carousel';

interface ImageCarouselProps {
    images: string[];
    alt: string;
}

export function ImageCarousel({ images, alt }: ImageCarouselProps) {
    const { mode } = useTheme();
    const [currentSlide, setCurrentSlide] = useState(0);
    const carouselRef = useRef<CarouselRef>(null);

    if (!images || images.length === 0) return null;

    const goTo = (index: number) => {
        carouselRef.current?.goTo(index);
        setCurrentSlide(index);
    };

    const next = () => carouselRef.current?.next();
    const prev = () => carouselRef.current?.prev();

    return (
        <div style={{ position: 'relative' }}>
            {/* Main Carousel */}
            <div style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                background: 'var(--hios-bg-secondary)',
            }}>
                <Carousel
                    ref={carouselRef}
                    dots={false}
                    afterChange={setCurrentSlide}
                    style={{ borderRadius: '16px' }}
                >
                    {images.map((img, idx) => (
                        <div key={idx}>
                            <div style={{
                                position: 'relative',
                                width: '100%',
                                aspectRatio: '16/10',
                            }}>
                                <Image
                                    src={img}
                                    alt={`${alt} - ${idx + 1}`}
                                    fill
                                    style={{ objectFit: 'contain' }}
                                    sizes="(max-width: 768px) 100vw, 900px"
                                    priority={idx === 0}
                                />
                            </div>
                        </div>
                    ))}
                </Carousel>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={prev}
                            style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '44px',
                                height: '44px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                transition: 'all 0.2s',
                                zIndex: 10,
                            }}
                            aria-label="Previous image"
                        >
                            <LeftOutlined style={{ color: mode === 'dark' ? '#fff' : '#333', fontSize: '16px' }} />
                        </button>
                        <button
                            onClick={next}
                            style={{
                                position: 'absolute',
                                right: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '44px',
                                height: '44px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                transition: 'all 0.2s',
                                zIndex: 10,
                            }}
                            aria-label="Next image"
                        >
                            <RightOutlined style={{ color: mode === 'dark' ? '#fff' : '#333', fontSize: '16px' }} />
                        </button>
                    </>
                )}

                {/* Slide Counter */}
                <div style={{
                    position: 'absolute',
                    bottom: '16px',
                    right: '16px',
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 500,
                }}>
                    {currentSlide + 1} / {images.length}
                </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '12px',
                    overflowX: 'auto',
                    paddingBottom: '8px',
                }}>
                    {images.map((img, idx) => (
                        <motion.button
                            key={idx}
                            onClick={() => goTo(idx)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                position: 'relative',
                                width: '80px',
                                height: '60px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: currentSlide === idx
                                    ? '2px solid var(--accent)'
                                    : '2px solid var(--hios-border)',
                                cursor: 'pointer',
                                padding: 0,
                                background: 'transparent',
                                opacity: currentSlide === idx ? 1 : 0.6,
                                transition: 'all 0.2s',
                                flexShrink: 0,
                            }}
                            aria-label={`View image ${idx + 1}`}
                        >
                            <Image
                                src={img}
                                alt={`Thumbnail ${idx + 1}`}
                                fill
                                style={{ objectFit: 'cover' }}
                                sizes="80px"
                            />
                        </motion.button>
                    ))}
                </div>
            )}
        </div>
    );
}
