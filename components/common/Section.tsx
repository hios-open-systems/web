'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Typography } from 'antd';
import { useTheme } from '@/lib/ThemeContext';
import { getColor, layout } from '@/config/theme';

const { Title, Paragraph } = Typography;

// ============================================
// Section Container
// ============================================

interface SectionProps {
    children: ReactNode;
    variant?: 'default' | 'alt' | 'muted';
    padding?: 'default' | 'compact' | 'large' | 'none';
    maxWidth?: 'narrow' | 'default' | 'wide' | 'full';
    className?: string;
    id?: string;
}

/**
 * Reusable section container with theme-aware styling
 *
 * Usage:
 *   <Section variant="alt" maxWidth="wide">
 *     <SectionHeader title="Projects" subtitle="My work" />
 *     <Content />
 *   </Section>
 */
export function Section({
    children,
    variant = 'default',
    padding = 'default',
    maxWidth = 'default',
    className,
    id,
}: SectionProps) {
    const { mode } = useTheme();

    const getBg = () => {
        switch (variant) {
            case 'alt':
                return getColor(mode, 'bgAlt');
            case 'muted':
                return getColor(mode, 'bgMuted');
            default:
                return getColor(mode, 'bg');
        }
    };

    const getPadding = () => {
        switch (padding) {
            case 'compact':
                return layout.sectionPaddingCompact;
            case 'large':
                return layout.sectionPaddingLarge;
            case 'none':
                return '0';
            default:
                return layout.sectionPadding;
        }
    };

    const borderStyle = variant === 'alt'
        ? {
            borderTop: `1px solid ${getColor(mode, 'borderMuted')}`,
            borderBottom: `1px solid ${getColor(mode, 'borderMuted')}`,
        }
        : {};

    return (
        <section
            id={id}
            className={className}
            style={{
                padding: getPadding(),
                background: getBg(),
                ...borderStyle,
            }}
        >
            <div style={{
                maxWidth: layout.maxWidth[maxWidth],
                margin: '0 auto',
            }}>
                {children}
            </div>
        </section>
    );
}

// ============================================
// Section Header
// ============================================

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    badge?: ReactNode;
    centered?: boolean;
    animate?: boolean;
}

/**
 * Reusable section header with optional badge
 *
 * Usage:
 *   <SectionHeader
 *     title="Projects"
 *     subtitle="Things I've built"
 *     badge={<CodeOutlined />}
 *   />
 */
// `animate` se acepta por compatibilidad pero ya no anima: las animaciones de
// entrada se eliminaron del sitio (costaban CLS y daban look de template).
export function SectionHeader({
    title,
    subtitle,
    badge,
    centered = true,
}: SectionHeaderProps) {
    const { mode } = useTheme();

    const content = (
        <div style={{
            textAlign: centered ? 'center' : 'left',
            marginBottom: '48px',
        }}>
            {badge && (
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    background: getColor(mode, 'bgMuted'),
                    borderRadius: '20px',
                    marginBottom: '16px',
                }}>
                    {badge}
                </div>
            )}
            <Title level={2} style={{
                color: getColor(mode, 'text'),
                marginBottom: subtitle ? '12px' : '0',
            }}>
                {title}
            </Title>
            {subtitle && (
                <Paragraph style={{
                    color: getColor(mode, 'textSubtle'),
                    fontSize: '15px',
                    marginBottom: 0,
                }}>
                    {subtitle}
                </Paragraph>
            )}
        </div>
    );

    return content;
}

// ============================================
// Icon Box
// ============================================

interface IconBoxProps {
    icon: ReactNode;
    color: string;
    size?: 'sm' | 'md' | 'lg';
    animate?: boolean;
}

/**
 * Colored icon container
 *
 * Usage:
 *   <IconBox icon={<RocketOutlined />} color="#4096ff" />
 */
