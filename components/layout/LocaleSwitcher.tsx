'use client';

import React from 'react';
import { Select } from 'antd';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { GlobalOutlined } from '@ant-design/icons';

export function LocaleSwitcher() {
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
            value={locale}
            onChange={handleLocaleChange}
            variant="borderless"
            suffixIcon={<GlobalOutlined style={{ fontSize: '14px', color: '#f59e0b' }} />}
            style={{ width: 100, color: '#f59e0b' }}
            popupMatchSelectWidth={false}
            options={[
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Español' },
                { value: 'de', label: 'Deutsch' },
                { value: 'it', label: 'Italiano' },
            ]}
        />
    );
}
