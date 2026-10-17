'use client';

import React from 'react';
import { Select } from 'antd';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { GlobalOutlined } from '@ant-design/icons';

interface LocaleSwitcherProps {
    className?: string;
}

export function LocaleSwitcher({ className }: LocaleSwitcherProps) {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const handleLocaleChange = (newLocale: string) => {
        // Redirigir a la misma ruta pero con el nuevo locale
        const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPathname || `/${newLocale}`);
    };

    return (
        <Select
            className={className}
            value={locale}
            onChange={handleLocaleChange}
            variant="borderless"
            suffixIcon={<GlobalOutlined style={{ fontSize: '13px', color: 'var(--hios-text-secondary)' }} />}
            popupMatchSelectWidth={false}
            options={[
                { value: 'en', label: 'EN · English' },
                { value: 'es', label: 'ES · Español' },
                { value: 'de', label: 'DE · Deutsch' },
                { value: 'it', label: 'IT · Italiano' },
            ]}
        />
    );
}