export function IconBox({ icon, color, size = 'md', animate = false }: IconBoxProps) {
    const sizes = {
        sm: { box: 32, icon: 14 },
        md: { box: 44, icon: 20 },
        lg: { box: 56, icon: 24 },
    };

    const s = sizes[size];

    const content = (
        <div style={{
            width: s.box,
            height: s.box,
            borderRadius: layout.radius.lg,
            background: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: s.icon,
            color: color,
            flexShrink: 0,
        }}>
            {icon}
        </div>
    );

    if (animate) {
        return (
            <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
                {content}
            </motion.div>
        );
    }

    return content;
}

// ============================================
// Card
// ============================================

interface CardProps {
    children: ReactNode;
    onClick?: () => void;
    active?: boolean;
    activeColor?: string;
    padding?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * Theme-aware card component
 *
 * Usage:
 *   <Card onClick={() => {}} active={isActive} activeColor="#4096ff">
 *     <Content />
 *   </Card>
 */
export function Card({
    children,
    onClick,
    active = false,
    activeColor,
    padding = 'md',
    className,
}: CardProps) {
    const { mode } = useTheme();

    const paddings = {
        sm: '12px',
        md: '20px',
        lg: '24px',
    };

    const borderColor = active && activeColor
        ? `${activeColor}40`
        : getColor(mode, 'borderStrong');

    return (
        <div
            className={className}
            onClick={onClick}
            style={{
                background: getColor(mode, 'bgCard'),
                border: `1px solid ${borderColor}`,
                borderRadius: layout.radius.lg,
                padding: paddings[padding],
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
            }}
        >
            {children}
        </div>
    );
}

// ============================================
// Divider
// ============================================

interface DividerProps {
    spacing?: 'sm' | 'md' | 'lg';
}

/**
 * Theme-aware divider
 */
export function Divider({ spacing = 'md' }: DividerProps) {
    const { mode } = useTheme();

    const spacings = {
        sm: { margin: '12px', padding: '12px' },
        md: { margin: '20px', padding: '16px' },
        lg: { margin: '24px', padding: '20px' },
    };

    const s = spacings[spacing];

    return (
        <div style={{
            borderTop: `1px solid ${getColor(mode, 'borderMuted')}`,
            marginTop: s.margin,
            paddingTop: s.padding,
        }} />
    );
}

// ============================================
// Badge
// ============================================

interface BadgeProps {
    children: ReactNode;
    color?: string;
    variant?: 'default' | 'outline';
}

/**
 * Small badge/pill component
 */
export function Badge({ children, color, variant = 'default' }: BadgeProps) {
    const { mode } = useTheme();

    const style = variant === 'outline'
        ? {
            background: 'transparent',
            border: `1px solid ${color || getColor(mode, 'borderStrong')}`,
            color: color || getColor(mode, 'textMuted'),
        }
        : {
            background: color ? `${color}15` : getColor(mode, 'bgMuted'),
            color: color || getColor(mode, 'textMuted'),
        };

    return (
        <span style={{
            padding: '4px 10px',
            borderRadius: layout.radius.sm,
            fontSize: '12px',
            fontWeight: 500,
            ...style,
        }}>
            {children}
        </span>
    );
}

// ============================================
// Text helpers
// ============================================

interface ThemedTextProps {
    children: ReactNode;
    variant?: 'default' | 'strong' | 'muted' | 'subtle';
    size?: 'sm' | 'md' | 'lg';
    as?: 'span' | 'p' | 'div';
}

/**
 * Theme-aware text component
 */
export function ThemedText({
    children,
    variant = 'default',
    size = 'md',
    as: Component = 'span',
}: ThemedTextProps) {
    const { mode } = useTheme();

    const colors: Record<string, keyof typeof import('@/config/theme').colors.light> = {
        default: 'textMuted',
        strong: 'textStrong',
        muted: 'textMuted',
        subtle: 'textSubtle',
    };

    const sizes = {
        sm: '12px',
        md: '14px',
        lg: '16px',
    };

    return (
        <Component style={{
            color: getColor(mode, colors[variant]),
            fontSize: sizes[size],
        }}>
            {children}
        </Component>
    );
}
